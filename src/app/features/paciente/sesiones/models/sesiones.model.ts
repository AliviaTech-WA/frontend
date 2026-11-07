
/**
 * HU19 - Consultar historial de sesiones
 */
export interface SesionResumen {
  sesionId: number;
  fechaSesion: string;
  resumenCompartido: string | null;
  recomendacionCompartida: string | null;
}

/**
 * HU20 - Consultar detalle de una sesión
 */
export interface SesionDetalle {
  sesionId: number;
  fechaSesion: string;
  resumenCompartido: string | null;
  recomendacionCompartida: string | null;
}
