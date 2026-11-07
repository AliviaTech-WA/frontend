
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar-paciente',
  styleUrl: './sidebar-paciente.css',
  templateUrl: './sidebar-paciente.html',
})
export class Sidebar {
  @Input() nombreUsuario: string = '';

  // Genera las iniciales usando el primer nombre y el último apellido.
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
