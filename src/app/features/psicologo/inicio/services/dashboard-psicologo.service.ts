import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DashboardPsicologo } from '../models/dashboard-psicologo.model';

@Injectable({ providedIn: 'root' })
export class DashboardPsicologoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/psicologos`;

  // HU22: consultar indicadores del seguimiento del psicólogo
  consultar(psicologoId: number): Observable<DashboardPsicologo> {
    return this.http.get<DashboardPsicologo>(`${this.url}/${psicologoId}/resumen-seguimiento`);
  }
}
