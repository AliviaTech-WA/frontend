export interface DispositivoPacienteRequest {
  modelo: string;
  alias: string;
}

export interface RegistrarPacienteRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  correo: string;
  telefono: string;
  dispositivo: DispositivoPacienteRequest;
}

export interface RegistrarPacienteResponse {
  pacienteId: number;
  seguimientoId: number;
  dispositivoId: number;
  estadoCuenta: string;
  invitacionGenerada: boolean;
}
