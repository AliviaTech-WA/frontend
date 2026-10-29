import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  imports: [RouterOutlet, Sidebar],
  selector: 'app-layout-paciente',
  styleUrl: './layout-paciente.css',
  templateUrl: './layout-paciente.html',
})
export class LayoutPaciente {}
