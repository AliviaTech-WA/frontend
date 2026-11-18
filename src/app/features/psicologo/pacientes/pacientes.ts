import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NovedadPaciente, PacienteSeguimiento } from './models/paciente-seguimiento.model';
import { PacientesService } from './services/pacientes.service';
import { MatButton } from '@angular/material/button';
@Component({
  selector: 'app-pacientes',
  imports: [DatePipe, FormsModule, RouterLink, MatButton],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
})
export class Pacientes implements OnInit, OnDestroy {
  private autenticacionService = inject(AutenticacionService);
  private pacientesService = inject(PacientesService);
  private consulta?: Subscription;

  pacientes = signal<PacienteSeguimiento[]>([]);
  cargando = signal(false);
  mensajeError = signal('');

  busqueda = '';
  novedadSeleccionada?: NovedadPaciente;

  etiquetasNovedad: Record<NovedadPaciente, string> = {
    NUEVOS_EPISODIOS: 'Nuevos episodios',
    NUEVOS_REGISTROS: 'Nuevos registros',
    SIN_NOVEDADES: 'Sin novedades',
  };

  ngOnInit(): void {
    this.cargarPacientes();
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
  }

  filtrarPorNovedad(novedad?: NovedadPaciente): void {
    this.novedadSeleccionada = novedad;
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.consulta?.unsubscribe();
    const sesion = this.autenticacionService.sesion();

    if (!sesion || sesion.rol !== 'PSICOLOGO') {
      this.pacientes.set([]);
      this.cargando.set(false);
      this.mensajeError.set('Inicia sesión como psicólogo para consultar tus pacientes.');
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');

    this.consulta = this.pacientesService
      .listarPacientes(sesion.usuarioId, this.busqueda, this.novedadSeleccionada)
      .subscribe({
        next: (pacientes) => {
          this.pacientes.set(pacientes);
          this.cargando.set(false);
        },
        error: () => {
          this.pacientes.set([]);
          this.mensajeError.set('No se pudo cargar la lista de pacientes. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }
}
