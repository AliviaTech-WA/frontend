import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { PerfilPsicologoService } from '../perfil-psicologo/services/perfil-psicologo-service';
import { DashboardPsicologo, TipoNovedad } from './models/dashboard-psicologo.model';
import { DashboardPsicologoService } from './services/dashboard-psicologo.service';

@Component({
  selector: 'app-inicio-psicologo',
  imports: [DatePipe, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class InicioPsicologo implements OnInit {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly dashboardService = inject(DashboardPsicologoService);
  private readonly perfilService = inject(PerfilPsicologoService);

  // HU22: estado del dashboard
  dashboard = signal<DashboardPsicologo | null>(null);
  cargando = signal(false);
  errorCarga = signal('');
  hoy = new Date();
  nombrePsicologo = signal('');

  // Saludo según la hora del día
  saludo = computed(() => {
    const hora = this.hoy.getHours();
    const texto = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
    return this.nombrePsicologo() ? `${texto}, ${this.nombrePsicologo()}` : texto;
  });

  etiquetasNovedad: Record<TipoNovedad, string> = {
    NUEVOS_EPISODIOS: 'Nuevos episodios',
    NUEVOS_REGISTROS: 'Nuevos registros',
    SIN_NOVEDADES: 'Sin novedades',
  };

  // Valor más alto de la semana para escalar las barras del gráfico
  maximoActividad = computed(() => {
    const dias = this.dashboard()?.actividadUltimos7Dias ?? [];
    return Math.max(1, ...dias.map((dia) => dia.registrosManuales + dia.episodiosConfirmados));
  });

  totalRegistros = computed(() =>
    (this.dashboard()?.actividadUltimos7Dias ?? []).reduce((suma, dia) => suma + dia.registrosManuales, 0),
  );

  totalEpisodios = computed(() =>
    (this.dashboard()?.actividadUltimos7Dias ?? []).reduce((suma, dia) => suma + dia.episodiosConfirmados, 0),
  );

  ngOnInit(): void {
    this.cargarNombre();
    this.cargarDashboard();
  }

  // HU22: nombre del psicólogo para el saludo
  cargarNombre(): void {
    const sesion = this.autenticacion.sesion();
    if (!sesion || sesion.rol !== 'PSICOLOGO') return;

    this.perfilService.obtenerPerfil(sesion.usuarioId).subscribe({
      next: (perfil) => this.nombrePsicologo.set(perfil.nombres.split(' ')[0]),
      error: () => this.nombrePsicologo.set(''),
    });
  }

  cargarDashboard(): void {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PSICOLOGO') {
      this.errorCarga.set('Inicia sesión como psicólogo para ver tu resumen.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');

    this.dashboardService
      .consultar(sesion.usuarioId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (respuesta) => this.dashboard.set(respuesta),
        error: (error: HttpErrorResponse) => {
          this.dashboard.set(null);
          this.errorCarga.set(
            error.status === 403
              ? 'No tienes permiso para consultar este resumen.'
              : 'No pudimos cargar tu resumen. Intenta nuevamente.',
          );
        },
      });
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter((parte) => parte)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  nombreDia(fecha: string): string {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[new Date(`${fecha}T00:00:00`).getDay()];
  }

  alturaBarra(valor: number): number {
    return Math.round((valor / this.maximoActividad()) * 100);
  }
}
