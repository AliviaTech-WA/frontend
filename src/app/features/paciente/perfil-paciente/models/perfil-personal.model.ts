// HU21: datos personales y contacto de emergencia del paciente
export interface ContactoEmergencia {
  nombreCompleto: string;
  relacion: string;
  telefono: string;
  correo: string | null;
}

export interface PerfilPersonal {
  pacienteId: number;
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  telefono: string | null;
  fechaNacimiento: string | null;
  contactoEmergencia: ContactoEmergencia | null;
}

export interface ActualizarPerfilRequest {
  correo?: string;
  telefono?: string;
}

export interface PerfilActualizadoResponse {
  pacienteId: number;
  correo: string;
  telefono: string;
}

export interface ContactoEmergenciaResponse extends ContactoEmergencia {
  contactoId: number;
}
