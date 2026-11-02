import { Routes } from '@angular/router';
import { PacienteLayout } from './layouts/paciente-layout/paciente-layout';
import { PsicologoLayout } from './layouts/psicologo-layout/psicologo-layout';

export const routes: Routes = [
  { path: 'paciente', component: PacienteLayout },
  { path: 'psicologo', component: PsicologoLayout },
  {
    path: 'registro-psicologo',
    loadComponent: () =>
      import('./features/authentication/registro-psicologo/registro-psicologo').then(
        (component) => component.RegistroPsicologo,
      ),
  },
  { path: '', redirectTo: 'paciente', pathMatch: 'full' },
];
