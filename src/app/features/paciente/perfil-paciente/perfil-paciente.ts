import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { ConsultaDispositivoAsignado } from '../dispositivos/models/dispositivo.model';
import { DispositivoService } from '../dispositivos/services/dispositivo.service';
import { ActualizarPerfilRequest, ContactoEmergencia, PerfilPersonal } from './models/perfil-personal.model';
import { PerfilPersonalService } from './services/perfil-personal.service';

@Component({
  selector: 'app-perfil-paciente',
  imports: [DatePipe, FormsModule],
  templateUrl: './perfil-paciente.html',
  styleUrl: './perfil-paciente.css',
})
export class PerfilPaciente implements OnInit {
  private readonly autenticacion = inject(AutenticacionService);
  // HU07: permite navegar al login después de cerrar la sesión.
  private readonly router = inject(Router);
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

  // HU21: edición de correo y teléfono
  modalDatosAbierto = signal(false);
  guardandoDatos = signal(false);
  errorDatos = signal('');
  mensajePerfil = signal('');
  correoFormulario = '';
  telefonoFormulario = '';

  // HU21: edición del contacto de emergencia
  modalContactoAbierto = signal(false);
  guardandoContacto = signal(false);
  errorContacto = signal('');
  contactoFormulario: ContactoEmergencia = this.contactoVacio();

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
    return this.aliasLimpio.length > 0 && this.aliasLimpio.length <= 100;
  }

  get aliasModificado(): boolean {
    return this.aliasLimpio !== (this.dispositivo()?.alias ?? '').trim();
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
      this.errorCarga.set('Inicia sesión como paciente para consultar tu dispositivo.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');

    this.dispositivoService
      .consultar(sesion.usuarioId)
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        }),
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
                : 'No pudimos cargar tu dispositivo. Intenta nuevamente.',
          );
        },
      });
  }

  // ==============================
  // HU21: EDITAR CORREO Y TELÉFONO
  // ==============================

  abrirEditarDatos(): void {
    const datos = this.perfil();
    if (!datos) return;

    this.correoFormulario = datos.correo;
    this.telefonoFormulario = datos.telefono ?? '';
    this.errorDatos.set('');
    this.mensajePerfil.set('');
    this.modalDatosAbierto.set(true);
  }

  cerrarEditarDatos(): void {
    if (this.guardandoDatos()) return;

    this.modalDatosAbierto.set(false);
    this.errorDatos.set('');
  }

  guardarDatos(): void {
    const datos = this.perfil();
    const sesion = this.autenticacion.sesion();
    if (!datos || this.guardandoDatos()) return;

    const correo = this.correoFormulario.trim();
    const telefono = this.telefonoFormulario.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      this.errorDatos.set('Ingresa un correo válido.');
      return;
    }

    if (!telefono || telefono.length > 20) {
      this.errorDatos.set('Ingresa un teléfono de hasta 20 caracteres.');
      return;
    }

    const solicitud: ActualizarPerfilRequest = {};
    if (correo !== datos.correo) solicitud.correo = correo;
    if (telefono !== (datos.telefono ?? '')) solicitud.telefono = telefono;

    if (!solicitud.correo && !solicitud.telefono) {
      this.cerrarEditarDatos();
      return;
    }

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorDatos.set('Tu sesión no está disponible. Vuelve a iniciar sesión.');
      return;
    }

    this.guardandoDatos.set(true);
    this.errorDatos.set('');

    this.perfilPersonalService
      .actualizar(sesion.usuarioId, solicitud)
      .pipe(finalize(() => this.guardandoDatos.set(false)))
      .subscribe({
        next: (respuesta) => {
          this.perfil.set({ ...datos, correo: respuesta.correo, telefono: respuesta.telefono });
          this.modalDatosAbierto.set(false);
          this.mensajePerfil.set('Tus datos de contacto se actualizaron correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorDatos.set(
            error.status === 409
              ? 'El correo ya está asociado a otra cuenta.'
              : error.status === 400
                ? 'Revisa los datos ingresados e intenta nuevamente.'
                : 'No se pudieron guardar los cambios. Intenta nuevamente.',
          );
        },
      });
  }

  // ==============================
  // HU21: EDITAR CONTACTO DE EMERGENCIA
  // ==============================

  abrirEditarContacto(): void {
    const datos = this.perfil();
    if (!datos) return;

    this.contactoFormulario = datos.contactoEmergencia
      ? { ...datos.contactoEmergencia, correo: datos.contactoEmergencia.correo ?? '' }
      : this.contactoVacio();
    this.errorContacto.set('');
    this.mensajePerfil.set('');
    this.modalContactoAbierto.set(true);
  }

  cerrarEditarContacto(): void {
    if (this.guardandoContacto()) return;

    this.modalContactoAbierto.set(false);
    this.errorContacto.set('');
  }

  guardarContacto(): void {
    const datos = this.perfil();
    const sesion = this.autenticacion.sesion();
    if (!datos || this.guardandoContacto()) return;

    const solicitud: ContactoEmergencia = {
      nombreCompleto: this.contactoFormulario.nombreCompleto.trim(),
      relacion: this.contactoFormulario.relacion.trim(),
      telefono: this.contactoFormulario.telefono.trim(),
      correo: (this.contactoFormulario.correo ?? '').trim() || null,
    };

    if (!solicitud.nombreCompleto || !solicitud.relacion || !solicitud.telefono) {
      this.errorContacto.set('Completa el nombre, la relación y el teléfono del contacto.');
      return;
    }

    if (solicitud.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(solicitud.correo)) {
      this.errorContacto.set('Ingresa un correo válido o deja el campo vacío.');
      return;
    }

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorContacto.set('Tu sesión no está disponible. Vuelve a iniciar sesión.');
      return;
    }

    this.guardandoContacto.set(true);
    this.errorContacto.set('');

    this.perfilPersonalService
      .guardarContacto(sesion.usuarioId, solicitud)
      .pipe(finalize(() => this.guardandoContacto.set(false)))
      .subscribe({
        next: (respuesta) => {
          this.perfil.set({
            ...datos,
            contactoEmergencia: {
              nombreCompleto: respuesta.nombreCompleto,
              relacion: respuesta.relacion,
              telefono: respuesta.telefono,
              correo: respuesta.correo,
            },
          });
          this.modalContactoAbierto.set(false);
          this.mensajePerfil.set('Tu contacto de emergencia se guardó correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorContacto.set(
            error.status === 400
              ? 'Revisa los datos del contacto e intenta nuevamente.'
              : 'No se pudo guardar el contacto. Intenta nuevamente.',
          );
        },
      });
  }

  private contactoVacio(): ContactoEmergencia {
    return { nombreCompleto: '', relacion: '', telefono: '', correo: '' };
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
          : 'El nombre no debe superar los 100 caracteres.',
      );
      return;
    }

    if (!this.aliasModificado) {
      this.cerrarRenombrar();
      return;
    }

    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorAlias.set('Tu sesión no está disponible. Vuelve a iniciar sesión.');
      return;
    }

    this.guardando.set(true);
    this.errorAlias.set('');

    this.dispositivoService
      .renombrar(sesion.usuarioId, { alias: this.aliasLimpio })
      .pipe(
        finalize(() => {
          this.guardando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.dispositivo.set(respuesta);
          this.modalAbierto.set(false);

          this.mensajeExito.set('El nombre de tu dispositivo se actualizó correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al renombrar:', error);

          this.errorAlias.set(
            error.status === 400
              ? 'El nombre no es válido. Revisa el campo e intenta nuevamente.'
              : error.status === 403
                ? 'No tienes permiso para modificar este dispositivo.'
                : 'No se pudo guardar el nombre. Intenta nuevamente.',
          );
        },
      });
  }

  // HU07: elimina la sesión del navegador y redirige al inicio de sesión.
  cerrarSesion(): void {
    this.autenticacion.cerrarSesionLocal();

    // Reemplaza la ruta actual para evitar regresar al perfil con Atrás.
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
