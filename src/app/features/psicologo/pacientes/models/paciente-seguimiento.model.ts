export type NovedadPaciente = 'NUEVOS_EPISODIOS' | 'NUEVOS_REGISTROS' | 'SIN_NOVEDADES';

export interface PacienteSeguimiento {
  pacienteId: number;
  seguimientoId: number;
  nombres: string;
  apellidos: string;
  dni: string;
  novedad: NovedadPaciente;
  fechaUltimoRegistro: string | null;
  fechaUltimoEpisodio: string | null;
}
