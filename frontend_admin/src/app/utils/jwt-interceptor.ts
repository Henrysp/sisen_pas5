import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { SeguridadService } from '../services/seguridad.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authenticationService: SeguridadService,private router: Router) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add auth header with jwt if user is logged in and request is to api url
        
        const isLoggedIn = this.authenticationService.isAuthenticated();       
        const isApiUrl = request.url.startsWith(environment.URL_SERVICES);        
        if (isLoggedIn && isApiUrl) {            
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${this.authenticationService.getAuthorizationToken()}`
                }
            });
        }
        return next.handle(request);       
    }
}