import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Component, inject, OnDestroy, OnInit, signal, TemplateRef} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SesionResumen } from './models/sesion-resumen.model';
import { SesionesService } from './services/sesiones.service';
import { CabeceraPaciente } from '../cabecera-paciente/cabecera-paciente';
import { ResumenActualService } from '../resumen-paciente/services/resumen-actual.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
registerLocaleData(localeEs);
@Component({
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatButton,
    MatDialogModule,
    RouterLink,
    CabeceraPaciente,
  ],
  selector: 'app-sesiones',
  styleUrl: './sesiones.css',
  templateUrl: './sesiones.html',
})
export class Sesiones implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  readonly resumenActual = inject(ResumenActualService);
  private sesionesService = inject(SesionesService);
  private cambiosRuta?: Subscription;
  private consultaHistorial?: Subscription;
  private guardado?: Subscription;
  private readonly dialogo = inject(MatDialog);

  pacienteId: number | null = null;
  fechaMostrada = signal(new Date());
  historial = signal<SesionResumen[]>([]);
  cargandoHistorial = signal(false);
  errorHistorial = signal('');
  guardando = signal(false);
  errorGuardado = signal('');

  sesionForm = this.fb.nonNullable.group({
    notaInterna: [''],
    resumenCompartido: [''],
    recomendacionCompartida: [''],
  });

  ngOnInit(): void {
    this.cambiosRuta = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('pacienteId'));

      this.guardado?.unsubscribe();
      this.guardando.set(false);
      this.sesionForm.reset();
      this.errorGuardado.set('');
      this.fechaMostrada.set(new Date());

      this.pacienteId = Number.isSafeInteger(id) && id > 0 ? id : null;
      this.cargarHistorial();
    });
  }

  ngOnDestroy(): void {
    this.cambiosRuta?.unsubscribe();
    this.consultaHistorial?.unsubscribe();
    this.guardado?.unsubscribe();
  }

  cargarHistorial(): void {
    this.consultaHistorial?.unsubscribe();
    this.historial.set([]);
    this.errorHistorial.set('');

    if (this.pacienteId === null) {
      this.cargandoHistorial.set(false);
      this.errorHistorial.set('No se encontró un paciente válido en la ruta.');
      return;
    }

    this.cargandoHistorial.set(true);

    this.consultaHistorial = this.sesionesService.listarSesiones(this.pacienteId).subscribe({
      next: (sesiones) => {
        this.historial.set(sesiones);
        this.cargandoHistorial.set(false);
      },
      error: () => {
        this.errorHistorial.set('No se pudo cargar el historial de sesiones.');
        this.cargandoHistorial.set(false);
      },
    });
  }

  guardarInformacion(confirmacion: TemplateRef<unknown>): void {
    if (this.pacienteId === null || this.guardando()) {
      return;
    }

    const fecha = new Date();
    const { notaInterna, resumenCompartido, recomendacionCompartida } =
      this.sesionForm.getRawValue();

    this.fechaMostrada.set(fecha);
    this.errorGuardado.set('');
    this.guardando.set(true);

    this.guardado = this.sesionesService
      .registrarSesion(this.pacienteId, {
        fechaSesion: fecha.toISOString(),
        notaInterna: notaInterna.trim() || null,
        resumenCompartido: resumenCompartido.trim() || null,
        recomendacionCompartida: recomendacionCompartida.trim() || null,
      })
      .subscribe({
        next: () => {
          this.sesionForm.reset();
          this.guardando.set(false);
          this.cargarHistorial();

          this.dialogo.open(confirmacion, {
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            ariaLabel: 'Información guardada',
          });
        },
        error: () => {
          this.guardando.set(false);
          this.errorGuardado.set('No se pudo confirmar el guardado de la sesión.');
        },
      });
  }
}
