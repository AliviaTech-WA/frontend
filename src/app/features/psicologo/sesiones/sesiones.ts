import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
  imports: [
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
export class Sesiones {
  private fb = inject(FormBuilder);

  // Datos temporales para reproducir el diseño de Figma.
  // Después se obtendrán del paciente seleccionado.
  paciente = {
    nombres: 'Marta González',
    iniciales: 'MG',
    edad: 34,
    dni: '73124568',
    estado: 'Activa',
  };

  mensaje = '';

  sesionForm = this.fb.nonNullable.group({
    fechaSesion: ['', Validators.required],
    notaInterna: [''],
    resumenCompartido: [''],
    recomendacionCompartida: [''],
  });

  guardarInformacion() {
    this.mensaje = '';

    if (this.sesionForm.invalid) {
      this.sesionForm.markAllAsTouched();
      return;
    }

    // Por ahora solo comprobamos el formulario.
    // Aquí conectaremos el registro con el backend.
    this.mensaje = 'Formulario válido. El guardado todavía está pendiente de conexión.';
  }
}
