import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { convertObjectToGetParams } from '../utils/http-utils';

const API_URL = environment.URL_SERVICES;
const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json',
    }),
};
@Injectable({
    providedIn: 'root'
})
export class ReporteService {
    constructor(private http: HttpClient) { }
  reporteCasillas(request: { documentType: string,
       documentNumber: string, fechaInicio: any, fechaFin: any }): Observable<any> {
        return this.http
            .get<any>(API_URL + '/reporte/casillas', {
                params: convertObjectToGetParams(request),
                responseType: 'blob' as 'json',
                observe: 'response',
            }).pipe( mergeMap( async (response: any) => {
                return await this.parseData(response);
            }) );
    }
    reporteNotificaciones(request: { documentType: string,
        documentNumber: string,  fechaInicio: any, fechaFin: any }): Observable<any> {
        return this.http
            .get<any>(API_URL + '/reporte/notificaciones', {
                params: convertObjectToGetParams(request),
                responseType: 'blob' as 'json',
                observe: 'response',
            })
             .pipe( mergeMap( async (response: any) => {
                return await this.parseData(response);
            }) );
    }
    reporteUsuarios(request: { documentType: string,
    documentNumber: string,  fechaInicio: any, fechaFin: any }): Observable<any> {
    return this.http
      .get<any>(API_URL + '/reporte/usuarios', {
        params: convertObjectToGetParams(request),
        responseType: 'blob' as 'json',
        observe: 'response',
      })
      .pipe( mergeMap( async (response: any) => {
        return await this.parseData(response);
      }) );
    }
    reporteUsuariosHistorico(request: { documentType: string,
    documentNumber: string,  fechaInicio: any, fechaFin: any }): Observable<any> {
      return this.http
        .get<any>(API_URL + '/reporte/usuariosHistorico', {
          params: convertObjectToGetParams(request),
          responseType: 'blob' as 'json',
          observe: 'response',
        })
        .pipe(mergeMap(async (response: any) => {
          return await this.parseData(response);
        }));
    }
    private async  parseData(response: any) {
        // Verificar el tipo de contenido en el encabezado "Content-Type"
        const contentType = response.headers.get('Content-Type');
        const responseType = contentType && contentType.includes('application/json') ? 'json' : 'blob';

        if (contentType && contentType.includes('application/json')) {
            // Devolver la respuesta con el responseType adecuado
             const body = await this.parseJsonFromBlob(response.body);
             return {
                body: body,
            type: 'json' as const
        };
        } else {
        // Si no es JSON, asumimos Blob
        return {
            body: response.body,
            type: 'blob' as const
        };
        }
    }

    private async parseJsonFromBlob(blob: Blob): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const result = JSON.parse(reader.result as string);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(blob);
        });
    }
}


