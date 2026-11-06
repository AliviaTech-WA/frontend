import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../models/autenticacion.model';
import { AutenticacionService } from '../services/autenticacion.service';

export const autenticacionPorRolGuard: CanActivateFn = (route) => {
  const autenticacion = inject(AutenticacionService);
  const router = inject(Router);
  const sesion = autenticacion.sesion();

  if (!sesion) {
    return router.createUrlTree(['/login']);
  }

  const rolEsperado = route.data['rol'] as RolUsuario | undefined;

  if (!rolEsperado || sesion.rol === rolEsperado) {
    return true;
  }

  return router.createUrlTree([sesion.rol === 'PACIENTE' ? '/paciente' : '/psicologo']);
};
