import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { NovedadPaciente, PacienteSeguimiento } from '../models/paciente-seguimiento.model';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/v1/psicologos`;

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
}
