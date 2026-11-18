import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AutenticacionService } from '../services/autenticacion.service';

const API_BASE = environment.apiUrl.replace(/\/$/, '');
const ENDPOINTS_PUBLICOS = new Set([
  `${API_BASE}/v1/autenticacion/iniciar-sesion`,
  `${API_BASE}/v1/activaciones-pacientes`,
  `${API_BASE}/v1/recuperaciones-contrasena`,
  `${API_BASE}/v1/recuperaciones-contrasena/validar-codigo`,
  `${API_BASE}/v1/recuperaciones-contrasena/restablecer`,
]);

export const autenticacionInterceptor: HttpInterceptorFn = (request, next) => {
  const autenticacion = inject(AutenticacionService);
  const token = autenticacion.tokenAcceso();
  const urlSinParametros = request.url.split('?')[0];
  const perteneceALaApi =
    urlSinParametros === API_BASE || urlSinParametros.startsWith(`${API_BASE}/`);

  if (
    !perteneceALaApi ||
    !token ||
    ENDPOINTS_PUBLICOS.has(urlSinParametros) ||
    request.headers.has('Authorization')
  ) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
