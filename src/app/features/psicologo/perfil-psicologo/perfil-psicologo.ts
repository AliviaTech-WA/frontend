import { Component, inject, OnInit } from '@angular/core';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { PerfilPsicologoService } from './services/perfil-psicologo-service';

@Component({
  imports: [],
  selector: 'app-perfil-psicologo',
  styleUrl: './perfil-psicologo.css',
  templateUrl: './perfil-psicologo.html',
})
export class PerfilPsicologo implements OnInit {
  // Servicios
  autenticacionService: AutenticacionService = inject(AutenticacionService);

  perfilService: PerfilPsicologoService = inject(PerfilPsicologoService);

  // Datos del perfil
  psicologo = {
    nombres: '',
    apellidos: '',
    dni: '',
    colegiatura: '',
    especialidad: '',
    telefono: '',
    correo: '',
  };

  // Estado de la consulta
  cargando: boolean = false;
  mensajeError: string = '';

  constructor() {}

  ngOnInit() {
    this.cargarPerfil();
  }

  // Consultar el perfil desde el backend
  cargarPerfil() {
    const sesion = this.autenticacionService.sesion();

    if (!sesion || sesion.rol !== 'PSICOLOGO') {
      this.mensajeError = 'No hay una sesión de psicólogo activa.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.perfilService.obtenerPerfil(sesion.usuarioId).subscribe({
      next: (data) => {
        this.psicologo = {
          nombres: data.nombres,
          apellidos: data.apellidos,
          dni: data.dni,
          colegiatura: data.numeroColegiatura,
          especialidad: data.especialidad,
          telefono: data.telefono,
          correo: data.correo,
        };

        this.cargando = false;
      },

      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.mensajeError = 'No se pudo cargar el perfil.';
        this.cargando = false;
      },
    });
  }
}
