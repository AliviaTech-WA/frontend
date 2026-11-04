
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { ConsultaDispositivoAsignado } from '../dispositivos/models/dispositivo.model';
import { DispositivoService } from '../dispositivos/services/dispositivo.service';

@Component({
  selector: 'app-perfil-paciente',
  imports: [DatePipe, FormsModule],
  templateUrl: './perfil-paciente.html',
  styleUrl: './perfil-paciente.css',
})
export class PerfilPaciente implements OnInit {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly dispositivoService = inject(DispositivoService);

  dispositivo: ConsultaDispositivoAsignado | null = null;

  cargando = false;
  guardando = false;

  errorCarga = '';
  errorAlias = '';
  mensajeExito = '';

  modalAbierto = false;
  aliasFormulario = '';

  get aliasLimpio(): string {
    return this.aliasFormulario.trim();
  }

  get aliasValido(): boolean {
    return this.aliasLimpio.length > 0
      && this.aliasLimpio.length <= 100;
  }

  get aliasModificado(): boolean {
    return this.aliasLimpio !==
      (this.dispositivo?.alias ?? '').trim();
  }

  ngOnInit(): void {
    this.cargarDispositivo();
  }

  // HU14: Consultar dispositivo
  cargarDispositivo(): void {
    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorCarga =
        'Inicia sesión como paciente para consultar tu dispositivo.';
      return;
    }

    this.cargando = true;
    this.errorCarga = '';

    this.dispositivoService.consultar(sesion.usuarioId)
      .pipe(
        finalize(() => (this.cargando = false))
      )
      .subscribe({
        next: (respuesta) => {
          this.dispositivo = respuesta;
        },
        error: (error: HttpErrorResponse) => {
          this.dispositivo = null;

          this.errorCarga = error.status === 404
            ? 'Todavía no tienes un dispositivo asignado.'
            : error.status === 403
              ? 'No tienes permiso para consultar este dispositivo.'
              : 'No pudimos cargar tu dispositivo. Intenta nuevamente.';
        },
      });
  }

  // HU15: Abrir modal
  abrirRenombrar(): void {
    if (!this.dispositivo) return;

    this.aliasFormulario = this.dispositivo.alias ?? '';
    this.errorAlias = '';
    this.mensajeExito = '';
    this.modalAbierto = true;
  }

  // HU15: Cerrar modal
  cerrarRenombrar(): void {
    if (this.guardando) return;

    this.modalAbierto = false;
    this.errorAlias = '';
  }

  // HU15: Guardar alias en el backend
  guardarAlias(): void {
    if (this.guardando) return;

    if (!this.aliasValido) {
      this.errorAlias = this.aliasLimpio.length === 0
        ? 'Ingresa un nombre para tu dispositivo.'
        : 'El nombre no debe superar los 100 caracteres.';
      return;
    }

    if (!this.aliasModificado) {
      this.cerrarRenombrar();
      return;
    }

    const sesion = this.autenticacion.sesion();

    if (!sesion || sesion.rol !== 'PACIENTE') {
      this.errorAlias =
        'Tu sesión no está disponible. Vuelve a iniciar sesión.';
      return;
    }

    this.guardando = true;
    this.errorAlias = '';

    this.dispositivoService.renombrar(
      sesion.usuarioId,
      { alias: this.aliasLimpio }
    )
      .pipe(
        finalize(() => (this.guardando = false))
      )
      .subscribe({
        next: (respuesta) => {
          this.dispositivo = respuesta;
          this.modalAbierto = false;
          this.mensajeExito =
            'Cambios guardados. El nombre de tu dispositivo se actualizó correctamente.';
        },
        error: (error: HttpErrorResponse) => {
          this.errorAlias = error.status === 400
            ? 'El nombre no es válido. Revisa el campo e intenta nuevamente.'
            : error.status === 403
              ? 'No tienes permiso para modificar este dispositivo.'
              : 'No se pudo guardar el nombre. Intenta nuevamente.';
        },
      });
  }
}
