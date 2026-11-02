import { Routes } from '@angular/router';
import { PacienteLayout } from './layouts/paciente-layout/paciente-layout';

export const routes: Routes = [
  { path: 'paciente', component: PacienteLayout, },
   {
    path: 'registro-psicologo', loadComponent: () =>
      import('./features/authentication/registro-psicologo/registro-psicologo').then(
        (component) => component.RegistroPsicologo,
      ),
  },
  { path: '', redirectTo: 'paciente', pathMatch: 'full' }
];
