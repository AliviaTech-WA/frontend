import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { RegistrarPacienteResponse } from '../models/registro-paciente.model';

@Component({
  selector: 'app-registro-paciente-exitoso-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './registro-paciente-exitoso-dialog.html',
  styleUrl: './registro-paciente-exitoso-dialog.css',
  encapsulation: ViewEncapsulation.None,
})
export class RegistroPacienteExitosoDialog {
  protected readonly datos = inject<RegistrarPacienteResponse>(MAT_DIALOG_DATA);
}
