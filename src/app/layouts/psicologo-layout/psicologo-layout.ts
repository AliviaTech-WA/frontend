import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarPsicologo } from './components/sidebar-psicologo/sidebar-psicologo';

@Component({
  imports: [RouterOutlet, SidebarPsicologo],
  selector: 'app-psicologo-layout',
  styleUrl: './psicologo-layout.css',
  templateUrl: './psicologo-layout.html',
})
export class PsicologoLayout {}
