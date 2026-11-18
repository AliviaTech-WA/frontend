import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Component, inject, OnDestroy, OnInit, signal, TemplateRef} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, takeUntil } from 'rxjs';
import { SesionResumen, SesionDetalle } from './models/sesion-resumen.model';
import { SesionesService } from './services/sesiones.service';
import { CabeceraPaciente } from '../cabecera-paciente/cabecera-paciente';
import { ResumenActualService } from '../resumen-paciente/services/resumen-actual.service';
import { MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
registerLocaleData(localeEs);
@Component({
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatButton,
    MatDialogModule,
    RouterLink,
    CabeceraPaciente,
  ],
  selector: 'app-sesiones',
  styleUrl: './sesiones.css',
  templateUrl: './sesiones.html',
})
export class Sesiones implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  readonly resumenActual = inject(ResumenActualService);
  private sesionesService = inject(SesionesService);
  private cambiosRuta?: Subscription;
  private consultaHistorial?: Subscription;
  private guardado?: Subscription;
  private readonly dialogo = inject(MatDialog);
  private dialogoDetalle?: MatDialogRef<unknown>;

  readonly detalleSesion = signal<SesionDetalle | null>(null);
  readonly cargandoDetalle = signal(false);
  readonly errorDetalle = signal('');
  readonly descargandoSesion = signal(false);
  readonly errorDescargaSesion = signal('');

  nombrePacienteDetalle = '';

  abrirDetalle(sesionId: number, plantilla: TemplateRef<unknown>): void {
    if (this.dialogoDetalle) return;

    this.detalleSesion.set(null);
    this.errorDetalle.set('');
    this.errorDescargaSesion.set('');
    this.cargandoDetalle.set(true);

    this.nombrePacienteDetalle =
      this.resumenActual.obtener(this.pacienteId)?.nombreCompleto ??
      `Paciente #${this.pacienteId}`;

    const referencia = this.dialogo.open(plantilla, {
      width: '680px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '90vh',
      ariaLabelledBy: 'titulo-detalle-sesion',
    });

    this.dialogoDetalle = referencia;

    referencia.afterClosed().subscribe(() => {
      this.dialogoDetalle = undefined;
      this.detalleSesion.set(null);
      this.cargandoDetalle.set(false);
    });

    this.sesionesService.obtenerDetalle(sesionId)
      .pipe(takeUntil(referencia.afterClosed()))
      .subscribe({
        next: (detalle) => {
          this.detalleSesion.set(detalle);
          this.cargandoDetalle.set(false);
        },
        error: () => {
          this.errorDetalle.set('No se pudo cargar el detalle. Cierra e intenta nuevamente.');
          this.cargandoDetalle.set(false);
        },
      });
  }

  async descargarInformeSesion(confirmacion: TemplateRef<unknown>): Promise<void> {
    const sesion = this.detalleSesion();
    if (!sesion || this.descargandoSesion()) return;

    const paciente = this.nombrePacienteDetalle;
    this.descargandoSesion.set(true);
    this.errorDescargaSesion.set('');

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const fecha = new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'long',
      }).format(new Date(sesion.fechaSesion));

      pdf.setFillColor('#128573');
      pdf.rect(0, 0, 210, 34, 'F');
      pdf.setTextColor('#ffffff');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('AliviaTech', 18, 15);
      pdf.setFontSize(11);
      pdf.text('Informe de sesión', 18, 25);

      pdf.setTextColor('#1a2825');
      pdf.setFontSize(12);
      const nombre: string[] = pdf.splitTextToSize(paciente, 174);
      pdf.text(nombre, 18, 46);

      let y = 46 + nombre.length * 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(fecha, 18, y);
      y += 12;

      const apartados = [
        { titulo: 'Nota interna · Solo psicólogo', texto: sesion.notaInterna },
        { titulo: 'Resumen compartido', texto: sesion.resumenCompartido },
        { titulo: 'Recomendación compartida', texto: sesion.recomendacionCompartida },
      ];

      for (const apartado of apartados) {
        if (y > 255) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor('#087766');
        pdf.text(apartado.titulo, 18, y);
        y += 7;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor('#1a2825');

        const lineas: string[] = pdf.splitTextToSize(
          apartado.texto?.trim() || 'Sin información registrada.',
          174,
        );

        for (const linea of lineas) {
          if (y > 275) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(linea, 18, y);
          y += 5;
        }

        y += 10;
      }

      pdf.save(`informe-sesion-${sesion.sesionId}.pdf`);
      this.dialogo.open(confirmacion, {
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        ariaLabel: 'Informe descargado',
        data: {
          titulo: 'Informe descargado',
          mensaje: 'Se generó el PDF y se inició la descarga en tu navegador.',
        },
      });
    } catch {
      this.errorDescargaSesion.set(
        'No se pudo generar el PDF. Intenta nuevamente.',
      );
    } finally {
      this.descargandoSesion.set(false);
    }
  }

  pacienteId: number | null = null;
  fechaMostrada = signal(new Date());
  historial = signal<SesionResumen[]>([]);
  cargandoHistorial = signal(false);
  errorHistorial = signal('');
  guardando = signal(false);
  errorGuardado = signal('');

  sesionForm = this.fb.nonNullable.group({
    notaInterna: [''],
    resumenCompartido: [''],
    recomendacionCompartida: [''],
  });

  ngOnInit(): void {
    this.cambiosRuta = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('pacienteId'));

      this.guardado?.unsubscribe();
      this.guardando.set(false);
      this.sesionForm.reset();
      this.errorGuardado.set('');
      this.fechaMostrada.set(new Date());
      this.dialogoDetalle?.close();
      this.pacienteId = Number.isSafeInteger(id) && id > 0 ? id : null;
      this.cargarHistorial();
    });
  }

  ngOnDestroy(): void {
    this.cambiosRuta?.unsubscribe();
    this.consultaHistorial?.unsubscribe();
    this.guardado?.unsubscribe();
    this.dialogoDetalle?.close();
  }

  cargarHistorial(): void {
    this.consultaHistorial?.unsubscribe();
    this.historial.set([]);
    this.errorHistorial.set('');

    if (this.pacienteId === null) {
      this.cargandoHistorial.set(false);
      this.errorHistorial.set('No se encontró un paciente válido en la ruta.');
      return;
    }

    this.cargandoHistorial.set(true);

    this.consultaHistorial = this.sesionesService.listarSesiones(this.pacienteId).subscribe({
      next: (sesiones) => {
        this.historial.set(sesiones);
        this.cargandoHistorial.set(false);
      },
      error: () => {
        this.errorHistorial.set('No se pudo cargar el historial de sesiones.');
        this.cargandoHistorial.set(false);
      },
    });
  }

  guardarInformacion(confirmacion: TemplateRef<unknown>): void {
    if (this.pacienteId === null || this.guardando()) {
      return;
    }

    const fecha = new Date();
    const { notaInterna, resumenCompartido, recomendacionCompartida } =
      this.sesionForm.getRawValue();

    this.fechaMostrada.set(fecha);
    this.errorGuardado.set('');
    this.guardando.set(true);

    this.guardado = this.sesionesService
      .registrarSesion(this.pacienteId, {
        fechaSesion: fecha.toISOString(),
        notaInterna: notaInterna.trim() || null,
        resumenCompartido: resumenCompartido.trim() || null,
        recomendacionCompartida: recomendacionCompartida.trim() || null,
      })
      .subscribe({
        next: () => {
          this.sesionForm.reset();
          this.guardando.set(false);
          this.cargarHistorial();

          this.dialogo.open(confirmacion, {
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            ariaLabel: 'Información guardada',
          });
        },
        error: () => {
          this.guardando.set(false);
          this.errorGuardado.set('No se pudo confirmar el guardado de la sesión.');
        },
      });
  }
}
