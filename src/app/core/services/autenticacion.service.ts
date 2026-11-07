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
  // Guarda la sesión del usuario en el navegador para conservarla al actualizar la página.
  private readonly claveSesion = 'aliviatech_sesion';
  // Recupera la sesión guardada al iniciar Angular y la mantiene disponible mediante un signal.
  private readonly sesionState = signal<SesionAutenticada | null>(this.recuperarSesion());

  readonly sesion = this.sesionState.asReadonly();
  readonly estaAutenticado = computed(() => this.sesionState() !== null);
  readonly tokenAcceso = computed(() => this.sesionState()?.tokenAcceso ?? null);
  readonly rol = computed(() => this.sesionState()?.rol ?? null);

  iniciarSesion(solicitud: IniciarSesionRequest): Observable<SesionAutenticada> {
    return this.http.post<IniciarSesionResponse>(this.endpoint, solicitud).pipe(
      map((respuesta) => this.validarRespuesta(respuesta)),
      tap((sesion) => {
        sessionStorage.setItem(this.claveSesion, JSON.stringify(sesion));
        this.sesionState.set(sesion);
      }),
    );
  }

  cerrarSesionLocal(): void {
    sessionStorage.removeItem(this.claveSesion);
    this.sesionState.set(null);
  }

  // Recupera la sesión almacenada, valida los datos y comprueba que el JWT no haya expirado.
  // Si los datos son inválidos o el token expiró, elimina la sesión guardada.
  private recuperarSesion(): SesionAutenticada | null {
    const datosGuardados = sessionStorage.getItem(this.claveSesion);

    if (!datosGuardados) {
      return null;
    }

    try {
      const sesion = this.validarRespuesta(JSON.parse(datosGuardados) as IniciarSesionResponse);

      // No recuperar un token JWT que ya expiró.
      const partes = sesion.tokenAcceso.split('.');

      if (partes.length !== 3) {
        throw new Error('Token inválido');
      }

      const contenido = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));

      if (typeof contenido.exp !== 'number' || contenido.exp * 1000 <= Date.now()) {
        throw new Error('Token expirado');
      }

      return sesion;
    } catch {
      sessionStorage.removeItem(this.claveSesion);
      return null;
    }
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
