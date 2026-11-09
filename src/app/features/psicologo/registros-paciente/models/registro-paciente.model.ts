// HU25: registros de bienestar de un paciente consultados por el psicólogo
export interface RegistroPaciente {
  registroId: number;
  fechaHora: string;
  nivelAnsiedad: number;
  estadoAnimo: string;
  comentario: string | null;
}
