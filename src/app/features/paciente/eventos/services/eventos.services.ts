
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';

import {
  EventoWearable,
  ResponderEventoRequest
} from '../models/eventos.model';

@Injectable({
  providedIn: 'root'
})
export class EventoService {

  private readonly http = inject(HttpClient);

  private readonly base =
    `${environment.apiUrl}/v1/pacientes`;

  // HU16: Obtener todos los eventos pendientes
  obtenerPendientes(
    pacienteId: number
  ): Observable<EventoWearable[]> {
    return this.http.get<EventoWearable[]>(
      `${this.base}/${pacienteId}/eventos/pendientes`
    );
  }

  // HU16: Responder un evento específico
  responder(
    pacienteId: number,
    eventoId: number,
    solicitud: ResponderEventoRequest
  ): Observable<EventoWearable> {
    return this.http.patch<EventoWearable>(
      `${this.base}/${pacienteId}/eventos/${eventoId}/respuesta`,
      solicitud
    );
  }

  // HU17: Obtener solamente eventos respondidos
  obtenerHistorial(
    pacienteId: number
  ): Observable<EventoWearable[]> {
    return this.http.get<EventoWearable[]>(
      `${this.base}/${pacienteId}/eventos/historial`
    );
  }
}
