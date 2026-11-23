export interface CrearPsicologoRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  contrasena: string;
  numeroColegiatura: string;
  especialidad: string;
}

export interface CrearPsicologoResponse {
  psicologoId: number;
}
