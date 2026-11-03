import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { camposCoinciden } from '../../../shared/validators/contrasena.validators';
import { RecuperacionContrasenaService } from './services/recuperacion-contrasena.service';

type EtapaRecuperacion = 'correo' | 'codigo' | 'contrasena' | 'exito';

@Component({
  selector: 'app-recuperar-contrasena',
  imports: [AuthShell, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css',
})
export class RecuperarContrasena {
  private readonly recuperacionService = inject(RecuperacionContrasenaService);

  protected etapa: EtapaRecuperacion = 'correo';
  protected cargando = false;
  protected intentoCorreo = false;
  protected intentoCodigo = false;
  protected intentoContrasena = false;
  protected tokenInvalido = false;
  protected mensajeError = '';
  protected mensajeInformativo = '';
  protected mensajeExito = '';
  protected expiraEnSegundos: number | null = null;

  private recuperacionId: string | null = null;
  private tokenRestablecimiento: string | null = null;

  protected readonly formularioCorreo = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
  });

  protected readonly formularioCodigo = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  protected readonly formularioContrasena = new FormGroup(
    {
      nuevaContrasena: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
      }),
      confirmarContrasena: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [camposCoinciden('nuevaContrasena', 'confirmarContrasena')] },
  );

  protected get textoExpiracion(): string {
    if (!this.expiraEnSegundos || this.expiraEnSegundos <= 0) {
      return '';
    }

    if (this.expiraEnSegundos < 60) {
      return `Vence en ${this.expiraEnSegundos} segundos.`;
    }

    const minutos = Math.ceil(this.expiraEnSegundos / 60);
    return `Vence en aproximadamente ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`;
  }

  protected correoInvalido(): boolean {
    const control = this.formularioCorreo.controls.correo;
    return control.invalid && (control.touched || this.intentoCorreo);
  }

  protected codigoInvalido(): boolean {
    const control = this.formularioCodigo.controls.codigo;
    return control.invalid && (control.touched || this.intentoCodigo);
  }

  protected contrasenaInvalida(): boolean {
    const control = this.formularioContrasena.controls.nuevaContrasena;
    return control.invalid && (control.touched || this.intentoContrasena);
  }

  protected confirmacionInvalida(): boolean {
    const confirmacion = this.formularioContrasena.controls.confirmarContrasena;
    return (
      (confirmacion.touched || this.intentoContrasena) &&
      (confirmacion.invalid || this.formularioContrasena.hasError('camposNoCoinciden'))
    );
  }

  protected solicitarRecuperacion(): void {
    this.intentoCorreo = true;
    this.formularioCorreo.markAllAsTouched();

    if (this.formularioCorreo.invalid || this.cargando) {
      return;
    }

    this.ejecutarSolicitud(false);
  }

  protected reenviarCodigo(): void {
    if (this.formularioCorreo.invalid || this.cargando) {
      this.reiniciarFlujo();
      return;
    }

    this.ejecutarSolicitud(true);
  }

  protected validarCodigo(): void {
    this.intentoCodigo = true;
    this.limpiarMensajes();
    this.formularioCodigo.markAllAsTouched();

    if (this.formularioCodigo.invalid || this.cargando) {
      return;
    }

    if (!this.recuperacionId) {
      this.mensajeError = 'La solicitud de recuperación ya no está disponible. Inicia nuevamente.';
      this.etapa = 'correo';
      return;
    }

    this.cargando = true;
    this.recuperacionService
      .validarCodigo({
        recuperacionId: this.recuperacionId,
        codigo: this.formularioCodigo.controls.codigo.value.trim(),
      })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          if (!respuesta.tokenRestablecimiento) {
            this.mensajeError = 'El servidor no devolvió un token de restablecimiento válido.';
            return;
          }

          this.tokenRestablecimiento = respuesta.tokenRestablecimiento;
          this.expiraEnSegundos = respuesta.expiraEnSegundos;
          this.formularioCodigo.reset();
          this.etapa = 'contrasena';
        },
        error: (error: unknown) => {
          this.mensajeError = this.mensajeErrorCodigo(error);
        },
      });
  }

  protected restablecerContrasena(): void {
    this.intentoContrasena = true;
    this.tokenInvalido = false;
    this.limpiarMensajes();
    this.formularioContrasena.markAllAsTouched();

    if (this.formularioContrasena.invalid || this.cargando) {
      return;
    }

    if (!this.tokenRestablecimiento) {
      this.tokenInvalido = true;
      this.mensajeError = 'El token de restablecimiento no está disponible. Inicia nuevamente.';
      return;
    }

    this.cargando = true;
    this.recuperacionService
      .restablecer({
        tokenRestablecimiento: this.tokenRestablecimiento,
        nuevaContrasena: this.formularioContrasena.controls.nuevaContrasena.value,
      })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          this.mensajeExito =
            respuesta.mensaje?.trim() || 'Tu contraseña fue actualizada correctamente.';
          this.limpiarDatosTemporales();
          this.etapa = 'exito';
        },
        error: (error: unknown) => {
          this.tokenInvalido = error instanceof HttpErrorResponse && error.status === 400;
          this.mensajeError = this.mensajeErrorRestablecimiento(error);
        },
      });
  }

  protected volverAlCorreo(): void {
    this.recuperacionId = null;
    this.formularioCodigo.reset();
    this.expiraEnSegundos = null;
    this.limpiarMensajes();
    this.etapa = 'correo';
  }

  protected reiniciarFlujo(): void {
    this.limpiarDatosTemporales();
    this.formularioCorreo.reset();
    this.intentoCorreo = false;
    this.intentoCodigo = false;
    this.intentoContrasena = false;
    this.tokenInvalido = false;
    this.limpiarMensajes();
    this.mensajeExito = '';
    this.etapa = 'correo';
  }

  private ejecutarSolicitud(esReenvio: boolean): void {
    this.limpiarMensajes();
    this.cargando = true;
    this.recuperacionService
      .solicitar({ correo: this.formularioCorreo.controls.correo.value.trim() })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          if (!respuesta.recuperacionId) {
            this.mensajeError = 'El servidor no devolvió un identificador de recuperación válido.';
            return;
          }

          this.recuperacionId = respuesta.recuperacionId;
          this.tokenRestablecimiento = null;
          this.expiraEnSegundos = respuesta.expiraEnSegundos;
          this.mensajeInformativo = esReenvio
            ? 'Se generó una nueva solicitud. Usa el código más reciente.'
            : respuesta.mensaje;
          this.formularioCodigo.reset();
          this.intentoCodigo = false;
          this.etapa = 'codigo';
        },
        error: (error: unknown) => {
          this.mensajeError = this.mensajeErrorSolicitud(error);
        },
      });
  }

  private mensajeErrorSolicitud(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'La respuesta del servidor no tiene el formato esperado.';
    }

    if (error.status === 400) {
      return this.mensajeBackend(error) ?? 'No pudimos procesar la solicitud de recuperación.';
    }

    return this.mensajeErrorComunicacion(error);
  }

  private mensajeErrorCodigo(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      return (
        this.mensajeBackend(error) ??
        'El código no es válido. Puede ser incorrecto, haber vencido o haber sido utilizado.'
      );
    }

    return this.mensajeErrorComunicacion(error);
  }

  private mensajeErrorRestablecimiento(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      return (
        this.mensajeBackend(error) ??
        'El token de restablecimiento es inválido o venció. Inicia nuevamente la recuperación.'
      );
    }

    return this.mensajeErrorComunicacion(error);
  }

  private mensajeErrorComunicacion(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'La respuesta del servidor no tiene el formato esperado.';
    }

    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
    }

    if (error.status >= 500) {
      return 'El servidor no pudo procesar la solicitud. Inténtalo más tarde.';
    }

    return 'No pudimos completar la operación. Inténtalo nuevamente.';
  }

  private mensajeBackend(error: HttpErrorResponse): string | null {
    const cuerpo = error.error as { message?: unknown } | null;
    return typeof cuerpo?.message === 'string' && cuerpo.message.trim()
      ? cuerpo.message.trim()
      : null;
  }

  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeInformativo = '';
  }

  private limpiarDatosTemporales(): void {
    this.recuperacionId = null;
    this.tokenRestablecimiento = null;
    this.expiraEnSegundos = null;
    this.formularioCodigo.reset();
    this.formularioContrasena.reset();
  }
}
