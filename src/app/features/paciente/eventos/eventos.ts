
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize, interval } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { EventoService } from './services/eventos.services';

import {
  EstadoConfirmacionEvento,
  EventoWearable
} from './models/eventos.model';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [FormsModule, DatePipe, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos implements OnInit {

  private readonly autenticacion = inject(AutenticacionService);
  private readonly eventoService = inject(EventoService);
  private readonly destroyRef = inject(DestroyRef);

  // HU13: evita que coincidan varias consultas automáticas.
  private actualizandoEventos = false;

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

    // HU13: busca nuevos eventos cada 30 segundos mientras se muestra esta página.
    // El backend detecta las variaciones por encima de 110 lpm.
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.actualizarEventosDetectados());
  }

  private obtenerPacienteId(): number | null {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      return null;
    }

    return sesion.usuarioId;
  }

  cargarEventos(): void {
    const pacienteId = this.obtenerPacienteId();

    if (pacienteId === null) {
      this.eventosPendientes.set([]);
      this.historial.set([]);
      this.cargandoPendientes.set(false);
      this.cargandoHistorial.set(false);
      this.errorPendientes.set(
        'Debes iniciar sesión como paciente.'
      );
      this.errorHistorial.set(
        'Debes iniciar sesión como paciente.'
      );
      return;
    }

    this.cargandoPendientes.set(true);
    this.cargandoHistorial.set(true);
    this.errorPendientes.set('');
    this.errorHistorial.set('');

    this.eventoService.obtenerEventosWearable(pacienteId)
      .pipe(
        finalize(() => {
          this.cargandoPendientes.set(false);
          this.cargandoHistorial.set(false);
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.actualizarListas(respuesta);
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Error al cargar eventos wearable:',
            error
          );

          this.eventosPendientes.set([]);
          this.historial.set([]);

          this.errorPendientes.set(
            error.status === 403
              ? 'No tienes permiso para consultar tus eventos pendientes.'
              : 'No se pudieron cargar los eventos pendientes.'
          );

          this.errorHistorial.set(
            error.status === 403
              ? 'No tienes permiso para consultar el historial.'
              : 'No se pudo cargar el historial de eventos.'
          );
        }
      });
  }

  // HU13, HU16 y HU17: conserva separados los pendientes y los eventos respondidos.
  private actualizarListas(eventos: EventoWearable[]): void {
    this.eventosPendientes.set(
      eventos.filter(evento => evento.estadoConfirmacion === null)
    );
    this.historial.set(
      eventos.filter(evento => evento.estadoConfirmacion !== null)
    );
  }

  // HU13: actualiza en segundo plano sin vaciar la pantalla ni borrar el contexto escrito.
  private actualizarEventosDetectados(): void {
    const pacienteId = this.obtenerPacienteId();

    if (
      pacienteId === null ||
      this.actualizandoEventos ||
      this.cargandoPendientes() ||
      this.guardandoEventoId() !== null
    ) {
      return;
    }

    this.actualizandoEventos = true;

    this.eventoService.obtenerEventosWearable(pacienteId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.actualizandoEventos = false;
        })
      )
      .subscribe({
        next: (eventos) => {
          // HU13: no interfiere con la confirmación de HU16 ni con recargas manuales.
          if (this.guardandoEventoId() !== null || this.cargandoPendientes()) {
            return;
          }

          this.actualizarListas(eventos);
        },
        error: () => {
          // HU13: si falla la consulta, mantiene la lista hasta la próxima actualización.
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
          this.cargarEventos();
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
