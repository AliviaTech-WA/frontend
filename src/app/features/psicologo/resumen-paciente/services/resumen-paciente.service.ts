import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ResumenPaciente } from '../models/resumen-paciente.model';

@Injectable({ providedIn: 'root' })
export class ResumenPacienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/pacientes`;

  // HU24: consultar el resumen del paciente (registra la revisión del psicólogo)
  consultar(pacienteId: number): Observable<ResumenPaciente> {
    return this.http.get<ResumenPaciente>(`${this.url}/${pacienteId}/resumen-seguimiento`);
  }
}
