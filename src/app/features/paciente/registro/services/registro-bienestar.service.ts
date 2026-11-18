import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';

import {
  RegistrarBienestarRequest,
  RegistroBienestarDetalle,
  RegistroBienestarResponse,
} from '../models/registro-bienestar.model';

@Injectable({
  providedIn: 'root',
})
export class RegistroBienestarService {
  private readonly http = inject(HttpClient);

  // HU09: dirección base de los endpoints del paciente.
  private readonly baseUrl = `${environment.apiUrl}/v1/pacientes`;

  // HU09: envía el registro al backend y recibe la confirmación.
  registrar(
    pacienteId: number,
    solicitud: RegistrarBienestarRequest,
  ): Observable<RegistroBienestarResponse> {
    return this.http.post<RegistroBienestarResponse>(
      `${this.baseUrl}/${pacienteId}/registros-bienestar`,
      solicitud,
    );
  }

  // HU10: consulta los registros anteriores del paciente autenticado.
  consultar(pacienteId: number): Observable<RegistroBienestarDetalle[]> {
    return this.http.get<RegistroBienestarDetalle[]>(
      `${this.baseUrl}/${pacienteId}/registros-bienestar`,
    );
  }
}
