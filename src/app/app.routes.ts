import { Routes } from '@angular/router';
import { autenticacionPorRolGuard } from './core/guards/autenticacion.guard';
import { ActivarCuenta } from './features/autenticacion/activar-cuenta/activar-cuenta';
import { Login } from './features/autenticacion/login/login';
import { RecuperarContrasena } from './features/autenticacion/recuperar-contrasena/recuperar-contrasena';
import { PacienteLayout } from './layouts/paciente-layout/paciente-layout';
import { PsicologoLayout } from './layouts/psicologo-layout/psicologo-layout';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'activar-cuenta', component: ActivarCuenta },
  { path: 'recuperar-contrasena', component: RecuperarContrasena },
  {
    path: 'paciente',
    component: PacienteLayout,
    canActivate: [autenticacionPorRolGuard],
    data: { rol: 'PACIENTE' },
  },
  {
    path: 'psicologo',
    component: PsicologoLayout,
    canActivate: [autenticacionPorRolGuard],
    data: { rol: 'PSICOLOGO' },
  },
  {
    path: 'registro-psicologo',
    loadComponent: () =>
      import('./features/authentication/registro-psicologo/registro-psicologo').then(
        (component) => component.RegistroPsicologo,
      ),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
