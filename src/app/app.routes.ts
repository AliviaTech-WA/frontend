import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'registro-psicologo', loadComponent: () =>
      import('./componentes/registro-psicologo/registro-psicologo').then(
        (component) => component.RegistroPsicologo,
      ),
  },
];
