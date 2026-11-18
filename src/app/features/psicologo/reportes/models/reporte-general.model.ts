export interface ActividadSemanal {
  semana: number;
  registros: number;
  episodios: number;
}

export interface PacienteActividad {
  pacienteId: number;
  nombreCompleto: string;
  registros: number;
  episodios: number;
}

export interface CoberturaSeguimiento {
  pacientesConActividad: number;
  pacientesActivos: number;
  porcentaje: number;
}

export interface PacientesActivosSemana {
  semana: number;
  cantidad: number;
}

export interface ReporteGeneral {
  pacientesActivos: number;
  registrosRecibidos: number;
  episodiosConfirmados: number;
  promedioRegistrosPorPaciente: number;
  actividadSemanal: ActividadSemanal[];
  pacientesMayorActividad: PacienteActividad[];
  pacientesConEpisodios: number;
  cobertura: CoberturaSeguimiento;
  pacientesActivosPorSemana: PacientesActivosSemana[];
}
