import { Routes } from '@angular/router';
import { LayoutPaciente } from './componentes/layout-paciente/layout-paciente';

export const routes: Routes = [
  { path: 'paciente', component: LayoutPaciente, },
   {
    path: 'registro-psicologo', loadComponent: () =>
      import('./componentes/registro-psicologo/registro-psicologo').then(
        (component) => component.RegistroPsicologo,
      ),
  },
  { path: '', redirectTo: 'paciente', pathMatch: 'full' }
];
