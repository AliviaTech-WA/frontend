import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CrearPsicologoRequest,
  CrearPsicologoResponse,
} from '../models/registro-psicologo.model';

@Injectable({ providedIn: 'root' })
export class RegistroPsicologoService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/v1/psicologos`;

  crear(solicitud: CrearPsicologoRequest): Observable<CrearPsicologoResponse> {
    return this.http.post<CrearPsicologoResponse>(this.endpoint, solicitud);
  }
}
