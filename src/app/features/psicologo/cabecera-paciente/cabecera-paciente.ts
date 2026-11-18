import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';

import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { PacienteSeguimiento } from '../pacientes/models/paciente-seguimiento.model';
import { PacientesService } from '../pacientes/services/pacientes.service';
import { ResumenActualService } from '../resumen-paciente/services/resumen-actual.service';

// HU25-HU27: cabecera común del paciente en las pestañas de seguimiento
@Component({
  selector: 'app-cabecera-paciente',
  imports: [DatePipe],
  templateUrl: './cabecera-paciente.html',
  styleUrl: './cabecera-paciente.css',
})
export class CabeceraPaciente implements OnInit {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly pacientesService = inject(PacientesService);
  private readonly resumenActual = inject(ResumenActualService);

  pacienteId = input.required<number | null>();

  // Datos básicos de la lista, usados si no hay un resumen guardado
  basico = signal<PacienteSeguimiento | null>(null);

  resumen = computed(() => this.resumenActual.obtener(this.pacienteId()));

  nombre = computed(() => {
    const resumen = this.resumen();
    if (resumen) return resumen.nombreCompleto;
    const basico = this.basico();
    return basico ? `${basico.nombres} ${basico.apellidos}` : '';
  });

  iniciales = computed(() =>
    this.nombre()
      .split(' ')
      .filter((parte) => parte)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join(''),
  );

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
    if (this.resumen()) return;

    const sesion = this.autenticacion.sesion();
    if (!sesion || sesion.rol !== 'PSICOLOGO') return;

    this.pacientesService.listarPacientes(sesion.usuarioId).subscribe({
      next: (lista) => this.basico.set(lista.find((fila) => fila.pacienteId === this.pacienteId()) ?? null),
      error: () => this.basico.set(null),
    });
  }
}
