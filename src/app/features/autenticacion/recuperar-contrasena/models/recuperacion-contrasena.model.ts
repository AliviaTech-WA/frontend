export interface SolicitarRecuperacionRequest {
  correo: string;
}

export interface SolicitarRecuperacionResponse {
  recuperacionId: string;
  mensaje: string;
  expiraEnSegundos: number;
}

export interface ValidarCodigoRecuperacionRequest {
  recuperacionId: string;
  codigo: string;
}

export interface ValidarCodigoRecuperacionResponse {
  tokenRestablecimiento: string;
  expiraEnSegundos: number;
}

export interface RestablecerContrasenaRequest {
  tokenRestablecimiento: string;
  nuevaContrasena: string;
}

export interface MensajeResponse {
  mensaje: string;
}
