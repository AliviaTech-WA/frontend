export type EstadoConfirmacionEpisodio = 'SI' | 'NO' | 'NO_ESTOY_SEGURO';

// HU27: evento del wearable consultado por el psicólogo
export interface EpisodioPaciente {
  eventoId: number;
  fechaHoraInicio: string | null;
  fechaHoraFin: string | null;
  duracionMinutos: number | null;
  frecuenciaCardiacaMaxima: number | null;
  horasSuenoPrevio: number | null;
  nivelActividad: string | null;
  fechaResumenActividad: string | null;
  estadoConfirmacion: EstadoConfirmacionEpisodio | null;
  contextoPaciente: string | null;
  tiempoVariacion: number | null;
  fechaRespuesta: string | null;
  descripcionVariacion: string | null;
}
