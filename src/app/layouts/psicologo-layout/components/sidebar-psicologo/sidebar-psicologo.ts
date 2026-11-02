import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar-psicologo',
  styleUrl: './sidebar-psicologo.css',
  templateUrl: './sidebar-psicologo.html',
})
export class SidebarPsicologo {
  @Input() nombreUsuario: string = '';
}
