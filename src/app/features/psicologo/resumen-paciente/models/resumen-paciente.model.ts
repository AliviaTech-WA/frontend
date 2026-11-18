// HU24: resumen del seguimiento de un paciente
export interface NovedadesResumen {
  registros: number;
  lecturasRelevantes: number;
  episodiosConfirmados: number;
}

export interface UltimoRegistro {
  fechaHora: string;
  nivelAnsiedad: number;
  estadoAnimo: string;
  comentario: string | null;
}

export interface DiaResumen {
  fecha: string;
  ansiedadPromedio: number | null;
  horasSueno: number | null;
}

export interface ResumenPeriodo {
  ansiedadPromedio: number | null;
  horasSuenoPromedio: number | null;
  dias: DiaResumen[];
}

export interface ResumenPaciente {
  pacienteId: number;
  seguimientoId: number;
  nombreCompleto: string;
  dni: string;
  fechaNacimiento: string | null;
  estadoSeguimiento: string;
  fechaInicioSeguimiento: string;
  fechaUltimaRevision: string | null;
  novedades: NovedadesResumen;
  ultimaSesion: string | null;
  ultimoEpisodio: string | null;
  ultimosRegistros: UltimoRegistro[];
  resumenPeriodo: ResumenPeriodo;
}
