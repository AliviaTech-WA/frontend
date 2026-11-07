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
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/paciente/inicio/inicio').then((component) => component.Inicio),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/paciente/perfil-paciente/perfil-paciente').then(
            (component) => component.PerfilPaciente,
          ),
      },
      {
        path: 'eventos',
        loadComponent: () =>
          import('./features/paciente/eventos/eventos').then((component) => component.Eventos),
      },
      {
        path: 'sesiones',
        loadComponent: () =>
          import('./features/paciente/sesiones/sesiones').then((component) => component.Sesiones),
      },
    ],
  },
  {
    path: 'psicologo',
    component: PsicologoLayout,
    canActivate: [autenticacionPorRolGuard],
    data: { rol: 'PSICOLOGO' },
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/psicologo/inicio/inicio').then(
            (component) => component.InicioPsicologo,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/psicologo/perfil-psicologo/perfil-psicologo').then(
            (component) => component.PerfilPsicologo,
          ),
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./features/psicologo/pacientes/pacientes').then(
            (component) => component.Pacientes,
          ),
      },
      {
        path: 'pacientes/:pacienteId/sesiones',
        loadComponent: () =>
          import('./features/psicologo/sesiones/sesiones').then((component) => component.Sesiones),
      },
    ],
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
