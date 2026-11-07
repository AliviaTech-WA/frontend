import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { EstadoAnimo } from './models/registro-bienestar.model';
import { RegistroBienestarService } from './services/registro-bienestar.service';

@Component({
  selector: 'app-registro',
  imports: [],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly registroService = inject(RegistroBienestarService);

  // HU09: valores disponibles para la escala de ansiedad.
  protected readonly nivelesAnsiedad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // HU09: opciones de estado de ánimo aceptadas por el backend.
  protected readonly estadosAnimo: {
    valor: EstadoAnimo;
    etiqueta: string;
  }[] = [
    { valor: 'TRANQUILO', etiqueta: 'Tranquilo' },
    { valor: 'NEUTRAL', etiqueta: 'Neutral' },
    { valor: 'TENSO', etiqueta: 'Tenso' },
    { valor: 'CANSADO', etiqueta: 'Cansado' },
  ];

  // HU09: datos ingresados por el paciente.
  protected readonly nivelAnsiedad = signal<number | null>(null);
  protected readonly estadoAnimo = signal<EstadoAnimo | null>(null);
  protected readonly comentario = signal('');

  // HU09: controla la validación y el estado del guardado.
  protected readonly intentoGuardar = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorGuardado = signal('');

  // HU09: muestra la confirmación después de recibir 201 Created.
  protected readonly confirmacionVisible = signal(false);

  // HU09: selecciona el nivel de ansiedad.
  protected seleccionarNivel(nivel: number): void {
    this.nivelAnsiedad.set(nivel);
  }

  // HU09: selecciona el estado de ánimo.
  protected seleccionarEstado(estado: EstadoAnimo): void {
    this.estadoAnimo.set(estado);
  }

  // HU09: valida los campos y envía el registro al backend.
  protected guardarRegistro(): void {
    if (this.guardando()) {
      return;
    }

    this.intentoGuardar.set(true);
    this.errorGuardado.set('');

    const nivel = this.nivelAnsiedad();
    const estado = this.estadoAnimo();

    // Evita solicitudes si faltan datos obligatorios.
    if (nivel === null || estado === null) {
      return;
    }

    const sesion = this.autenticacion.sesion();

    // Comprueba que exista una sesión de paciente.
    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorGuardado.set('Debes iniciar sesión como paciente.');
      return;
    }

    this.guardando.set(true);

    this.registroService
      .registrar(sesion.usuarioId, {
        nivelAnsiedad: nivel,
        estadoAnimo: estado,
        comentario: this.comentario().trim() || null,
      })
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          // Limpia el formulario después de guardar correctamente.
          this.nivelAnsiedad.set(null);
          this.estadoAnimo.set(null);
          this.comentario.set('');
          this.intentoGuardar.set(false);

          // Presenta la confirmación diseñada en Figma.
          this.confirmacionVisible.set(true);
        },

        error: (error: HttpErrorResponse) => {
          this.errorGuardado.set(
            error.status === 400
              ? 'Revisa la información ingresada.'
              : 'No se pudo guardar tu registro. Intenta nuevamente.',
          );
        },
      });
  }

  // HU09: cierra el mensaje de confirmación.
  protected cerrarConfirmacion(): void {
    this.confirmacionVisible.set(false);
  }
}
