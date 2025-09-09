import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot  } from '@angular/router';
import { Observable } from 'rxjs';
import { SeguridadService } from '../services/seguridad.service';
import { environment } from 'src/environments/environment';
import {TokenExpiration} from 'src/app/Utils/token-expiration';


@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  activate = false;

  constructor(
      private securityService: SeguridadService,
      private router: Router,
      private tokenExpiration: TokenExpiration
      ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    this.tokenExpiration.setupExpirationTimer();
    if (this.securityService.isAuthenticated()) {
      return true;
    }else{
      this.securityService.cerrarSesion();
      return false;
    }
  //   if (state.url.includes('notificaciones-electronicas-detalle')){
  //     const segmento = state.url.split('/');
  //     localStorage.setItem('id', segmento[segmento.length - 1]);
  //     this.router.navigate(['login']);
  //   } else {
  //     this.router.navigate(['login']);
  //     return false;
  //   }
  }
}

