
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { ConsultaDispositivoAsignado } from '../dispositivos/models/dispositivo.model';
import { DispositivoService } from '../dispositivos/services/dispositivo.service';
import { PerfilPersonal } from './models/perfil-personal.model';
import { PerfilPersonalService } from './services/perfil-personal.service';

@Component({
  selector: 'app-perfil-paciente',
  imports: [DatePipe, FormsModule],
  templateUrl: './perfil-paciente.html',
  styleUrl: './perfil-paciente.css',
})
export class PerfilPaciente implements OnInit {

  private readonly autenticacion = inject(AutenticacionService);
  private readonly dispositivoService = inject(DispositivoService);
  private readonly perfilPersonalService = inject(PerfilPersonalService);

  // HU21: datos personales y contacto de emergencia
  perfil = signal<PerfilPersonal | null>(null);
  cargandoPerfil = signal(false);
  errorPerfil = signal('');

  nombreCompleto = computed(() => {
    const datos = this.perfil();
    return datos ? `${datos.nombres} ${datos.apellidos}` : '';
  });

  iniciales = computed(() => {
    const datos = this.perfil();
    if (!datos) return '';
    return `${datos.nombres.charAt(0)}${datos.apellidos.charAt(0)}`.toUpperCase();
  });

  // HU14: Información del dispositivo
  dispositivo = signal<ConsultaDispositivoAsignado | null>(null);
  cargando = signal(false);
  errorCarga = signal('');

  // HU15: Estado del formulario y modal
  guardando = signal(false);
  errorAlias = signal('');
  mensajeExito = signal('');
  modalAbierto = signal(false);
  aliasFormulario = '';

  get aliasLimpio(): string {
    return this.aliasFormulario.trim();
  }

  get aliasValido(): boolean {
    return (
      this.aliasLimpio.length > 0 &&
      this.aliasLimpio.length <= 100
    );
  }

  get aliasModificado(): boolean {
    return this.aliasLimpio !==
      (this.dispositivo()?.alias ?? '').trim();
  }

  ngOnInit(): void {
    this.cargarPerfil();
    this.cargarDispositivo();
  }

  // ==============================
  // HU21: CONSULTAR PERFIL PERSONAL
  // ==============================

  cargarPerfil(): void {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorPerfil.set('Inicia sesión como paciente para consultar tu perfil.');
      return;
    }

    this.cargandoPerfil.set(true);
    this.errorPerfil.set('');

    this.perfilPersonalService
      .consultar(sesion.usuarioId)
      .pipe(finalize(() => this.cargandoPerfil.set(false)))
      .subscribe({
        next: (respuesta) => this.perfil.set(respuesta),
        error: (error: HttpErrorResponse) => {
          this.perfil.set(null);
          this.errorPerfil.set(
            error.status === 403
              ? 'No tienes permiso para consultar este perfil.'
              : 'No pudimos cargar tus datos. Intenta nuevamente.',
          );
        },
      });
  }

  // ==============================
  // HU14: CONSULTAR DISPOSITIVO
  // ==============================

  cargarDispositivo(): void {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.cargando.set(false);
      this.dispositivo.set(null);
      this.errorCarga.set(
        'Inicia sesión como paciente para consultar tu dispositivo.'
      );
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');

    this.dispositivoService.consultar(sesion.usuarioId)
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        })
      )
      .subscribe({
        next: (respuesta) => {
          console.log('Dispositivo recibido:', respuesta);
          this.dispositivo.set(respuesta);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error HTTP:', error);

          this.dispositivo.set(null);

          this.errorCarga.set(
            error.status === 404
              ? 'Todavía no tienes un dispositivo asignado.'
              : error.status === 403
                ? 'No tienes permiso para consultar este dispositivo.'
                : 'No pudimos cargar tu dispositivo. Intenta nuevamente.'
          );
        }
      });
  }

  // ==============================
  // HU15: RENOMBRAR DISPOSITIVO
  // ==============================

  abrirRenombrar(): void {
    const dispositivoActual = this.dispositivo();

    if (!dispositivoActual) return;

    this.aliasFormulario = dispositivoActual.alias ?? '';
    this.errorAlias.set('');
    this.mensajeExito.set('');
    this.modalAbierto.set(true);
  }
  
  cerrarRenombrar(): void {
    if (this.guardando()) return;

    this.modalAbierto.set(false);
    this.errorAlias.set('');
  }

  guardarAlias(): void {
    if (this.guardando()) return;

    if (!this.aliasValido) {
      this.errorAlias.set(
        this.aliasLimpio.length === 0
          ? 'Ingresa un nombre para tu dispositivo.'
          : 'El nombre no debe superar los 100 caracteres.'
      );
      return;
    }

    if (!this.aliasModificado) {
      this.cerrarRenombrar();
      return;
    }

    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorAlias.set(
        'Tu sesión no está disponible. Vuelve a iniciar sesión.'
      );
      return;
    }

    this.guardando.set(true);
    this.errorAlias.set('');

    this.dispositivoService.renombrar(
      sesion.usuarioId,
      { alias: this.aliasLimpio }
    )
      .pipe(
        finalize(() => {
          this.guardando.set(false);
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.dispositivo.set(respuesta);
          this.modalAbierto.set(false);

          this.mensajeExito.set(
            'El nombre de tu dispositivo se actualizó correctamente.'
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al renombrar:', error);

          this.errorAlias.set(
            error.status === 400
              ? 'El nombre no es válido. Revisa el campo e intenta nuevamente.'
              : error.status === 403
                ? 'No tienes permiso para modificar este dispositivo.'
                : 'No se pudo guardar el nombre. Intenta nuevamente.'
          );
        }
      });
  }
}
