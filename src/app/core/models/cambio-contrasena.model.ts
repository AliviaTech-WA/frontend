export interface CambiarContrasenaRequest {
  contrasenaActual: string;
  nuevaContrasena: string;
}

export interface CambiarContrasenaResponse {
  mensaje: string;
}
