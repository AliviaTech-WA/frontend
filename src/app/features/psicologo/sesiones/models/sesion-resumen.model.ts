export interface SesionResumen {
  sesionId: number;
  fechaSesion: string;
  resumenCompartido: string | null;
  recomendacionCompartida: string | null;
}

export interface RegistrarSesionRequest {
  fechaSesion: string;
  notaInterna: string | null;
  resumenCompartido: string | null;
  recomendacionCompartida: string | null;
}

export interface SesionCreada {
  sesionId: number;
  fechaSesion: string;
  fechaRegistro: string;
}
