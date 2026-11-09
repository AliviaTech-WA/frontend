import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { ConsultaDispositivoAsignado } from '../../paciente/dispositivos/models/dispositivo.model';
import { DispositivoService } from '../../paciente/dispositivos/services/dispositivo.service';
import { PacienteSeguimiento } from '../pacientes/models/paciente-seguimiento.model';
import { PacientesService } from '../pacientes/services/pacientes.service';
import { DatosWearable, EvolucionDia } from './models/datos-wearable.model';
import { WearablePacienteService } from './services/wearable-paciente.service';

type Metrica = 'frecuencia' | 'sueno' | 'pasos';

@Component({
  selector: 'app-wearable-paciente',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './wearable-paciente.html',
  styleUrl: './wearable-paciente.css',
})
export class WearablePacienteComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly pacientesService = inject(PacientesService);
  private readonly dispositivoService = inject(DispositivoService);
  private readonly wearableService = inject(WearablePacienteService);
  private cambiosRuta?: Subscription;

  // HU26: estado de la pantalla
  pacienteId: number | null = null;
  paciente = signal<PacienteSeguimiento | null>(null);
  dispositivo = signal<ConsultaDispositivoAsignado | null>(null);
  datos = signal<DatosWearable | null>(null);
  cargando = signal(false);
  errorCarga = signal('');

  metricas: { clave: Metrica; titulo: string; unidad: string }[] = [
    { clave: 'frecuencia', titulo: 'Frecuencia cardíaca', unidad: 'bpm' },
    { clave: 'sueno', titulo: 'Horas de sueño', unidad: 'horas' },
    { clave: 'pasos', titulo: 'Actividad diaria', unidad: 'pasos' },
  ];

  // Valor máximo de cada métrica para escalar sus barras por separado
  maximos = computed(() => {
    const dias = this.datos()?.evolucionUltimos7Dias ?? [];
    return {
      frecuencia: Math.max(1, ...dias.map((dia) => dia.frecuenciaCardiacaPromedio ?? 0)),
      sueno: Math.max(1, ...dias.map((dia) => dia.horasSueno ?? 0)),
      pasos: Math.max(1, ...dias.map((dia) => dia.pasos ?? 0)),
    };
  });

  ngOnInit(): void {
    this.cambiosRuta = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('pacienteId'));
      this.pacienteId = Number.isSafeInteger(id) && id > 0 ? id : null;
      this.cargarPaciente();
      this.cargarDispositivo();
      this.cargarDatos();
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

  cargarDispositivo(): void {
    if (this.pacienteId === null) return;

    this.dispositivoService.consultar(this.pacienteId).subscribe({
      next: (respuesta) => this.dispositivo.set(respuesta),
      error: () => this.dispositivo.set(null),
    });
  }

  cargarDatos(): void {
    if (this.pacienteId === null) {
      this.errorCarga.set('El paciente indicado no es válido.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');

    this.wearableService
      .consultar(this.pacienteId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (respuesta) => this.datos.set(respuesta),
        error: (error: HttpErrorResponse) => {
          this.datos.set(null);
          this.errorCarga.set(
            error.status === 404
              ? 'El paciente no tiene un dispositivo activo.'
              : error.status === 403
                ? 'No tienes acceso a los datos de este paciente.'
                : 'No pudimos cargar los datos del wearable. Intenta nuevamente.',
          );
        },
      });
  }

  valor(dia: EvolucionDia, metrica: Metrica): number | null {
    if (metrica === 'frecuencia') return dia.frecuenciaCardiacaPromedio;
    if (metrica === 'sueno') return dia.horasSueno;
    return dia.pasos;
  }

  etiquetaValor(dia: EvolucionDia, metrica: Metrica): string {
    const valor = this.valor(dia, metrica);
    if (valor === null) return '—';
    if (metrica === 'frecuencia') return `${Math.round(valor)}`;
    if (metrica === 'sueno') return `${valor.toFixed(1)} h`;
    return valor >= 1000 ? `${(valor / 1000).toFixed(1)}k` : `${valor}`;
  }

  alturaBarra(dia: EvolucionDia, metrica: Metrica): number {
    const valor = this.valor(dia, metrica) ?? 0;
    return Math.round((valor / this.maximos()[metrica]) * 100);
  }

  nombreDia(fecha: string): string {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[new Date(`${fecha}T00:00:00`).getDay()];
  }
}
