import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { EpisodioPaciente } from '../models/episodio-paciente.model';

@Injectable({ providedIn: 'root' })
export class EpisodiosPacienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/pacientes`;

  // HU27: episodios que el paciente confirmó (respuesta SI)
  listarConfirmados(pacienteId: number): Observable<EpisodioPaciente[]> {
    return this.http.get<EpisodioPaciente[]>(`${this.url}/${pacienteId}/eventos/confirmados`);
  }
}
