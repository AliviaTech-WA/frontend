import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { ResumenPaciente } from './models/resumen-paciente.model';
import { ResumenPacienteService } from './services/resumen-paciente.service';

@Component({
  selector: 'app-resumen-paciente',
  imports: [DatePipe, DecimalPipe, LowerCasePipe, RouterLink],
  templateUrl: './resumen-paciente.html',
  styleUrl: './resumen-paciente.css',
})
export class ResumenPacienteComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly resumenService = inject(ResumenPacienteService);
  private cambiosRuta?: Subscription;

  // HU24: estado de la pantalla
  pacienteId: number | null = null;
  resumen = signal<ResumenPaciente | null>(null);
  cargando = signal(false);
  errorCarga = signal('');

  iniciales = computed(() =>
    (this.resumen()?.nombreCompleto ?? '')
      .split(' ')
      .filter((parte) => parte)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join(''),
  );

  totalNovedades = computed(() => {
    const novedades = this.resumen()?.novedades;
    return novedades
      ? novedades.registros + novedades.lecturasRelevantes + novedades.episodiosConfirmados
      : 0;
  });

  edad = computed(() => {
    const fecha = this.resumen()?.fechaNacimiento;
    if (!fecha) return null;
    const nacimiento = new Date(`${fecha}T00:00:00`);
    const hoy = new Date();
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    const cumplio =
      hoy.getMonth() > nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
    if (!cumplio) anios--;
    return anios;
  });

  ngOnInit(): void {
    this.cambiosRuta = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('pacienteId'));
      this.pacienteId = Number.isSafeInteger(id) && id > 0 ? id : null;
      this.cargarResumen();
    });
  }

  ngOnDestroy(): void {
    this.cambiosRuta?.unsubscribe();
  }

  cargarResumen(): void {
    if (this.pacienteId === null) {
      this.errorCarga.set('El paciente indicado no es válido.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');

    this.resumenService
      .consultar(this.pacienteId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (respuesta) => this.resumen.set(respuesta),
        error: (error: HttpErrorResponse) => {
          this.resumen.set(null);
          this.errorCarga.set(
            error.status === 403
              ? 'No tienes acceso al seguimiento de este paciente.'
              : error.status === 404
                ? 'Este paciente no tiene un seguimiento activo.'
                : 'No pudimos cargar el resumen. Intenta nuevamente.',
          );
        },
      });
  }

  nombreDia(fecha: string): string {
    const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    return dias[new Date(`${fecha}T00:00:00`).getDay()];
  }

  // Ansiedad en escala 1-10 y sueño hasta 10 horas, expresados en porcentaje de la barra
  alturaAnsiedad(valor: number | null): number {
    return valor === null ? 0 : Math.min(100, (valor / 10) * 100);
  }

  alturaSueno(valor: number | null): number {
    return valor === null ? 0 : Math.min(100, (valor / 10) * 100);
  }
}
