export type RolUsuario = 'PACIENTE' | 'PSICOLOGO';

export interface IniciarSesionRequest {
  correo: string;
  contrasena: string;
}

export interface IniciarSesionResponse {
  usuarioId: number;
  rol: string;
  tokenAcceso: string;
}

export interface SesionAutenticada {
  usuarioId: number;
  rol: RolUsuario;
  tokenAcceso: string;
}
