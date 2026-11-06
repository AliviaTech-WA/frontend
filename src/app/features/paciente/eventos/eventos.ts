
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { EventoService } from './services/eventos.services';

import {
  EstadoConfirmacionEvento,
  EventoWearable
} from './models/eventos.model';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos implements OnInit {

  private readonly autenticacion = inject(AutenticacionService);
  private readonly eventoService = inject(EventoService);

  // =====================================
  // HU16: EVENTOS PENDIENTES
  // =====================================

  eventosPendientes = signal<EventoWearable[]>([]);
  cargandoPendientes = signal(false);
  errorPendientes = signal('');

  // Cada evento tiene su propio contexto
  contextos = signal<Record<number, string>>({});

  // ID del evento que se está guardando
  guardandoEventoId = signal<number | null>(null);

  // Mensajes al responder un evento
  errorRespuesta = signal('');
  errorRespuestaId = signal<number | null>(null);
  mensajeExito = signal('');

  // =====================================
  // HU17: HISTORIAL DE EVENTOS
  // =====================================

  historial = signal<EventoWearable[]>([]);
  cargandoHistorial = signal(false);
  errorHistorial = signal('');

  // =====================================
  // INICIALIZACIÓN
  // =====================================

  ngOnInit(): void {
    this.cargarEventos();
  }

  private obtenerPacienteId(): number | null {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      return null;
    }

    return sesion.usuarioId;
  }

  cargarEventos(): void {
    this.cargarPendientes();
    this.cargarHistorial();
  }

  // =====================================
  // HU16: CONSULTAR EVENTOS PENDIENTES
  // =====================================

  cargarPendientes(): void {
    const pacienteId = this.obtenerPacienteId();

    if (pacienteId === null) {
      this.eventosPendientes.set([]);
      this.cargandoPendientes.set(false);
      this.errorPendientes.set(
        'Debes iniciar sesión como paciente.'
      );
      return;
    }

    this.cargandoPendientes.set(true);
    this.errorPendientes.set('');

    this.eventoService.obtenerPendientes(pacienteId)
      .pipe(
        finalize(() => {
          this.cargandoPendientes.set(false);
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.eventosPendientes.set(respuesta);
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Error al cargar eventos pendientes:',
            error
          );

          this.eventosPendientes.set([]);

          this.errorPendientes.set(
            error.status === 403
              ? 'No tienes permiso para consultar tus eventos pendientes.'
              : 'No se pudieron cargar los eventos pendientes.'
          );
        }
      });
  }

  // =====================================
  // HU16: CONTEXTO INDIVIDUAL
  // =====================================

  actualizarContexto(
    eventoId: number,
    valor: string
  ): void {
    this.contextos.update(actual => ({
      ...actual,
      [eventoId]: valor
    }));
  }

  // =====================================
  // HU16: RESPONDER EVENTO
  // =====================================

  responderEvento(
    eventoId: number,
    estado: EstadoConfirmacionEvento
  ): void {

    // Evitar solicitudes duplicadas
    if (this.guardandoEventoId() !== null) {
      return;
    }

    const pacienteId = this.obtenerPacienteId();

    this.errorRespuesta.set('');
    this.errorRespuestaId.set(null);
    this.mensajeExito.set('');

    if (pacienteId === null) {
      this.errorRespuestaId.set(eventoId);
      this.errorRespuesta.set(
        'Tu sesión no está disponible.'
      );
      return;
    }

    const evento = this.eventosPendientes().find(
      e => e.eventoId === eventoId
    );

    if (!evento) {
      this.errorRespuestaId.set(eventoId);
      this.errorRespuesta.set(
        'El evento ya no está disponible.'
      );
      return;
    }

    const contexto =
      (this.contextos()[eventoId] ?? '').trim();

    this.guardandoEventoId.set(eventoId);

    this.eventoService.responder(
      pacienteId,
      eventoId,
      {
        estadoConfirmacion: estado,
        contexto: contexto || null
      }
    )
      .pipe(
        finalize(() => {
          this.guardandoEventoId.set(null);
        })
      )
      .subscribe({
        next: (respuesta) => {

          // Quitar solamente el evento respondido
          this.eventosPendientes.update(eventos =>
            eventos.filter(
              e => e.eventoId !== eventoId
            )
          );

          // Limpiar el contexto de ese evento
          this.contextos.update(actual => {
            const nuevos = { ...actual };
            delete nuevos[eventoId];
            return nuevos;
          });

          // Actualizar el historial visualmente
          this.historial.update(eventos => [
            respuesta,
            ...eventos.filter(
              e => e.eventoId !== eventoId
            )
          ]);

          this.mensajeExito.set(
            'Tu respuesta se registró correctamente.'
          );

          // Sincronizar nuevamente con el backend
          this.cargarPendientes();
          this.cargarHistorial();
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Error al responder evento:',
            error
          );

          this.errorRespuestaId.set(eventoId);

          this.errorRespuesta.set(
            error.status === 403
              ? 'No tienes permiso para responder este evento.'
              : error.status === 404
                ? 'El evento no existe o ya fue respondido.'
                : 'No se pudo registrar tu respuesta. Intenta nuevamente.'
          );
        }
      });
  }

  // =====================================
  // HU17: CONSULTAR HISTORIAL
  // =====================================

  cargarHistorial(): void {
    const pacienteId = this.obtenerPacienteId();

    if (pacienteId === null) {
      this.historial.set([]);
      this.cargandoHistorial.set(false);
      this.errorHistorial.set(
        'Debes iniciar sesión como paciente.'
      );
      return;
    }

    this.cargandoHistorial.set(true);
    this.errorHistorial.set('');

    this.eventoService.obtenerHistorial(pacienteId)
      .pipe(
        finalize(() => {
          this.cargandoHistorial.set(false);
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.historial.set(respuesta);
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Error al cargar historial:',
            error
          );

          this.errorHistorial.set(
            error.status === 403
              ? 'No tienes permiso para consultar el historial.'
              : 'No se pudo cargar el historial de eventos.'
          );
        }
      });
  }

  // =====================================
  // NOMBRES VISIBLES DE LOS ESTADOS
  // =====================================

  etiquetaEstado(
    estado: EstadoConfirmacionEvento | null
  ): string {

    switch (estado) {
      case 'SI':
        return 'Confirmado';

      case 'NO':
        return 'Descartado';

      case 'NO_ESTOY_SEGURO':
        return 'Incierto';

      default:
        return 'Pendiente';
    }
  }

  // =====================================
  // COLORES DE LOS ESTADOS
  // =====================================

  claseEstado(
    estado: EstadoConfirmacionEvento | null
  ): string {

    switch (estado) {
      case 'SI':
        return 'estado-confirmado';

      case 'NO':
        return 'estado-descartado';

      case 'NO_ESTOY_SEGURO':
        return 'estado-sin-confirmar';

      default:
        return 'estado-pendiente';
    }
  }
}
