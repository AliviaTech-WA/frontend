// HU22: indicadores del dashboard del psicólogo
export type TipoNovedad = 'NUEVOS_EPISODIOS' | 'NUEVOS_REGISTROS' | 'SIN_NOVEDADES';

export interface UltimaNovedad {
  pacienteId: number;
  nombreCompleto: string;
  tipo: TipoNovedad;
  fechaHora: string;
}

export interface ActividadDia {
  fecha: string;
  registrosManuales: number;
  episodiosConfirmados: number;
}

export interface DistribucionNovedades {
  conNuevosEpisodios: number;
  conNuevosRegistros: number;
  sinNovedades: number;
}

export interface DashboardPsicologo {
  pacientesActivos: number;
  invitacionesPendientes: number;
  tiempoMedioDesdeRevisionDias: number;
  ultimasNovedades: UltimaNovedad[];
  actividadUltimos7Dias: ActividadDia[];
  distribucionNovedades: DistribucionNovedades;
}
