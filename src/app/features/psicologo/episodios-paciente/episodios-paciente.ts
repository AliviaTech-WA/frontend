import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { CabeceraPaciente } from '../cabecera-paciente/cabecera-paciente';
import { PacienteSeguimiento } from '../pacientes/models/paciente-seguimiento.model';
import { PacientesService } from '../pacientes/services/pacientes.service';
import { EpisodioPaciente } from './models/episodio-paciente.model';
import { EpisodiosPacienteService } from './services/episodios-paciente.service';

@Component({
  selector: 'app-episodios-paciente',
  imports: [DatePipe, DecimalPipe, CabeceraPaciente, RouterLink],
  templateUrl: './episodios-paciente.html',
  styleUrl: './episodios-paciente.css',
})
export class EpisodiosPacienteComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly pacientesService = inject(PacientesService);
  private readonly episodiosService = inject(EpisodiosPacienteService);
  private cambiosRuta?: Subscription;

  // HU27: estado de la pantalla
  pacienteId: number | null = null;
  paciente = signal<PacienteSeguimiento | null>(null);
  episodios = signal<EpisodioPaciente[]>([]);
  cargando = signal(false);
  errorCarga = signal('');

  // Episodios de los últimos 30 días para el resumen lateral
  ultimos30Dias = computed(() => {
    const limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return this.episodios().filter((episodio) => new Date(episodio.fechaHoraInicio).getTime() >= limite);
  });

  duracionPromedio = computed(() => {
    const lista = this.ultimos30Dias();
    if (!lista.length) return null;
    return lista.reduce((suma, episodio) => suma + episodio.duracionMinutos, 0) / lista.length;
  });

  frecuenciaMaxima = computed(() => {
    const valores = this.ultimos30Dias()
      .map((episodio) => episodio.frecuenciaCardiacaMaxima)
      .filter((valor): valor is number => valor !== null);
    return valores.length ? Math.max(...valores) : null;
  });

  ngOnInit(): void {
    this.cambiosRuta = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('pacienteId'));
      this.pacienteId = Number.isSafeInteger(id) && id > 0 ? id : null;
      this.cargarPaciente();
      this.cargarEpisodios();
    });
  }

  ngOnDestroy(): void {
    this.cambiosRuta?.unsubscribe();
  }

  cargarPaciente(): void {
    const sesion = this.autenticacion.sesion();
    if (!sesion || sesion.rol !== 'PSICOLOGO' || this.pacienteId === null) return;

    this.pacientesService.listarPacientes(sesion.usuarioId).subscribe({
      next: (lista) => this.paciente.set(lista.find((fila) => fila.pacienteId === this.pacienteId) ?? null),
      error: () => this.paciente.set(null),
    });
  }

  cargarEpisodios(): void {
    if (this.pacienteId === null) {
      this.errorCarga.set('El paciente indicado no es válido.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');

    this.episodiosService
      .listarConfirmados(this.pacienteId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (respuesta) => this.episodios.set(respuesta),
        error: (error: HttpErrorResponse) => {
          this.episodios.set([]);
          this.errorCarga.set(
            error.status === 403
              ? 'No tienes acceso a los episodios de este paciente.'
              : 'No pudimos cargar los episodios. Intenta nuevamente.',
          );
        },
      });
  }
}
