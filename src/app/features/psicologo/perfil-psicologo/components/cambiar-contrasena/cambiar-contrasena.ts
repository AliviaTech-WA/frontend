import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { AutenticacionService } from '../../../../../core/services/autenticacion.service';
import { camposCoinciden } from '../../../../../shared/validators/contrasena.validators';

@Component({
  selector: 'app-cambiar-contrasena',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatFormField,
    MatInput,
  ],
  templateUrl: './cambiar-contrasena.html',
  styleUrl: '../editar-perfil/editar-perfil.css',
})
export class CambiarContrasena {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly dialogRef = inject<MatDialogRef<CambiarContrasena, boolean>>(MatDialogRef);

  readonly guardando = signal(false);
  readonly mensajeError = signal('');

  readonly formulario = this.fb.nonNullable.group(
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
      confirmarContrasena: ['', Validators.required],
    },
    { validators: camposCoinciden('nuevaContrasena', 'confirmarContrasena') },
  );

  guardar(): void {
    if (this.guardando()) return;

    this.mensajeError.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      this.mensajeError.set(
        this.formulario.hasError('camposNoCoinciden')
          ? 'La nueva contraseña y su confirmación no coinciden.'
          : 'Completa los tres campos. La nueva contraseña debe tener entre 8 y 72 caracteres.',
      );
      return;
    }

    const sesion = this.autenticacion.sesion();
    if (!sesion) {
      this.mensajeError.set('Tu sesión no está disponible. Vuelve a iniciar sesión.');
      return;
    }

    const { contrasenaActual, nuevaContrasena } = this.formulario.getRawValue();
    this.guardando.set(true);
    this.dialogRef.disableClose = true;

    this.autenticacion
      .cambiarContrasena(sesion.usuarioId, contrasenaActual, nuevaContrasena)
      .subscribe({
        next: () => {
          this.formulario.reset();
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando.set(false);
          this.dialogRef.disableClose = false;

          this.mensajeError.set(
            error.status === 400
              ? 'Revisa la contraseña actual y los requisitos de la nueva contraseña.'
              : 'No se pudo actualizar la contraseña. Intenta nuevamente.',
          );
        },
      });
  }
}
