import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ReporteGeneral } from '../models/reporte-general.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/psicologos`;

  consultar(
    psicologoId: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Observable<ReporteGeneral> {
    const params = new HttpParams().set('fechaDesde', fechaDesde).set('fechaHasta', fechaHasta);

    return this.http.get<ReporteGeneral>(`${this.url}/${psicologoId}/reportes`, { params });
  }
  exportarPdf(psicologoId: number, fechaDesde: string, fechaHasta: string): Observable<Blob> {
    const params = new HttpParams()
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta);

    return this.http.get(`${this.url}/${psicologoId}/reportes/pdf`, {
      params,
      responseType: 'blob',
    });
  }
}
