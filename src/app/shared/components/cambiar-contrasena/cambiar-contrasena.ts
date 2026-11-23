import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';

import { CambiarContrasenaRequest } from '../../../core/models/cambio-contrasena.model';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { camposCoinciden, camposDiferentes } from '../../validators/contrasena.validators';
import { ConfirmacionCambioContrasena } from '../confirmacion-cambio-contrasena/confirmacion-cambio-contrasena';

interface ErrorApi {
  code?: unknown;
  message?: unknown;
}

@Component({
  selector: 'app-cambiar-contrasena',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './cambiar-contrasena.html',
  styleUrl: './cambiar-contrasena.css',
})
export class CambiarContrasena {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject<MatDialogRef<CambiarContrasena, boolean>>(MatDialogRef);

  protected readonly guardando = signal(false);
  protected readonly mensajeError = signal('');
  protected readonly mostrarActual = signal(false);
  protected readonly mostrarNueva = signal(false);
  protected readonly mostrarConfirmacion = signal(false);

  protected readonly formulario = this.fb.nonNullable.group(
    {
      contrasenaActual: ['', [Validators.required, Validators.pattern(/\S/)]],
      nuevaContrasena: [
        '',
        [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.minLength(8),
          Validators.maxLength(72),
        ],
      ],
      confirmarContrasena: ['', [Validators.required]],
    },
    {
      validators: [
        camposCoinciden('nuevaContrasena', 'confirmarContrasena'),
        camposDiferentes('contrasenaActual', 'nuevaContrasena'),
      ],
    },
  );

  protected guardar(): void {
    if (this.guardando()) return;

    this.mensajeError.set('');
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid) {
      return;
    }

    const sesion = this.autenticacion.sesion();

    if (!sesion) {
      this.mensajeError.set('Tu sesión no está disponible. Vuelve a iniciar sesión.');
      return;
    }

    const { contrasenaActual, nuevaContrasena } = this.formulario.getRawValue();
    const solicitud: CambiarContrasenaRequest = { contrasenaActual, nuevaContrasena };

    this.guardando.set(true);
    this.dialogRef.disableClose = true;

    this.autenticacion
      .cambiarContrasena(sesion.usuarioId, solicitud)
      .pipe(
        finalize(() => {
          this.guardando.set(false);
          this.dialogRef.disableClose = false;
        }),
      )
      .subscribe({
        next: () => {
          this.formulario.reset();

          const confirmacion = this.dialog.open(ConfirmacionCambioContrasena, {
            width: '440px',
            maxWidth: 'calc(100vw - 32px)',
            ariaLabel: 'Contraseña actualizada correctamente',
            disableClose: true,
          });

          confirmacion.afterClosed().subscribe(() => this.dialogRef.close(true));
        },
        error: (error: unknown) => {
          this.mensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  protected mostrarErrorDiferencia(): boolean {
    return (
      this.formulario.hasError('camposIguales') &&
      (this.formulario.controls.contrasenaActual.touched ||
        this.formulario.controls.nuevaContrasena.touched)
    );
  }

  protected mostrarErrorConfirmacion(): boolean {
    return (
      this.formulario.hasError('camposNoCoinciden') &&
      this.formulario.controls.confirmarContrasena.touched
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'La respuesta del servidor no tiene el formato esperado. Inténtalo nuevamente.';
    }

    const cuerpo = error.error as ErrorApi | null;
    const codigo = typeof cuerpo?.code === 'string' ? cuerpo.code : '';
    const mensaje = typeof cuerpo?.message === 'string' ? cuerpo.message.trim() : '';

    if (error.status === 400) {
      if (mensaje.toLocaleLowerCase().includes('contraseña actual')) {
        return 'La contraseña actual no es correcta.';
      }

      if (codigo === 'VALIDATION_ERROR') {
        return 'La nueva contraseña debe tener entre 8 y 72 caracteres.';
      }

      return mensaje || 'Revisa la contraseña actual y los requisitos de la nueva contraseña.';
    }

    if (error.status === 401) {
      return 'Tu sesión no es válida o ha expirado. Vuelve a iniciar sesión.';
    }

    if (error.status === 403) {
      return 'No tienes permiso para cambiar la contraseña de esta cuenta.';
    }

    if (error.status === 404) {
      return 'No se encontró la cuenta asociada a tu sesión.';
    }

    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
    }

    if (error.status >= 500) {
      return 'El servidor no pudo actualizar la contraseña. Inténtalo más tarde.';
    }

    return 'No se pudo actualizar la contraseña. Intenta nuevamente.';
  }
}
