import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  MensajeResponse,
  RestablecerContrasenaRequest,
  SolicitarRecuperacionRequest,
  SolicitarRecuperacionResponse,
  ValidarCodigoRecuperacionRequest,
  ValidarCodigoRecuperacionResponse,
} from '../models/recuperacion-contrasena.model';

@Injectable({ providedIn: 'root' })
export class RecuperacionContrasenaService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/v1/recuperaciones-contrasena`;

  solicitar(solicitud: SolicitarRecuperacionRequest): Observable<SolicitarRecuperacionResponse> {
    return this.http.post<SolicitarRecuperacionResponse>(this.endpoint, solicitud);
  }

  validarCodigo(
    solicitud: ValidarCodigoRecuperacionRequest,
  ): Observable<ValidarCodigoRecuperacionResponse> {
    return this.http.post<ValidarCodigoRecuperacionResponse>(
      `${this.endpoint}/validar-codigo`,
      solicitud,
    );
  }

  restablecer(solicitud: RestablecerContrasenaRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.endpoint}/restablecer`, solicitud);
  }
}
