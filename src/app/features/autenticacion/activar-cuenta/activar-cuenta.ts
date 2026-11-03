import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { camposCoinciden } from '../../../shared/validators/contrasena.validators';
import { ActivarPacienteResponse } from './models/activacion-paciente.model';
import { ActivacionPacienteService } from './services/activacion-paciente.service';

@Component({
  selector: 'app-activar-cuenta',
  imports: [AuthShell, ReactiveFormsModule, RouterLink],
  templateUrl: './activar-cuenta.html',
  styleUrl: './activar-cuenta.css',
})
export class ActivarCuenta {
  private readonly activacionService = inject(ActivacionPacienteService);

  protected cargando = false;
  protected intentoEnvio = false;
  protected mensajeError = '';
  protected activacion: ActivarPacienteResponse | null = null;

  protected readonly formulario = new FormGroup(
    {
      correo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(254)],
      }),
      codigoActivacion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
      }),
      contrasena: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
      }),
      confirmarContrasena: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      aceptaTratamientoDatos: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
    },
    { validators: [camposCoinciden('contrasena', 'confirmarContrasena')] },
  );

  protected campoInvalido(nombre: keyof ActivarCuenta['formulario']['controls']): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && (control.touched || this.intentoEnvio);
  }

  protected confirmacionInvalida(): boolean {
    const confirmacion = this.formulario.controls.confirmarContrasena;
    return (
      (confirmacion.touched || this.intentoEnvio) &&
      (confirmacion.invalid || this.formulario.hasError('camposNoCoinciden'))
    );
  }

  protected activarCuenta(): void {
    this.intentoEnvio = true;
    this.mensajeError = '';
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid || this.cargando) {
      return;
    }

    this.cargando = true;
    this.activacionService
      .activar({
        correo: this.formulario.controls.correo.value.trim(),
        codigoActivacion: this.formulario.controls.codigoActivacion.value.trim(),
        contrasena: this.formulario.controls.contrasena.value,
        aceptaTratamientoDatos: this.formulario.controls.aceptaTratamientoDatos.value,
      })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          this.activacion = respuesta;
          this.formulario.reset();
        },
        error: (error: unknown) => {
          this.mensajeError = this.obtenerMensajeError(error);
        },
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'La respuesta del servidor no tiene el formato esperado.';
    }

    if (error.status === 400) {
      const mensajeBackend = this.extraerMensajeBackend(error);
      return (
        mensajeBackend ??
        'No pudimos activar la cuenta. Verifica el correo, el código y que la invitación siga vigente.'
      );
    }

    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
    }

    if (error.status >= 500) {
      return 'El servidor no pudo completar la activación. Inténtalo más tarde.';
    }

    return 'No pudimos activar la cuenta. Inténtalo nuevamente.';
  }

  private extraerMensajeBackend(error: HttpErrorResponse): string | null {
    const cuerpo = error.error as { message?: unknown } | null;
    return typeof cuerpo?.message === 'string' && cuerpo.message.trim()
      ? cuerpo.message.trim()
      : null;
  }
}
