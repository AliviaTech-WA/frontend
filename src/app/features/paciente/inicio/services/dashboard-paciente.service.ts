import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DashboardPacienteModel } from '../models/dashboard-paciente.model';

@Injectable({ providedIn: 'root' })
export class DashboardPacienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/pacientes`;

  // HU08: consultar resumen del inicio del paciente
  consultar(pacienteId: number): Observable<DashboardPacienteModel> {
    return this.http.get<DashboardPacienteModel>(`${this.url}/${pacienteId}/inicio`);
  }
}
