import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SeguridadService } from '../services/seguridad.service';
import { FuncionesService } from '../services/funciones.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private authenticationService: SeguridadService, private funcionesService: FuncionesService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            let message = err.headers.get('error-app') != undefined ? err.headers.get('error-app') : "Operación no válida";
            if (err.status === 401) {
                // auto logout if 401 response returned from api
                this.authenticationService.resetSecurityObject();
                location.reload();
            }
            else if (err.status === 400 || err.status === 404 || err.status === 500) {
                this.funcionesService.mensajeError(message);
            }
            const error = err.error.message || err.statusText;
            return throwError(error);
        }))
    }
}
