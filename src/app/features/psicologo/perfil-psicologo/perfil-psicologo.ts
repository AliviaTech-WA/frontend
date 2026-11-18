import { ChangeDetectorRef, Component, inject, OnInit, TemplateRef } from '@angular/core';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { EditarPerfil } from './components/editar-perfil/editar-perfil';
import { PerfilPsicologoService } from './services/perfil-psicologo-service';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogClose } from '@angular/material/dialog';
import { CambiarContrasena } from './components/cambiar-contrasena/cambiar-contrasena';

@Component({
  imports: [MatButton, MatDialogClose],
  selector: 'app-perfil-psicologo',
  styleUrl: './perfil-psicologo.css',
  templateUrl: './perfil-psicologo.html',
})
export class PerfilPsicologo implements OnInit {
  private autenticacionService = inject(AutenticacionService);
  // HU07: permite redirigir al psicólogo al login después de salir.
  private readonly router = inject(Router);
  private perfilService = inject(PerfilPsicologoService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  // HU07: elimina el token y los datos de la sesión del psicólogo.
  cerrarSesion(): void {
    this.autenticacionService.cerrarSesionLocal();

    // Redirige al login sin conservar el perfil en el historial.
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  psicologo = {
    nombres: '',
    apellidos: '',
    dni: '',
    colegiatura: '',
    especialidad: '',
    telefono: '',
    correo: '',
  };

  cargando = false;
  mensajeError = '';

  ngOnInit() {
    this.cargarPerfil();
  }

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
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.mensajeError = 'No se pudo cargar el perfil.';
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirEdicion(confirmacion: TemplateRef<unknown>): void {
    const sesion = this.autenticacionService.sesion();

    if (!sesion || sesion.rol !== 'PSICOLOGO') {
      this.mensajeError = 'No hay una sesión de psicólogo activa.';
      return;
    }

    const dialogRef = this.dialog.open(EditarPerfil, {
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        psicologoId: sesion.usuarioId,
        correo: this.psicologo.correo,
        telefono: this.psicologo.telefono,
        especialidad: this.psicologo.especialidad,
      },
    });

    dialogRef.afterClosed().subscribe((perfilActualizado) => {
      if (!perfilActualizado) return;

      this.psicologo.correo = perfilActualizado.correo;
      this.psicologo.telefono = perfilActualizado.telefono;
      this.psicologo.especialidad = perfilActualizado.especialidad;
      this.cdr.markForCheck();

      this.dialog.open(confirmacion, {
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        ariaLabel: 'Perfil actualizado correctamente',
      });
    });
  }
  abrirCambioContrasena(confirmacion: TemplateRef<unknown>): void {
    const dialogRef = this.dialog.open<CambiarContrasena, void, boolean>(CambiarContrasena, {
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',
      ariaLabel: 'Cambiar contraseña',
    });

    dialogRef.afterClosed().subscribe((actualizada) => {
      if (!actualizada) return;

      this.dialog.open(confirmacion, {
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        ariaLabel: 'Contraseña actualizada',
        data: { titulo: 'Contraseña actualizada' },
      });
    });
  }
}
