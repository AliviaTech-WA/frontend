import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { PsicologoPerfil } from '../../models/psicologo-perfil.model';
import { PerfilPsicologoService } from '../../services/perfil-psicologo-service';

@Component({
  selector: 'app-editar-perfil',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatFormField,
    MatInput,
    MatError,
  ],
  templateUrl: './editar-perfil.html',
  styleUrl: './editar-perfil.css',
})
export class EditarPerfil {
  private fb = inject(FormBuilder);
  private perfilService = inject(PerfilPsicologoService);
  private dialogRef = inject<MatDialogRef<EditarPerfil, PsicologoPerfil>>(MatDialogRef);
  private datos: Pick<PsicologoPerfil, 'psicologoId' | 'correo' | 'telefono' | 'especialidad'> =
    inject(MAT_DIALOG_DATA);

  perfilForm: FormGroup;
  guardando = false;
  mensajeError = '';

  constructor() {
    this.perfilForm = this.fb.nonNullable.group({
      correo: [
        this.datos.correo ?? '',
        [Validators.required, Validators.email, Validators.maxLength(254)],
      ],
      telefono: [
        this.datos.telefono ?? '',
        [Validators.required, Validators.pattern(/\S/), Validators.maxLength(20)],
      ],
      especialidad: [
        this.datos.especialidad ?? '',
        [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
      ],
    });
  }

  guardarPerfil() {
    if (this.guardando) {
      return;
    }

    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const { correo, telefono, especialidad } = this.perfilForm.getRawValue();
    this.guardando = true;
    this.mensajeError = '';

    this.perfilService
      .actualizarPerfil(this.datos.psicologoId, {
        correo: correo.trim(),
        telefono: telefono.trim(),
        especialidad: especialidad.trim(),
      })
      .subscribe({
        next: (perfilActualizado) => {
          this.dialogRef.close(perfilActualizado);
        },
        error: () => {
          this.guardando = false;
          this.mensajeError = 'No se pudo guardar el perfil. Intenta nuevamente.';
        },
      });
  }
}
