/* HU09: estados de ánimo permitidos por el backend. */
export type EstadoAnimo = 'TRANQUILO' | 'NEUTRAL' | 'TENSO' | 'CANSADO';

/* HU09: información que el paciente envía al registrar su bienestar. */
export interface RegistrarBienestarRequest {
  nivelAnsiedad: number;
  estadoAnimo: EstadoAnimo;
  comentario: string | null;
}

/* HU09: respuesta del backend después de guardar correctamente. */
export interface RegistroBienestarResponse {
  registroId: number;
  fechaHora: string;
  nivelAnsiedad: number;
  estadoAnimo: EstadoAnimo;
}
