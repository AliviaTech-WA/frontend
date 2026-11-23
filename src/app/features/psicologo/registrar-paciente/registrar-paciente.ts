import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, Injectable, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { RegistrarPacienteRequest } from './models/registro-paciente.model';
import { PacientesService } from '../pacientes/services/pacientes.service';
import { RegistroPacienteExitosoDialog } from './registro-paciente-exitoso-dialog/registro-paciente-exitoso-dialog';

@Injectable()
class FechaLocalDateAdapter extends NativeDateAdapter {
  override parse(valor: unknown): Date | null {
    if (valor instanceof Date) {
      return valor;
    }

    if (typeof valor !== 'string' || valor.trim().length === 0) {
      return null;
    }

    const coincidencia = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(valor.trim());

    if (!coincidencia) {
      return this.invalid();
    }

    const dia = Number(coincidencia[1]);
    const mes = Number(coincidencia[2]) - 1;
    const anio = Number(coincidencia[3]);
    const fecha = new Date(anio, mes, dia);

    return fecha.getFullYear() === anio && fecha.getMonth() === mes && fecha.getDate() === dia
      ? fecha
      : this.invalid();
  }
}

function contenidoRequerido(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  return typeof valor === 'string' && valor.trim().length === 0
    ? { soloEspacios: true }
    : null;
}

function fechaNacimientoPasada(control: AbstractControl): ValidationErrors | null {
  const fecha = control.value;

  if (fecha === null || fecha === undefined || fecha === '') {
    return null;
  }

  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
    return { fechaInvalida: true };
  }

  const fechaLocal = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return fechaLocal < hoy ? null : { fechaNoPasada: true };
}

@Component({
  selector: 'app-registrar-paciente',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: DateAdapter, useClass: FechaLocalDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ],
  templateUrl: './registrar-paciente.html',
  styleUrl: './registrar-paciente.css',
})
export class RegistrarPaciente {
  private readonly formBuilder = inject(FormBuilder);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly pacientesService = inject(PacientesService);
  private readonly dialog = inject(MatDialog);

  protected readonly cargando = signal(false);
  protected readonly mensajeError = signal('');

  protected readonly fechaMaxima = (() => {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() - 1);
    return fecha;
  })();

  protected readonly formulario: FormGroup = this.formBuilder.group({
    nombres: this.formBuilder.nonNullable.control('', [
      Validators.required,
      contenidoRequerido,
      Validators.maxLength(100),
    ]),
    apellidos: this.formBuilder.nonNullable.control('', [
      Validators.required,
      contenidoRequerido,
      Validators.maxLength(100),
    ]),
    dni: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^\d{8}$/),
    ]),
    fechaNacimiento: this.formBuilder.control<Date | null>(null, [
      Validators.required,
      fechaNacimientoPasada,
    ]),
    correo: this.formBuilder.nonNullable.control('', [
      Validators.required,
      contenidoRequerido,
      Validators.email,
      Validators.maxLength(254),
    ]),
    telefono: this.formBuilder.nonNullable.control('', [
      Validators.required,
      contenidoRequerido,
      Validators.maxLength(20),
    ]),
    modelo: this.formBuilder.nonNullable.control('', [
      Validators.required,
      contenidoRequerido,
      Validators.maxLength(100),
    ]),
    alias: this.formBuilder.nonNullable.control('', [
      Validators.required,
      contenidoRequerido,
      Validators.maxLength(100),
    ]),
  });

  protected registrarPaciente(): void {
    this.mensajeError.set('');
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid || this.cargando()) {
      return;
    }

    const sesion = this.autenticacionService.sesion();

    if (!sesion || sesion.rol !== 'PSICOLOGO') {
      this.mensajeError.set('No hay una sesión de psicólogo activa. Inicia sesión nuevamente.');
      return;
    }

    const valores = this.formulario.getRawValue();

    if (!(valores.fechaNacimiento instanceof Date)) {
      this.mensajeError.set('Ingresa una fecha de nacimiento válida.');
      return;
    }

    const solicitud: RegistrarPacienteRequest = {
      dni: valores.dni.trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      fechaNacimiento: this.formatearFechaLocal(valores.fechaNacimiento),
      correo: valores.correo.trim(),
      telefono: valores.telefono.trim(),
      dispositivo: {
        modelo: valores.modelo.trim(),
        alias: valores.alias.trim(),
      },
    };

    this.cargando.set(true);
    this.pacientesService
      .registrarPaciente(sesion.usuarioId, solicitud)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (respuesta) => {
          const referenciaDialogo = this.dialog.open(RegistroPacienteExitosoDialog, {
            width: '430px',
            maxWidth: 'calc(100vw - 32px)',
            panelClass: 'registro-paciente-exitoso-panel',
            ariaLabel: 'Paciente registrado',
            disableClose: true,
            data: respuesta,
          });

          referenciaDialogo.afterClosed().subscribe(() => {
            this.formulario.reset();
          });
        },
        error: (error: unknown) => {
          this.mensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  private formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo procesar la respuesta del servidor. Inténtalo nuevamente.';
    }

    const mensajeBackend = this.extraerMensajeBackend(error);

    if (error.status === 400) {
      return mensajeBackend ?? 'Los datos enviados no son válidos. Revisa el formulario.';
    }

    if (error.status === 401) {
      return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para registrar pacientes con esta cuenta.';
    }

    if (error.status === 409) {
      return mensajeBackend ?? 'El DNI o correo ya está asociado a otra cuenta.';
    }

    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
    }

    if (error.status === 503) {
      return (
        mensajeBackend ??
        'No se pudo completar la invitación. Verifica la lista de pacientes antes de reintentar.'
      );
    }

    if (error.status >= 500) {
      return mensajeBackend ?? 'El servidor no pudo completar el registro. Inténtalo más tarde.';
    }

    return mensajeBackend ?? 'No pudimos registrar al paciente. Inténtalo nuevamente.';
  }

  private extraerMensajeBackend(error: HttpErrorResponse): string | null {
    const cuerpo = error.error as { message?: unknown } | null;
    return typeof cuerpo?.message === 'string' && cuerpo.message.trim()
      ? cuerpo.message.trim()
      : null;
  }
}
