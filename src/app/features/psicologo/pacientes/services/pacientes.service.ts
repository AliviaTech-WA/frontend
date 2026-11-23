import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { NovedadPaciente, PacienteSeguimiento } from '../models/paciente-seguimiento.model';
import {
  RegistrarPacienteRequest,
  RegistrarPacienteResponse,
} from '../../registrar-paciente/models/registro-paciente.model';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl.replace(/\/$/, '');
  private readonly apiV1 = this.apiBase.endsWith('/v1') ? this.apiBase : `${this.apiBase}/v1`;
  private readonly url = `${this.apiV1}/psicologos`;

  listarPacientes(
    psicologoId: number,
    busqueda = '',
    novedad?: NovedadPaciente,
  ): Observable<PacienteSeguimiento[]> {
    let params = new HttpParams();
    const texto = busqueda.trim();

    if (texto) {
      params = params.set('busqueda', texto);
    }

    if (novedad) {
      params = params.set('novedad', novedad);
    }

    return this.http.get<PacienteSeguimiento[]>(`${this.url}/${psicologoId}/pacientes`, { params });
  }

  registrarPaciente(
    psicologoId: number,
    solicitud: RegistrarPacienteRequest,
  ): Observable<RegistrarPacienteResponse> {
    return this.http.post<RegistrarPacienteResponse>(
      `${this.url}/${psicologoId}/pacientes`,
      solicitud,
    );
  }
}
