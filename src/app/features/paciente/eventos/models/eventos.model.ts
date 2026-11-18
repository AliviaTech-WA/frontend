
export type EstadoConfirmacionEvento =
  | 'SI'
  | 'NO'
  | 'NO_ESTOY_SEGURO';

export interface EventoWearable {
  eventoId: number;
  estadoConfirmacion: EstadoConfirmacionEvento | null;
  tiempoVariacion: number | null;
  comentario: string | null;
  fechaRespuesta: string | null;
}

export interface ResponderEventoRequest {
  estadoConfirmacion: EstadoConfirmacionEvento;
  contexto: string | null;
}
