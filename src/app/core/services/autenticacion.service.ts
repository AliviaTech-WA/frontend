import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IniciarSesionRequest,
  IniciarSesionResponse,
  RolUsuario,
  SesionAutenticada,
} from '../models/autenticacion.model';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/v1/autenticacion/iniciar-sesion`;
  private readonly sesionState = signal<SesionAutenticada | null>(null);

  readonly sesion = this.sesionState.asReadonly();
  readonly estaAutenticado = computed(() => this.sesionState() !== null);
  readonly tokenAcceso = computed(() => this.sesionState()?.tokenAcceso ?? null);
  readonly rol = computed(() => this.sesionState()?.rol ?? null);

  iniciarSesion(solicitud: IniciarSesionRequest): Observable<SesionAutenticada> {
    return this.http.post<IniciarSesionResponse>(this.endpoint, solicitud).pipe(
      map((respuesta) => this.validarRespuesta(respuesta)),
      tap((sesion) => this.sesionState.set(sesion)),
    );
  }

  cerrarSesionLocal(): void {
    this.sesionState.set(null);
  }

  private validarRespuesta(respuesta: IniciarSesionResponse): SesionAutenticada {
    const rol = respuesta.rol?.trim().toUpperCase();

    if (
      !Number.isSafeInteger(respuesta.usuarioId) ||
      respuesta.usuarioId <= 0 ||
      !this.esRolSoportado(rol) ||
      typeof respuesta.tokenAcceso !== 'string' ||
      respuesta.tokenAcceso.length === 0
    ) {
      throw new Error('La respuesta de autenticación no tiene el formato esperado.');
    }

    return {
      usuarioId: respuesta.usuarioId,
      rol,
      tokenAcceso: respuesta.tokenAcceso,
    };
  }

  private esRolSoportado(rol: string): rol is RolUsuario {
    return rol === 'PACIENTE' || rol === 'PSICOLOGO';
  }
}
