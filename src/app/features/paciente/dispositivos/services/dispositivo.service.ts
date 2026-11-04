import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { environment } from '../../../../../environments/environment.prod';

import {ConsultaDispositivoAsignado,
        RenombrarDispositivoRequest
} from '../models/dispositivo.model';

@Injectable({providedIn: 'root'})
export class DispositivoService {

    private readonly http = inject(HttpClient);

    private readonly baseUrl = `${environment.apiUrl}/v1/pacientes`;

    // HU14: Obtener el dispositivo asignado
    consultar(pacienteId: number): Observable<ConsultaDispositivoAsignado> {
        return this.http.get<ConsultaDispositivoAsignado>(
        `${this.baseUrl}/${pacienteId}/dispositivo`
        );
    }

    // HU15: Renombrar el dispositivo asignado
    renombrar(
        pacienteId: number,
        solicitud: RenombrarDispositivoRequest
    ): Observable<ConsultaDispositivoAsignado> {
        return this.http.patch<ConsultaDispositivoAsignado>(
            `${this.baseUrl}/${pacienteId}/dispositivo`,
            solicitud
        );
    }
}