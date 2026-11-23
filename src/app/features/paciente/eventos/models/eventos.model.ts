
export type EstadoConfirmacionEvento =
  | 'SI'
  | 'NO'
  | 'NO_ESTOY_SEGURO';

export interface EventoWearable {
  eventoId: number;
  fechaHoraInicio: string | null;
  fechaHoraFin: string | null;
  duracionMinutos: number | null;
  frecuenciaCardiacaMaxima: number | null;
  horasSuenoPrevio: number | null;
  nivelActividad: string | null;
  fechaResumenActividad: string | null;
  estadoConfirmacion: EstadoConfirmacionEvento | null;
  contextoPaciente: string | null;
  tiempoVariacion: number | null;
  fechaRespuesta: string | null;
  descripcionVariacion: string | null;
}

export interface ResponderEventoRequest {
  estadoConfirmacion: EstadoConfirmacionEvento;
  contexto: string | null;
}
