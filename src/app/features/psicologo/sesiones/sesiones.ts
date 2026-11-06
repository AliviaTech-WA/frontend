import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SesionResumen } from './models/sesion-resumen.model';
import { SesionesService } from './services/sesiones.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { PacienteSeguimiento } from '../pacientes/models/paciente-seguimiento.model';
import { PacientesService } from '../pacientes/services/pacientes.service';

@Component({
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
  ],
  selector: 'app-sesiones',
  styleUrl: './sesiones.css',
  templateUrl: './sesiones.html',
})
export class Sesiones implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private sesionesService = inject(SesionesService);
  private autenticacionService = inject(AutenticacionService);
  private pacientesService = inject(PacientesService);
  private consultaPaciente?: Subscription;
  pacienteSeleccionado = signal<PacienteSeguimiento | null>(null);

  private cambiosRuta?: Subscription;
  private consultaHistorial?: Subscription;
  private guardado?: Subscription;

  pacienteId: number | null = null;
  fechaMostrada = signal(new Date());
  historial = signal<SesionResumen[]>([]);
  cargandoHistorial = signal(false);
  errorHistorial = signal('');
  guardando = signal(false);
  mensaje = signal('');
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
      this.mensaje.set('');
      this.errorGuardado.set('');
      this.fechaMostrada.set(new Date());

      this.pacienteId = Number.isSafeInteger(id) && id > 0 ? id : null;
      this.cargarPaciente();
      this.cargarHistorial();
    });
  }

  ngOnDestroy(): void {
    this.cambiosRuta?.unsubscribe();
    this.consultaHistorial?.unsubscribe();
    this.guardado?.unsubscribe();
  }

  private cargarPaciente(): void {
    this.consultaPaciente?.unsubscribe();
    this.pacienteSeleccionado.set(null);

    const sesion = this.autenticacionService.sesion();
    const id = this.pacienteId;

    if (!sesion || sesion.rol !== 'PSICOLOGO' || id === null) {
      return;
    }

    this.consultaPaciente = this.pacientesService.listarPacientes(sesion.usuarioId).subscribe({
      next: (pacientes) => {
        const paciente = pacientes.find((fila) => fila.pacienteId === id);
        this.pacienteSeleccionado.set(paciente ?? null);
      },
      error: () => {
        this.pacienteSeleccionado.set(null);
      },
    });
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

  guardarInformacion(): void {
    if (this.pacienteId === null || this.guardando()) {
      return;
    }

    const fecha = new Date();
    const { notaInterna, resumenCompartido, recomendacionCompartida } =
      this.sesionForm.getRawValue();

    this.fechaMostrada.set(fecha);
    this.mensaje.set('');
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
          this.mensaje.set('Información de sesión guardada correctamente.');
          this.cargarHistorial();
        },
        error: () => {
          this.guardando.set(false);
          this.errorGuardado.set('No se pudo confirmar el guardado de la sesión.');
        },
      });
  }
}
