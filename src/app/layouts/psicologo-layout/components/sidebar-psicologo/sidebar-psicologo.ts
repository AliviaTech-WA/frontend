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
  get iniciales(): string {
    const palabras = this.nombreUsuario.trim().split(/\s+/).filter(Boolean);

    if (palabras.length === 0) {
      return 'P';
    }

    const primera = palabras[0].charAt(0);
    const ultima = palabras.length > 1 ? palabras[palabras.length - 1].charAt(0) : '';

    return (primera + ultima).toUpperCase();
  }
}
