export interface ConsultaDispositivoAsignado {
  nombrePaciente: string;
  codigoDispositivo: string;
  modelo: string;
  estado: string;
  alias: string | null;
  fechaAsignacion: string;
  fechaUltimaSincronizacion: string | null;
}

export interface RenombrarDispositivoRequest{
  alias: string;
}