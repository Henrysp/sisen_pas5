import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SeguridadService } from '../services/seguridad.service';
import { FuncionesService } from './funciones.service';
import {TokenExpiration} from 'src/app/utils/token-expiration';
import {Router} from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private authenticationService: SeguridadService,
                private funcionesService: FuncionesService,
                private tokenExpiration: TokenExpiration,
                private router: Router,
    ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.tokenExpiration.setupExpirationTimer();
    return next.handle(request).pipe(catchError(err => {
      const message = err.headers.get('error-app') ? err.headers.get('error-app') : (err.error.error ? err.error.error : 'Operación no válida');
      if (err.status === 401) {
        // auto logout if 401 response returned from api
        this.funcionesService.mensajeError('Sesión expirada, por favor ingrese nuevamente.').then(r => {
          this.authenticationService.resetSecurityObject();
          location.reload();
        });
      }
      else if (err.status === 400 || err.status === 404 || err.status === 500) {
        this.funcionesService.mensajeError(message);
      }
      else if (err.status === 403) {
        // this.router.navigate(['/acceso-prohibido']);
        this.funcionesService.mensajeError(message).then(r => {
          this.router.navigate(['/main']);
        });
      }
      const error = err.error.message || err.statusText;
      return throwError(error);
    }));
  }
}
