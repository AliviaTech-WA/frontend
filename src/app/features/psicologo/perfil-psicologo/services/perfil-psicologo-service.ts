import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { PsicologoPerfil, ActualizarPsicologoPerfil } from '../models/psicologo-perfil.model';

@Injectable({
  providedIn: 'root',
})
export class PerfilPsicologoService {
  // URL base configurada para todo el proyecto
  private url = environment.apiUrl;

  // Cliente HTTP para comunicarnos con Spring Boot
  private httpClient: HttpClient = inject(HttpClient);

  constructor() {}

  // HU34 - Consultar el perfil del psicólogo
  obtenerPerfil(psicologoId: number): Observable<PsicologoPerfil> {
    return this.httpClient.get<PsicologoPerfil>(
      this.url + '/v1/psicologos/' + psicologoId + '/perfil',
    );
  }

  // HU34 - Actualizar los datos editables
  actualizarPerfil(
    psicologoId: number,
    datos: ActualizarPsicologoPerfil,
  ): Observable<PsicologoPerfil> {
    return this.httpClient.put<PsicologoPerfil>(
      this.url + '/v1/psicologos/' + psicologoId + '/perfil',
      datos,
    );
  }
}
