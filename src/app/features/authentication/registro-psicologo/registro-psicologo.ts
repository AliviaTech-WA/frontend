import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CrearPsicologoRequest } from './models/registro-psicologo.model';
import { RegistroPsicologoService } from './services/registro-psicologo.service';

function contenidoRequerido(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length === 0 ? { soloEspacios: true } : null;
}

function contrasenasCoinciden(control: AbstractControl): ValidationErrors | null {
  const contrasena = control.get('contrasena')?.value as string | undefined;
  const confirmacion = control.get('confirmarContrasena')?.value as string | undefined;

  if (!contrasena || !confirmacion || contrasena === confirmacion) {
    return null;
  }

  return { contrasenasNoCoinciden: true };
}

type EstadoRegistro = 1 | 2 | 'exito' | 'duplicado';

@Component({
  selector: 'app-registro-psicologo',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButton,
    MatCheckbox,
    MatError,
    MatFormField,
    MatInput,
    MatProgressSpinner,
  ],
  templateUrl: './registro-psicologo.html',
  styleUrls: ['./registro-psicologo.css', './registro-psicologo-estados.css'],
})
export class RegistroPsicologo {
  private readonly registroService = inject(RegistroPsicologoService);

  protected readonly pasoActual = signal<EstadoRegistro>(1);
  protected intentoContinuar = false;
  protected intentoRegistrar = false;
  protected readonly cargando = signal(false);
  protected readonly mensajeError = signal('');

  protected readonly formulario = new FormGroup({
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, contenidoRequerido, Validators.maxLength(100)],
    }),
    apellidos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, contenidoRequerido, Validators.maxLength(100)],
    }),
    dni: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, contenidoRequerido, Validators.maxLength(8)],
    }),
    correoProfesional: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        contenidoRequerido,
        Validators.email,
        Validators.maxLength(254),
      ],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
  });

  protected readonly formularioProfesional = new FormGroup(
    {
      numeroColegiatura: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, contenidoRequerido, Validators.maxLength(30)],
      }),
      especialidad: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, contenidoRequerido, Validators.maxLength(100)],
      }),
      contrasena: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, contenidoRequerido],
      }),
      confirmarContrasena: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      aceptaTerminos: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
      confirmaDatos: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
    },
    { validators: [contrasenasCoinciden] },
  );

  protected readonly confirmacionErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control) =>
      !!control &&
      (control.touched || this.intentoRegistrar) &&
      (control.invalid || this.formularioProfesional.hasError('contrasenasNoCoinciden')),
  };

  protected campoProfesionalInvalido(
    nombre: keyof RegistroPsicologo['formularioProfesional']['controls'],
  ): boolean {
    const control = this.formularioProfesional.controls[nombre];
    return control.invalid && (control.touched || this.intentoRegistrar);
  }

  protected get correoIngresado(): string {
    return this.formulario.controls.correoProfesional.value.trim();
  }

  protected continuar(): void {
    this.intentoContinuar = true;
    this.mensajeError.set('');
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid) {
      return;
    }

    this.pasoActual.set(2);
  }

  protected volverADatosPersonales(): void {
    this.mensajeError.set('');
    this.pasoActual.set(1);
  }

  protected crearCuentaProfesional(): void {
    this.intentoRegistrar = true;
    this.mensajeError.set('');
    this.formulario.markAllAsTouched();
    this.formularioProfesional.markAllAsTouched();

    if (this.formulario.invalid || this.formularioProfesional.invalid || this.cargando()) {
      return;
    }

    const telefono = this.formulario.controls.telefono.value.trim();
    const solicitud: CrearPsicologoRequest = {
      dni: this.formulario.controls.dni.value.trim(),
      nombres: this.formulario.controls.nombres.value.trim(),
      apellidos: this.formulario.controls.apellidos.value.trim(),
      correo: this.formulario.controls.correoProfesional.value.trim(),
      telefono: telefono || null,
      contrasena: this.formularioProfesional.controls.contrasena.value,
      numeroColegiatura: this.formularioProfesional.controls.numeroColegiatura.value.trim(),
      especialidad: this.formularioProfesional.controls.especialidad.value.trim(),
    };

    this.cargando.set(true);
    this.registroService
      .crear(solicitud)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => {
          this.pasoActual.set('exito');
        },
        error: (error: unknown) => {
          this.mensajeError.set(this.obtenerMensajeError(error));

          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.pasoActual.set('duplicado');
          }
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'La respuesta del servidor no tiene el formato esperado. Inténtalo nuevamente.';
    }

    if (error.status === 400) {
      return (
        this.extraerMensajeBackend(error) ??
        'Los datos enviados no son válidos. Revísalos e inténtalo nuevamente.'
      );
    }

    if (error.status === 409) {
      return (
        this.extraerMensajeBackend(error) ??
        'El DNI, correo o número de colegiatura ya está asociado a otra cuenta.'
      );
    }

    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
    }

    if (error.status >= 500) {
      return 'El servidor no pudo crear la cuenta. Inténtalo más tarde.';
    }

    return 'No pudimos crear la cuenta profesional. Inténtalo nuevamente.';
  }

  private extraerMensajeBackend(error: HttpErrorResponse): string | null {
    const cuerpo = error.error as { message?: unknown } | null;
    return typeof cuerpo?.message === 'string' && cuerpo.message.trim()
      ? cuerpo.message.trim()
      : null;
  }
}
