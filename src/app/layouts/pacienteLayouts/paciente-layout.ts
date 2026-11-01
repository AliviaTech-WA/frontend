import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/components/sidebar/sidebar';

@Component({
  imports: [RouterOutlet, Sidebar],
  selector: 'app-layout-paciente',
  styleUrl: './paciente-layout.css',
  templateUrl: './paciente-layout.html',
})
export class PacienteLayout {}
