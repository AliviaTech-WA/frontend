/* Datos del perfil que recibiremos del backend */
export interface PsicologoPerfil {
  psicologoId: number;
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  telefono: string;
  numeroColegiatura: string;
  especialidad: string;
}
/* Campos permitidos para actualizar el perfil */
export interface ActualizarPsicologoPerfil {
  correo?: string;
  telefono?: string;
  especialidad?: string;
}


