// HU26: métricas del wearable del paciente
export interface EvolucionDia {
  fecha: string;
  frecuenciaCardiacaPromedio: number | null;
  horasSueno: number | null;
  pasos: number | null;
  fechaResumenWearable: string | null;
  resumenAnterior: boolean;
}

export interface LecturaReciente {
  fechaHora: string;
  frecuenciaCardiaca: number;
}

export interface DatosWearable {
  frecuenciaCardiacaPromedio: number | null;
  horasSuenoPromedio: number | null;
  pasosPromedio: number | null;
  evolucionUltimos7Dias: EvolucionDia[];
  lecturasRecientes: LecturaReciente[];
}
