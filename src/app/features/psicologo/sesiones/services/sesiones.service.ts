import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  RegistrarSesionRequest,
  SesionCreada,
  SesionResumen,
} from '../models/sesion-resumen.model';

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/v1/pacientes`;

  listarSesiones(pacienteId: number): Observable<SesionResumen[]> {
    return this.http.get<SesionResumen[]>(`${this.url}/${pacienteId}/sesiones`);
  }

  registrarSesion(pacienteId: number, datos: RegistrarSesionRequest): Observable<SesionCreada> {
    return this.http.post<SesionCreada>(`${this.url}/${pacienteId}/sesiones`, datos);
  }
}
