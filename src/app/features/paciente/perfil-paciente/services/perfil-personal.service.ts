import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ActualizarPerfilRequest,
  ContactoEmergencia,
  ContactoEmergenciaResponse,
  PerfilActualizadoResponse,
  PerfilPersonal,
} from '../models/perfil-personal.model';

@Injectable({ providedIn: 'root' })
export class PerfilPersonalService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/pacientes`;

  // HU21: consultar datos personales y contacto de emergencia
  consultar(pacienteId: number): Observable<PerfilPersonal> {
    return this.http.get<PerfilPersonal>(`${this.url}/${pacienteId}/perfil`);
  }

  // HU21: actualizar correo y teléfono
  actualizar(pacienteId: number, solicitud: ActualizarPerfilRequest): Observable<PerfilActualizadoResponse> {
    return this.http.put<PerfilActualizadoResponse>(`${this.url}/${pacienteId}/perfil`, solicitud);
  }

  // HU21: registrar o actualizar el contacto de emergencia
  guardarContacto(pacienteId: number, solicitud: ContactoEmergencia): Observable<ContactoEmergenciaResponse> {
    return this.http.put<ContactoEmergenciaResponse>(
      `${this.url}/${pacienteId}/contacto-emergencia`,
      solicitud,
    );
  }
}
