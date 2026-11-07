import { Component, inject, signal } from '@angular/core';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { DashboardPacienteModel } from './models/dashboard-paciente.model';
import { DashboardPacienteService } from './services/dashboard-paciente.service';
import { NotificacionesPaciente } from
  '../notificaciones/notificaciones';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  imports: [DatePipe, RouterLink, NotificacionesPaciente],
  selector: 'app-inicio',
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly dashboardService = inject(DashboardPacienteService);

  protected dashboard = signal<DashboardPacienteModel | null>(null);
  protected cargando = signal(true);
  protected errorCarga = signal('');

  protected readonly fechaActual = (() => {
    const fecha = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());

    return fecha.charAt(0).toUpperCase() + fecha.slice(1);
  })();

  //Calcular fecha actual
  protected obtenerDiaRegistro(fechaHora: string): string {
    const fecha = new Date(fechaHora);
    const hoy = new Date();

    const fechaRegistro = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const diferencia = Math.round((fechaHoy.getTime() - fechaRegistro.getTime()) / 86400000);

    if (diferencia === 0) return 'Hoy';
    if (diferencia === 1) return 'Ayer';

    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'short',
    }).format(fecha);
  }

  protected formatearFechaSesion(fechaSesion: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Lima',
    }).format(new Date(fechaSesion));
  }

  ngOnInit(): void {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorCarga.set('No hay una sesión válida de paciente.');
      this.cargando.set(false);
      return;
    }

    this.dashboardService.consultar(sesion.usuarioId).subscribe({
      next: (respuesta) => {
        this.dashboard.set(respuesta);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudo cargar la información.');
        this.cargando.set(false);
      },
    });
  }
}
