import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RolUsuario } from '../../../core/models/autenticacion.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';

@Component({
  selector: 'app-login',
  imports: [AuthShell, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);

  protected cargando = false;
  protected intentoEnvio = false;
  protected mensajeError = '';

  protected readonly formulario = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected campoInvalido(nombre: keyof Login['formulario']['controls']): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && (control.touched || this.intentoEnvio);
  }

  protected ingresar(): void {
    this.intentoEnvio = true;
    this.mensajeError = '';
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid || this.cargando) {
      return;
    }

    this.cargando = true;
    this.autenticacion
      .iniciarSesion({
        correo: this.formulario.controls.correo.value.trim(),
        contrasena: this.formulario.controls.contrasena.value,
      })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (sesion) => this.navegarSegunRol(sesion.rol),
        error: (error: unknown) => {
          this.mensajeError = this.obtenerMensajeError(error);
        },
      });
  }

  private navegarSegunRol(rol: RolUsuario): void {
    void this.router.navigate([rol === 'PACIENTE' ? '/paciente' : '/psicologo']);
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'La respuesta del servidor no tiene el formato esperado. Inténtalo nuevamente.';
    }

    if (error.status === 401) {
      return 'El correo o la contraseña son incorrectos.';
    }

    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
    }

    if (error.status >= 500) {
      return 'El servidor no pudo procesar el inicio de sesión. Inténtalo más tarde.';
    }

    return 'No pudimos iniciar sesión. Verifica los datos e inténtalo nuevamente.';
  }
}
