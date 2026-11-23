import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmacion-cambio-contrasena',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirmacion-cambio-contrasena.html',
  styleUrl: './confirmacion-cambio-contrasena.css',
})
export class ConfirmacionCambioContrasena {}
