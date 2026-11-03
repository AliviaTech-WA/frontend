import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-perfil-psicologo',
  styleUrl: './perfil-psicologo.css',
  templateUrl: './perfil-psicologo.html',
})
export class PerfilPsicologo {
  // Datos temporales para construir la interfaz
  // Posteriormente se obtendrán del backend
  psicologo = {
    nombres: 'Andrea',
    apellidos: 'Salazar Mendoza',
    dni: '70451236',
    colegiatura: 'CPSP 45872',
    especialidad: 'Psicología clínica',
    telefono: '989 321 456',
    correo: 'andrea@consulta.pe'
  };
}
