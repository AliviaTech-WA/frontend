import { Injectable, signal } from '@angular/core';
import { ResumenPaciente } from '../models/resumen-paciente.model';

// HU24: guarda el último resumen consultado para reutilizar la cabecera en las otras pestañas
// sin volver a llamar al endpoint del resumen (que registra la revisión del psicólogo).
@Injectable({ providedIn: 'root' })
export class ResumenActualService {
  readonly resumen = signal<ResumenPaciente | null>(null);

  guardar(resumen: ResumenPaciente): void {
    this.resumen.set(resumen);
  }

  obtener(pacienteId: number | null): ResumenPaciente | null {
    const actual = this.resumen();
    return actual && actual.pacienteId === pacienteId ? actual : null;
  }
}
