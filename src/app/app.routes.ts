import { Routes } from '@angular/router';
import { LayoutPaciente } from './componentes/layout-paciente/layout-paciente';

export const routes: Routes = [
  { path: 'paciente', component: LayoutPaciente, },
  { path: '', redirectTo: 'paciente', pathMatch: 'full' },
];
