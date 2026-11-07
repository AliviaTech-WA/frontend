
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Notificacion } from '../models/notificaciones.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private readonly http = inject(HttpClient);

  private readonly url =
    `${environment.apiUrl}/v1/notificaciones`;

  // HU18: consultar todas las notificaciones
  listar(usuarioId: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(
      `${this.url}/usuario/${usuarioId}`
    );
  }

  // HU18: obtener cantidad de notificaciones no leídas
  contarNoLeidas(usuarioId: number): Observable<number> {
    return this.http.get<number>(
      `${this.url}/usuario/${usuarioId}/no-leidas/conteo`
    );
  }

  // HU18: marcar una notificación como leída
  marcarComoLeida(
    notificacionId: number,
    usuarioId: number
  ): Observable<void> {

    const params = new HttpParams()
      .set('usuarioId', usuarioId.toString());

    return this.http.patch<void>(
      `${this.url}/${notificacionId}/leida`,
      {},
      { params }
    );
  }
}
