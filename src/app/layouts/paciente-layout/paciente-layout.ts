import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AutenticacionService } from '../../core/services/autenticacion.service';
import { PerfilPersonalService } from '../../features/paciente/perfil-paciente/services/perfil-personal.service';
import { Sidebar } from './components/sidebar-paciente/sidebar-paciente';

@Component({
  imports: [RouterOutlet, Sidebar],
  selector: 'app-layout-paciente',
  styleUrl: './paciente-layout.css',
  templateUrl: './paciente-layout.html',
})
export class PacienteLayout implements OnInit {
  // Obtiene la sesión del paciente que inició sesión.
  private readonly autenticacion = inject(AutenticacionService);

  // Servicio que consulta los datos personales del paciente.
  private readonly perfilService = inject(PerfilPersonalService);

  // Guarda el nombre que se mostrará en el sidebar.
  readonly nombreUsuario = signal('');

  ngOnInit(): void {
    // Obtiene el ID del paciente autenticado.
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      return;
    }

    // Consulta el perfil y obtiene los nombres y apellidos reales.
    this.perfilService.consultar(sesion.usuarioId).subscribe({
      next: (perfil) => {
        this.nombreUsuario.set(`${perfil.nombres} ${perfil.apellidos}`.trim());
      },
      error: () => {
        // Si falla la consulta, no se muestra un nombre incorrecto.
        this.nombreUsuario.set('');
      },
    });
  }
}
