import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RegistroPaciente } from '../models/registro-paciente.model';

@Injectable({ providedIn: 'root' })
export class RegistrosPacienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/pacientes`;

  // HU25: consultar los registros del paciente dentro de un periodo (fechas en formato yyyy-MM-dd)
  listar(pacienteId: number, desde?: string, hasta?: string): Observable<RegistroPaciente[]> {
    let params = new HttpParams();

    if (desde) {
      params = params.set('fechaDesde', `${desde}T00:00:00-05:00`);
    }

    if (hasta) {
      params = params.set('fechaHasta', `${hasta}T23:59:59-05:00`);
    }

    return this.http.get<RegistroPaciente[]>(`${this.url}/${pacienteId}/registros-bienestar`, { params });
  }
}
