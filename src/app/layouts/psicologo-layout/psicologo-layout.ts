import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { PerfilPsicologoService } from '../../features/psicologo/perfil-psicologo/services/perfil-psicologo-service';
import { SidebarPsicologo } from './components/sidebar-psicologo/sidebar-psicologo';

@Component({
  imports: [RouterOutlet, SidebarPsicologo],
  selector: 'app-psicologo-layout',
  styleUrl: './psicologo-layout.css',
  templateUrl: './psicologo-layout.html',
})
export class PsicologoLayout implements OnInit {
  private autenticacionService = inject(AutenticacionService);
  private perfilService = inject(PerfilPsicologoService);

  nombreUsuario = signal('');

  ngOnInit() {
    const sesion = this.autenticacionService.sesion();

    if (!sesion || sesion.rol !== 'PSICOLOGO') {
      return;
    }

    this.perfilService.obtenerPerfil(sesion.usuarioId).subscribe({
      next: (perfil) => {
        this.nombreUsuario.set(`${perfil.nombres} ${perfil.apellidos}`.trim());
      },
      error: () => {
        this.nombreUsuario.set('');
      },
    });
  }
}
