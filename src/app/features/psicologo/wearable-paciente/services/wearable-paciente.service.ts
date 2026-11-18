import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DatosWearable } from '../models/datos-wearable.model';

@Injectable({ providedIn: 'root' })
export class WearablePacienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/pacientes`;

  // HU26: métricas, evolución y lecturas del dispositivo activo del paciente
  consultar(pacienteId: number): Observable<DatosWearable> {
    return this.http.get<DatosWearable>(`${this.url}/${pacienteId}/wearable`);
  }
}
