import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { CabeceraPaciente } from '../cabecera-paciente/cabecera-paciente';
import { PacienteSeguimiento } from '../pacientes/models/paciente-seguimiento.model';
import { PacientesService } from '../pacientes/services/pacientes.service';
import { RegistroPaciente } from './models/registro-paciente.model';
import { RegistrosPacienteService } from './services/registros-paciente.service';

@Component({
  selector: 'app-registros-paciente',
  imports: [DatePipe, DecimalPipe, FormsModule, CabeceraPaciente, RouterLink],
  templateUrl: './registros-paciente.html',
  styleUrl: './registros-paciente.css',
})
export class RegistrosPacienteComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly pacientesService = inject(PacientesService);
  private readonly registrosService = inject(RegistrosPacienteService);
  private cambiosRuta?: Subscription;

  // HU25: estado de la pantalla
  pacienteId: number | null = null;
  paciente = signal<PacienteSeguimiento | null>(null);
  registros = signal<RegistroPaciente[]>([]);
  cargando = signal(false);
  errorCarga = signal('');

  periodoDias = signal<number | null>(30);
  fechaDesde = '';
  fechaHasta = '';

  // Indicadores del periodo consultado
  promedioAnsiedad = computed(() => {
    const lista = this.registros();
    if (!lista.length) return null;
    return lista.reduce((suma, registro) => suma + registro.nivelAnsiedad, 0) / lista.length;
  });

  conComentario = computed(() => this.registros().filter((registro) => !!registro.comentario?.trim()).length);

  // Puntos de la línea de evolución (registros en orden cronológico)
  puntosGrafico = computed(() => {
    const lista = [...this.registros()].reverse();
    if (!lista.length) return [];
    const ancho = 600;
    const alto = 120;
    const paso = lista.length > 1 ? ancho / (lista.length - 1) : 0;
    return lista.map((registro, indice) => ({
      x: Math.round(indice * paso),
      y: Math.round(alto - (registro.nivelAnsiedad / 10) * alto),
      registro,
    }));
  });

  lineaGrafico = computed(() => this.puntosGrafico().map((punto) => `${punto.x},${punto.y}`).join(' '));

  ngOnInit(): void {
    this.cambiosRuta = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('pacienteId'));
      this.pacienteId = Number.isSafeInteger(id) && id > 0 ? id : null;
      this.cargarPaciente();
      this.seleccionarPeriodo(30);
    });
  }

  ngOnDestroy(): void {
    this.cambiosRuta?.unsubscribe();
  }

  // Datos de cabecera tomados de la lista de pacientes (no registra revisión)
  cargarPaciente(): void {
    const sesion = this.autenticacion.sesion();
    if (!sesion || sesion.rol !== 'PSICOLOGO' || this.pacienteId === null) return;

    this.pacientesService.listarPacientes(sesion.usuarioId).subscribe({
      next: (lista) => this.paciente.set(lista.find((fila) => fila.pacienteId === this.pacienteId) ?? null),
      error: () => this.paciente.set(null),
    });
  }

  seleccionarPeriodo(dias: number): void {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(hasta.getDate() - (dias - 1));
    this.periodoDias.set(dias);
    this.fechaDesde = this.formatoFecha(desde);
    this.fechaHasta = this.formatoFecha(hasta);
    this.cargarRegistros();
  }

  aplicarRangoPersonalizado(): void {
    if (this.fechaDesde && this.fechaHasta && this.fechaDesde > this.fechaHasta) {
      this.errorCarga.set('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    this.periodoDias.set(null);
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    if (this.pacienteId === null) {
      this.errorCarga.set('El paciente indicado no es válido.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');

    this.registrosService
      .listar(this.pacienteId, this.fechaDesde, this.fechaHasta)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (respuesta) => this.registros.set(respuesta),
        error: (error: HttpErrorResponse) => {
          this.registros.set([]);
          this.errorCarga.set(
            error.status === 403
              ? 'No tienes acceso a los registros de este paciente.'
              : 'No pudimos cargar los registros. Intenta nuevamente.',
          );
        },
      });
  }

  private formatoFecha(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
