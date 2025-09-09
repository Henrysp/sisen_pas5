import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable} from 'rxjs';
import { SeguridadService } from '../services/seguridad.service';
import { environment } from 'src/environments/environment';
import {TokenExpiration} from 'src/app/utils/token-expiration';
import { Profile } from 'src/app/transversal/enums/global.enum';
import {FuncionesService} from './funciones.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  // login_url: String = environment.login_url;
  current_url: String;

  constructor(
    private securityService: SeguridadService,
    private router: Router,
    private tokenExpiration: TokenExpiration,
    private funcionesService: FuncionesService,

  ) {
    this.current_url = window.location.href;
  }

  canActivate(
    next: ActivatedRouteSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.findTokenAndValidateProfile(next);
  }

  findTokenAndValidateProfile(next: ActivatedRouteSnapshot) {
    const routePermissions = {
      catalog: [Profile.Administrador],
      'operador-reportes': [Profile.Administrador, Profile.Notifier, Profile.QueryOperator],
      consultar: ['SuperAdmin', Profile.Notifier],
      person: [Profile.Administrador],
      calendar: [Profile.Administrador],
      'new-calendar': [Profile.Administrador],
      'disable-users': [Profile.Administrador],
      usuarios: [Profile.Administrador],
      'view-calendar': [Profile.Administrador],
      'main/notificaciones': [Profile.Notifier],
      'main/nueva-notificacion': [Profile.Notifier],
      'main/notificaciones-detalle/:id': [Profile.Notifier],
      'main/list-boxes': [Profile.Administrador, Profile.RegistryOperator, Profile.QueryOperator],
      'nueva-casilla': [Profile.Administrador, Profile.RegistryOperator],
      'solicitud-detalle/:id/:type/:action': [Profile.Administrador, Profile.RegistryOperator],
      'solicitud-detalle-pj/:id/:action': [Profile.Administrador, Profile.RegistryOperator],
      'view/:type/:id': [Profile.Administrador, Profile.RegistryOperator],
      'edit/:type/:id': [Profile.Administrador],
      'edit/:type/:id/representante': [Profile.Administrador],
      'edit/:type/:id/official': [Profile.Administrador],
  };
    // Timmer de token
    this.tokenExpiration.setupExpirationTimer();
    // Consulta de autenticación
    if (!this.securityService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    // Validación por perfil
    const userProfile = this.securityService.getUserProfile();
    const isSuperAdmin = this.securityService.getIsSuperAdmin();
    const currentPath = next.routeConfig?.path;

    if (currentPath && routePermissions[currentPath]) {
      const allowedProfiles = routePermissions[currentPath];

      if (allowedProfiles.includes(userProfile)) {
        return true;
      }
      else if (currentPath === 'consultar' && isSuperAdmin && userProfile === 'admin') {
        return true;
      }
      else {
        this.handleUnauthorizedAccess(userProfile);
        return false;
      }
    }else{
      return false;
    }
    // En caso de no haber errores
    return true;
  }

  private handleUnauthorizedAccess(userProfile: string) {
    switch (userProfile) {
      case Profile.Administrador:
      case Profile.RegistryOperator:
      case Profile.QueryOperator:
        this.funcionesService.mensajeError('Este usuario no puede acceder a este recurso.').then(r => {
          this.router.navigate(['/main/list-boxes']);
        });
        break;
      case Profile.Notifier:
        this.funcionesService.mensajeError('Este usuario no puede acceder a este recurso.').then(r => {
          this.router.navigate(['/main/notificaciones']);
        });
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
