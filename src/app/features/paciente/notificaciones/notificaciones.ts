
import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { AutenticacionService } from
  '../../../core/services/autenticacion.service';

import { NotificacionesService } from
  './services/notificaciones.service';

import { Notificacion } from
  './models/notificaciones.model';

@Component({
  selector: 'app-notificaciones-paciente',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
})
export class NotificacionesPaciente implements OnInit {
  private readonly autenticacion = inject(AutenticacionService);

  private readonly notificacionesService = inject(NotificacionesService);

  // Estado del panel
  abierto = signal(false);

  // Información del backend
  notificaciones = signal<Notificacion[]>([]);
  noLeidas = this.notificacionesService.noLeidas;

  // Estados visuales
  cargando = signal(false);
  errorCarga = signal('');
  errorAccion = signal('');

  marcandoId = signal<number | null>(null);

  notificacionesOrdenadas = computed(() =>
    [...this.notificaciones()].sort(
      (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime(),
    ),
  );

  ngOnInit(): void {
    this.actualizarContador();
  }

  private obtenerUsuarioId(): number | null {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      return null;
    }

    return sesion.usuarioId;
  }

  // Actualizar contador de la campana
  actualizarContador(): void {
    const usuarioId = this.obtenerUsuarioId();

    if (usuarioId === null) {
      return;
    }

    this.notificacionesService.contarNoLeidas(usuarioId).subscribe({
      error: (error: HttpErrorResponse) => {
        console.error('Error al contar notificaciones:', error);
      },
    });
  }

  // Abrir / cerrar panel
  alternarPanel(): void {
    if (this.abierto()) {
      this.cerrarPanel();
    } else {
      this.abrirPanel();
    }
  }

  abrirPanel(): void {
    this.abierto.set(true);
    this.cargarNotificaciones();
  }

  cerrarPanel(): void {
    this.abierto.set(false);
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.abierto()) {
      this.cerrarPanel();
    }
  }

  // Consultar notificaciones
  cargarNotificaciones(): void {
    const usuarioId = this.obtenerUsuarioId();

    if (usuarioId === null) {
      this.cargando.set(false);
      this.errorCarga.set('Debes iniciar sesión como paciente.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');
    this.errorAccion.set('');

    this.notificacionesService.listar(usuarioId).subscribe({
      next: (respuesta) => {
        this.notificaciones.set(respuesta);
        this.cargando.set(false);
        this.actualizarContador();
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error al consultar notificaciones:', error);

        this.cargando.set(false);

        this.errorCarga.set(
          error.status === 403
            ? 'No tienes permiso para consultar estas notificaciones.'
            : 'No se pudieron cargar las notificaciones.',
        );
      },
    });
  }

  // Marcar una notificación como leída
  marcarComoLeida(notificacion: Notificacion): void {
    if (notificacion.leido || this.marcandoId() !== null) {
      return;
    }

    const usuarioId = this.obtenerUsuarioId();

    if (usuarioId === null) {
      return;
    }

    this.marcandoId.set(notificacion.id);
    this.errorAccion.set('');

    this.notificacionesService.marcarComoLeida(notificacion.id, usuarioId).subscribe({
      next: () => {
        this.notificaciones.update((lista) =>
          lista.map((item) => (item.id === notificacion.id ? { ...item, leido: true } : item)),
        );

        this.marcandoId.set(null);
        this.actualizarContador();
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error al marcar como leída:', error);

        this.errorAccion.set('No se pudo marcar la notificación como leída.');

        this.marcandoId.set(null);
      },
    });
  }
}
