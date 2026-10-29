import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  @Input() rol: 'PACIENTE' | 'PSICOLOGO' = 'PACIENTE';
  @Input() nombreUsuario: string = '';
}
