import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
})
export class AuthShell {
  readonly etiqueta = input('');
  readonly titulo = input('Información que acompaña tu proceso, sin invadirlo.');
  readonly descripcion = input(
    'Registra, organiza y revisa información de bienestar de forma clara, tranquila y segura.',
  );
}
