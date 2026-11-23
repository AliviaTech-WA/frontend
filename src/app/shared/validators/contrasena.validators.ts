import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function camposCoinciden(campo: string, confirmacion: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.get(campo)?.value as string | undefined;
    const valorConfirmacion = control.get(confirmacion)?.value as string | undefined;

    if (!valor || !valorConfirmacion || valor === valorConfirmacion) {
      return null;
    }

    return { camposNoCoinciden: true };
  };
}

export function camposDiferentes(campoActual: string, campoNuevo: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valorActual = control.get(campoActual)?.value as string | undefined;
    const valorNuevo = control.get(campoNuevo)?.value as string | undefined;

    if (!valorActual || !valorNuevo || valorActual !== valorNuevo) {
      return null;
    }

    return { camposIguales: true };
  };
}
