import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ActivarPacienteRequest,
  ActivarPacienteResponse,
} from '../models/activacion-paciente.model';

@Injectable({ providedIn: 'root' })
export class ActivacionPacienteService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/v1/activaciones-pacientes`;

  activar(solicitud: ActivarPacienteRequest): Observable<ActivarPacienteResponse> {
    return this.http.post<ActivarPacienteResponse>(this.endpoint, solicitud);
  }
}
