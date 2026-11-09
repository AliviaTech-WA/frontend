import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

export type FuenteAnalisis = 'INTEGRADO' | 'REGISTROS' | 'WEARABLE';

export interface SolicitudAnalisis {
  fuente: FuenteAnalisis;
  periodoDesde: string;
  periodoHasta: string;
}

export interface ResultadoAnalisis {
  fuente: FuenteAnalisis;
  resumen: string;
  coincidencias: string;
  puntosRevision: string;
}

@Injectable({ providedIn: 'root' })
export class AnalisisIaService {
  private readonly http = inject(HttpClient);

  generar(pacienteId: number, solicitud: SolicitudAnalisis) {
    return this.http.post<ResultadoAnalisis>(
      `${environment.apiUrl}/v1/pacientes/${pacienteId}/analisis-ia`,
      solicitud,
    );
  }
}
