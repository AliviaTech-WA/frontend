
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';

import {
  SesionResumen,
  SesionDetalle
} from '../models/sesiones.model';

@Injectable({
  providedIn: 'root'
})
export class SesionesService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiUrl}/v1`;

  /**
   * HU19
   * Consultar todas las sesiones del paciente.
   */
  listarSesiones(
    pacienteId: number
  ): Observable<SesionResumen[]> {

    return this.http.get<SesionResumen[]>(
      `${this.baseUrl}/pacientes/${pacienteId}/sesiones`
    );
  }

  /**
   * HU20
   * Consultar el detalle de una sesión específica.
   */
  obtenerDetalle(
    sesionId: number
  ): Observable<SesionDetalle> {

    return this.http.get<SesionDetalle>(
      `${this.baseUrl}/sesiones/${sesionId}`
    );
  }
}
