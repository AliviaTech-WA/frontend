import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { CabeceraPaciente } from '../cabecera-paciente/cabecera-paciente';
import { ResumenActualService } from '../resumen-paciente/services/resumen-actual.service';
import {
  AnalisisIaService,
  FuenteAnalisis,
  ResultadoAnalisis,
} from './services/analisis-ia.service';

interface Periodo {
  desde: string;
  hasta: string;
  etiqueta: string;
}

@Component({
  selector: 'app-analisis-ia',
  imports: [DatePipe, FormsModule, MatDialogModule, RouterLink, CabeceraPaciente],
  templateUrl: './analisis-ia.html',
  styleUrl: './analisis-ia.css',
})
export class AnalisisIa {
  private readonly api = inject(AnalisisIaService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly dialogo = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private consulta?: Subscription;
  private selector?: MatDialogRef<unknown>;

  readonly resumenActual = inject(ResumenActualService);
  readonly pacienteId = signal<number | null>(null);
  readonly fuentes: ReadonlyArray<{ valor: FuenteAnalisis; texto: string }> = [
    { valor: 'INTEGRADO', texto: 'Vista integrada' },
    { valor: 'REGISTROS', texto: 'Registros del paciente' },
    { valor: 'WEARABLE', texto: 'Datos del wearable' },
  ];

  readonly fuente = signal<FuenteAnalisis>('INTEGRADO');
  readonly periodo = signal(this.calcularPeriodo(0));
  readonly resultado = signal<ResultadoAnalisis | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<{ mensaje: string; sinDatos: boolean } | null>(null);
  borrador = { ...this.periodo() };
  errorPeriodo = '';

  constructor() {
    this.ruta.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('pacienteId'));
      this.consulta?.unsubscribe();
      this.selector?.close();
      this.pacienteId.set(Number.isSafeInteger(id) && id > 0 ? id : null);
      this.resultado.set(null);
      this.error.set(null);
    });

    this.destroyRef.onDestroy(() => this.selector?.close());
  }

  elegirFuente(fuente: FuenteAnalisis): void {
    if (fuente === this.fuente()) return;
    this.fuente.set(fuente);
    this.resultado.set(null);
    this.error.set(null);
  }

  abrirPeriodo(plantilla: TemplateRef<unknown>): void {
    this.borrador = { ...this.periodo() };
    this.errorPeriodo = '';
    this.selector = this.dialogo.open(plantilla, {
      width: '420px',
      maxWidth: 'calc(100vw - 24px)',
      ariaLabel: 'Seleccionar periodo',
    });
  }

  elegirAtajo(meses: 0 | 1 | 3): void {
    this.borrador = this.calcularPeriodo(meses);
    this.errorPeriodo = '';
  }

  aplicarPeriodo(): void {
    const { desde, hasta } = this.borrador;
    if (!desde || !hasta || desde > hasta) {
      this.errorPeriodo = 'Selecciona un rango de fechas válido.';
      return;
    }

    this.periodo.set({ ...this.borrador });
    this.resultado.set(null);
    this.error.set(null);
    this.selector?.close();
  }

  generar(): void {
    const id = this.pacienteId();
    if (id === null || this.cargando()) return;

    const { desde, hasta } = this.periodo();
    this.resultado.set(null);
    this.error.set(null);
    this.cargando.set(true);

    this.consulta = this.api
      .generar(id, {
        fuente: this.fuente(),
        periodoDesde: `${desde}T00:00:00-05:00`,
        periodoHasta: `${hasta}T23:59:59-05:00`,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (resultado) => this.resultado.set(resultado),
        error: (respuesta) => {
          const mensaje = respuesta.error?.message;

          this.error.set({
            mensaje:
              typeof mensaje === 'string' && mensaje.trim()
                ? mensaje
                : 'No se pudo generar el análisis. Intenta nuevamente.',
            sinDatos:
              respuesta.status === 400 &&
              mensaje ===
                'No existe información suficiente para generar el análisis con la fuente seleccionada.',
          });
        },
      });
  }

  private calcularPeriodo(meses: 0 | 1 | 3): Periodo {
    const hoyLima = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const anio = hoyLima.getUTCFullYear();
    const mes = hoyLima.getUTCMonth();
    const dia = hoyLima.getUTCDate();

    const desde =
      meses === 0
        ? new Date(Date.UTC(anio, mes, dia - 29))
        : new Date(Date.UTC(anio, mes - meses, 1));
    const hasta = meses === 0 ? hoyLima : new Date(Date.UTC(anio, mes, 0));

    return {
      desde: desde.toISOString().slice(0, 10),
      hasta: hasta.toISOString().slice(0, 10),
      etiqueta: meses === 0 ? 'Últimos 30 días' : meses === 1 ? 'Último mes' : 'Trimestre',
    };
  }
}
