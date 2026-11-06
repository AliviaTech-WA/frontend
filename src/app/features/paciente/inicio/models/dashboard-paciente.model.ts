export interface DashboardPacienteModel {
  nombres: string;
  notificacionesPendientes: number;
  ultimoRegistro: UltimoRegistro | null;
  eventoPendiente: EventoPendiente | null;
  ultimaRecomendacion: UltimaRecomendacion | null;
  ultimaSesion: UltimaSesion | null;
  dispositivo: DispositivoInicio | null;
}

export interface UltimoRegistro {
  fechaHora: string;
}

export interface EventoPendiente {
  eventoId: number;
  fechaHoraInicio: string;
}

export interface UltimaRecomendacion {
  texto: string;
  psicologo: string;
  fecha: string;
}

export interface UltimaSesion {
  sesionId: number;
  fechaSesion: string;
  tieneResumen: boolean;
  tieneRecomendacion: boolean;
}

export interface DispositivoInicio {
  alias: string;
  modelo: string;
  estado: string;
  fechaUltimaSincronizacion: string | null;
}
