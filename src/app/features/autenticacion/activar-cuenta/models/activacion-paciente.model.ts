export interface ActivarPacienteRequest {
  correo: string;
  codigoActivacion: string;
  contrasena: string;
  aceptaTratamientoDatos: boolean;
}

export interface ActivarPacienteResponse {
  pacienteId: number;
  fechaActivacion: string;
}
