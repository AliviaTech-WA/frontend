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
