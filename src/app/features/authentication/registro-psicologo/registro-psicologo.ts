import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

function contenidoRequerido(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length === 0 ? { soloEspacios: true } : null;
}

function requisitosContrasena(control: AbstractControl<string>): ValidationErrors | null {
  const contieneLetra = /\p{L}/u.test(control.value);
  const contieneNumero = /\d/.test(control.value);

  return contieneLetra && contieneNumero ? null : { requisitosContrasena: true };
}

function contrasenasCoinciden(control: AbstractControl): ValidationErrors | null {
  const contrasena = control.get('contrasena')?.value as string | undefined;
  const confirmacion = control.get('confirmarContrasena')?.value as string | undefined;

  if (!contrasena || !confirmacion || contrasena === confirmacion) {
    return null;
  }

  return { contrasenasNoCoinciden: true };
}

type EstadoRegistro = 1 | 2 | 'exito' | 'duplicado';

@Component({
  selector: 'app-registro-psicologo',
  imports: [ReactiveFormsModule],
  templateUrl: './registro-psicologo.html',
  styleUrls: ['./registro-psicologo.css', './registro-psicologo-estados.css'],
})
export class RegistroPsicologo {
  // Dato enteramente ficticio para reproducir el escenario equivalente a 409 sin consultar END01.
  private static readonly DNI_DUPLICADO_DEMOSTRACION = '00000000';

  protected pasoActual: EstadoRegistro = 1;
  protected intentoContinuar = false;
  protected intentoRegistrar = false;

  protected readonly formulario = new FormGroup({
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, contenidoRequerido],
    }),
    apellidos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, contenidoRequerido],
    }),
    dni: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, contenidoRequerido],
    }),
    correoProfesional: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, contenidoRequerido, Validators.email],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, contenidoRequerido],
    }),
  });

  protected readonly formularioProfesional = new FormGroup(
    {
      numeroColegiatura: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, contenidoRequerido],
      }),
      especialidad: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, contenidoRequerido],
      }),
      contrasena: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), requisitosContrasena],
      }),
      confirmarContrasena: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      aceptaTerminos: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
      confirmaDatos: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
    },
    { validators: [contrasenasCoinciden] },
  );

  protected campoInvalido(nombre: keyof RegistroPsicologo['formulario']['controls']): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && (control.touched || this.intentoContinuar);
  }

  protected faltanCamposObligatorios(): boolean {
    return Object.values(this.formulario.controls).some(
      (control) => control.hasError('required') || control.hasError('soloEspacios'),
    );
  }

  protected campoProfesionalInvalido(
    nombre: keyof RegistroPsicologo['formularioProfesional']['controls'],
  ): boolean {
    const control = this.formularioProfesional.controls[nombre];
    return control.invalid && (control.touched || this.intentoRegistrar);
  }

  protected confirmacionContrasenaInvalida(): boolean {
    const confirmacion = this.formularioProfesional.controls.confirmarContrasena;
    const debeMostrarError = confirmacion.touched || this.intentoRegistrar;

    return (
      debeMostrarError &&
      (confirmacion.invalid || this.formularioProfesional.hasError('contrasenasNoCoinciden'))
    );
  }

  protected get correoIngresado(): string {
    return this.formulario.controls.correoProfesional.value.trim();
  }

  protected continuar(): void {
    this.intentoContinuar = true;
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid) {
      return;
    }

    this.pasoActual = 2;
  }

  protected volverADatosPersonales(): void {
    this.pasoActual = 1;
  }

  protected crearCuentaProfesional(): void {
    this.intentoRegistrar = true;
    this.formularioProfesional.markAllAsTouched();

    if (this.formulario.invalid || this.formularioProfesional.invalid) {
      return;
    }

    const dniIngresado = this.formulario.controls.dni.value.trim();
    this.pasoActual =
      dniIngresado === RegistroPsicologo.DNI_DUPLICADO_DEMOSTRACION ? 'duplicado' : 'exito';
  }
}
