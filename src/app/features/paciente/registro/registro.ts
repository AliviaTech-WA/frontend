import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { EstadoAnimo, RegistroBienestarDetalle } from './models/registro-bienestar.model';
import { RegistroBienestarService } from './services/registro-bienestar.service';

@Component({
  selector: 'app-registro',
  imports: [],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro implements OnInit {
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

    // HU09: conserva el comentario antes de limpiar el formulario.
    const comentarioGuardado = this.comentario().trim() || null;

    this.registroService
      .registrar(sesion.usuarioId, {
        nivelAnsiedad: nivel,
        estadoAnimo: estado,
        comentario: comentarioGuardado,
      })
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (respuesta) => {
          // HU10: agrega al historial el registro confirmado por el backend.
          // Así aparece inmediatamente sin consultar nuevamente todos los registros.
          this.registros.update((actuales) => [
            {
              registroId: respuesta.registroId,
              fechaHora: respuesta.fechaHora,
              nivelAnsiedad: respuesta.nivelAnsiedad,
              estadoAnimo: respuesta.estadoAnimo,
              comentario: comentarioGuardado,
            },
            ...actuales,
          ]);

          // HU10: limpia cualquier error anterior del historial.
          this.errorRegistros.set('');

          // HU09: limpia el formulario después de guardar correctamente.
          this.nivelAnsiedad.set(null);
          this.estadoAnimo.set(null);
          this.comentario.set('');
          this.intentoGuardar.set(false);

          // HU09: muestra la ventana de confirmación.
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

  // HU10: almacena los registros obtenidos del backend.
  protected readonly registros = signal<RegistroBienestarDetalle[]>([]);

  // HU10: controla la carga y los errores del historial.
  protected readonly cargandoRegistros = signal(false);
  protected readonly errorRegistros = signal('');

  // HU10: consulta el historial cuando se abre Mi registro.
  ngOnInit(): void {
    this.cargarRegistros();
  }

  // HU10: obtiene los registros del paciente autenticado.
  protected cargarRegistros(): void {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.registros.set([]);
      this.errorRegistros.set('Debes iniciar sesión como paciente.');
      return;
    }

    this.cargandoRegistros.set(true);
    this.errorRegistros.set('');

    this.registroService
      .consultar(sesion.usuarioId)
      .pipe(finalize(() => this.cargandoRegistros.set(false)))
      .subscribe({
        next: (respuesta) => {
          // El backend devuelve los registros desde el más reciente.
          this.registros.set(respuesta);
        },
        error: (error: HttpErrorResponse) => {
          this.registros.set([]);
          this.errorRegistros.set(
            error.status === 403
              ? 'No tienes permiso para consultar estos registros.'
              : 'No se pudo cargar tu historial.',
          );
        },
      });
  }

  // HU10: muestra las fechas en el horario de Perú.
  protected formatearFecha(fechaHora: string): string {
    const fecha = new Date(fechaHora);
    const formatoDia = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const hoy = new Date();
    const ayer = new Date(hoy.getTime() - 86400000);

    const hora = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(fecha);

    if (formatoDia.format(fecha) === formatoDia.format(hoy)) {
      return `Hoy · ${hora}`;
    }

    if (formatoDia.format(fecha) === formatoDia.format(ayer)) {
      return `Ayer · ${hora}`;
    }

    const dia = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: 'numeric',
      month: 'short',
    }).format(fecha);

    return `${dia} · ${hora}`;
  }

  // HU10: convierte el estado del backend en un texto legible.
  protected mostrarEstado(estado: string): string {
    return estado.charAt(0) + estado.slice(1).toLowerCase();
  }
}
