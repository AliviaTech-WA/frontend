import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepickerToggleIcon,
} from '@angular/material/datepicker';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { finalize } from 'rxjs';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { ReporteGeneral } from './models/reporte-general.model';
import { ReportesService } from './services/reportes.service';

type Atajo = 'mes' | 'trimestre';
type Rango = { desde: Date; hasta: Date };

@Component({
  selector: 'app-reportes',
  imports: [
    A11yModule,
    OverlayModule,
    DecimalPipe,
    ReactiveFormsModule,
    MatButton,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepickerToggleIcon,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly reportesService = inject(ReportesService);
  private readonly fb = inject(FormBuilder);

  private rangoAplicado?: Rango;

  readonly reporte = signal<ReporteGeneral | null>(null);
  readonly maximoRegistros = computed(() => {
    const semanas = this.reporte()?.actividadSemanal ?? [];
    const maximo = Math.max(1, ...semanas.map((semana) => semana.registros));

    return Math.ceil(maximo / 4) * 4;
  });
  readonly cargando = signal(false);
  readonly mensajeError = signal('');
  readonly errorPeriodo = signal('');
  readonly panelAbierto = signal(false);
  readonly periodoPersonalizado = signal(false);
  readonly opcionRango = signal<Atajo | 'personalizado'>('personalizado');

  readonly periodoForm = this.fb.group({
    desde: this.fb.control<Date | null>(null, Validators.required),
    hasta: this.fb.control<Date | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.usarUltimos30Dias();
  }

  usarUltimos30Dias(): void {
    const hasta = new Date();
    hasta.setHours(0, 0, 0, 0);

    const desde = new Date(hasta);
    desde.setDate(desde.getDate() - 29);

    this.rangoAplicado = { desde, hasta };
    this.periodoPersonalizado.set(false);
    this.cargarReporte({ desde, hasta });
  }

  abrirPanel(): void {
    this.periodoForm.reset(this.rangoAplicado);
    this.opcionRango.set('personalizado');
    this.errorPeriodo.set('');
    this.panelAbierto.set(true);
  }

  cerrarPanel(): void {
    this.panelAbierto.set(false);
  }

  elegirAtajo(atajo: Atajo): void {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const meses = atajo === 'mes' ? 1 : 3;

    this.periodoForm.setValue({
      desde: new Date(anio, mes - meses, 1),
      hasta: new Date(anio, mes, 0),
    });

    this.opcionRango.set(atajo);
    this.errorPeriodo.set('');
  }

  aplicarPeriodo(): void {
    const { desde, hasta } = this.periodoForm.getRawValue();

    if (this.periodoForm.invalid || !desde || !hasta || desde > hasta) {
      this.periodoForm.markAllAsTouched();
      this.errorPeriodo.set('Selecciona un rango de fechas válido.');
      return;
    }

    this.rangoAplicado = { desde, hasta };
    this.periodoPersonalizado.set(true);
    this.cerrarPanel();
    this.cargarReporte({ desde, hasta });
  }

  private cargarReporte({ desde, hasta }: Rango): void {
    const sesion = this.autenticacion.sesion();
    this.mensajeError.set('');

    if (!sesion || sesion.rol !== 'PSICOLOGO') {
      this.mensajeError.set('Inicia sesión como psicólogo para consultar tus reportes.');
      return;
    }

    this.cargando.set(true);

    this.reportesService
      .consultar(sesion.usuarioId, this.formatearFecha(desde), this.formatearFecha(hasta))
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (reporte) => this.reporte.set(reporte),
        error: () => this.mensajeError.set('No se pudo cargar el reporte general.'),
      });
  }

  private formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}
