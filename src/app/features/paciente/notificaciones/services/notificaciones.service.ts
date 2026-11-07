import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { computed, signal } from '@angular/core';
import { tap } from 'rxjs';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';

import { environment } from '../../../../../environments/environment';
import { Notificacion } from '../models/notificaciones.model';

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  private readonly http = inject(HttpClient);

  private readonly url = `${environment.apiUrl}/v1/notificaciones`;

  private readonly autenticacion = inject(AutenticacionService);

  private readonly conteoGuardado = signal<{
    usuarioId: number;
    token: string;
    cantidad: number;
  } | null>(null);

  readonly noLeidas = computed(() => {
    const sesion = this.autenticacion.sesion();
    const guardado = this.conteoGuardado();

    if (
      !sesion ||
      guardado?.usuarioId !== sesion.usuarioId ||
      guardado.token !== sesion.tokenAcceso
    ) {
      return 0;
    }

    return guardado.cantidad;
  });

  // HU18: consultar todas las notificaciones
  listar(usuarioId: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.url}/usuario/${usuarioId}`);
  }

  // HU18: obtener cantidad de notificaciones no leídas
  contarNoLeidas(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.url}/usuario/${usuarioId}/no-leidas/conteo`).pipe(
      tap((cantidad) => {
        const sesion = this.autenticacion.sesion();

        if (sesion?.usuarioId === usuarioId) {
          this.conteoGuardado.set({
            usuarioId,
            token: sesion.tokenAcceso,
            cantidad,
          });
        }
      }),
    );
  }

  // HU18: marcar una notificación como leída
  marcarComoLeida(notificacionId: number, usuarioId: number): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId.toString());

    return this.http.patch<void>(`${this.url}/${notificacionId}/leida`, {}, { params });
  }
}
