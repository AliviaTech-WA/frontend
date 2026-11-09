// HU27: episodio confirmado por el paciente
export interface EpisodioPaciente {
  eventoId: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  duracionMinutos: number;
  frecuenciaCardiacaMaxima: number | null;
  horasSuenoPrevio: number | null;
  nivelActividad: string | null;
  estadoConfirmacion: string;
  contextoPaciente: string | null;
}
