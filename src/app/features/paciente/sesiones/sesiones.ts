
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { SesionesService } from './services/sesiones.service';

import {
  SesionDetalle,
  SesionResumen
} from './models/sesiones.model';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './sesiones.html',
  styleUrl: './sesiones.css'
})
export class Sesiones implements OnInit, OnDestroy {

  private readonly autenticacion = inject(AutenticacionService);
  private readonly sesionesService = inject(SesionesService);

  private detalleSubscription?: Subscription;

  // HU19
  sesiones = signal<SesionResumen[]>([]);
  cargando = signal(false);
  errorCarga = signal('');

  sesionReciente = computed(
    () => this.sesiones()[0] ?? null
  );

  sesionesAnteriores = computed(
    () => this.sesiones().slice(1)
  );

  ultimaRecomendacion = computed(() => {
    const sesion = this.sesiones().find(
      s => !!s.recomendacionCompartida?.trim()
    );

    return sesion?.recomendacionCompartida ?? null;
  });

  // HU20
  detalleAbierto = signal(false);
  detalle = signal<SesionDetalle | null>(null);
  cargandoDetalle = signal(false);
  errorDetalle = signal('');

  ngOnInit(): void {
    this.cargarSesiones();
  }

  ngOnDestroy(): void {
    this.detalleSubscription?.unsubscribe();
  }

  private obtenerPacienteId(): number | null {
    const sesion = this.autenticacion.sesion();

    return sesion?.rol === 'PACIENTE'
      ? sesion.usuarioId
      : null;
  }

  // HU19: HISTORIAL DE SESIONES
  cargarSesiones(): void {
    const pacienteId = this.obtenerPacienteId();

    if (pacienteId === null) {
      this.sesiones.set([]);
      this.errorCarga.set(
        'Debes iniciar sesión como paciente.'
      );
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');

    this.sesionesService.listarSesiones(pacienteId)
      .pipe(
        finalize(() => this.cargando.set(false))
      )
      .subscribe({
        next: (respuesta) => {
          this.sesiones.set(
            [...respuesta].sort(
              (a, b) =>
                new Date(b.fechaSesion).getTime() -
                new Date(a.fechaSesion).getTime()
            )
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error HU19:', error);

          this.sesiones.set([]);

          this.errorCarga.set(
            error.status === 404
              ? 'No se encontró un seguimiento activo.'
              : error.status === 403
                ? 'No tienes permiso para consultar tus sesiones.'
                : 'No pudimos cargar tus sesiones.'
          );
        }
      });
  }

  // HU20: DETALLE DE SESIÓN
  verDetalle(sesionId: number): void {
    this.detalleSubscription?.unsubscribe();

    this.detalleAbierto.set(true);
    this.detalle.set(null);
    this.errorDetalle.set('');
    this.cargandoDetalle.set(true);

    this.detalleSubscription =
      this.sesionesService.obtenerDetalle(sesionId)
        .pipe(
          finalize(() => {
            this.cargandoDetalle.set(false);
          })
        )
        .subscribe({
          next: (respuesta) => {
            this.detalle.set(respuesta);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error HU20:', error);

            this.errorDetalle.set(
              error.status === 404
                ? 'No se encontró esta sesión.'
                : error.status === 403
                  ? 'No tienes permiso para consultar esta sesión.'
                  : 'No pudimos cargar el detalle.'
            );
          }
        });
  }

  cerrarDetalle(): void {
    this.detalleSubscription?.unsubscribe();

    this.detalleAbierto.set(false);
    this.detalle.set(null);
    this.cargandoDetalle.set(false);
    this.errorDetalle.set('');
  }
}
