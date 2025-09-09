import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SeguridadService } from '../services/seguridad.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardTemp implements CanActivate {
  // login_url: String = environment.login_url;
  current_url: String;

  constructor(
    private securityService: SeguridadService,
    private router: Router
  ) {
    this.current_url = window.location.href;
  }

  canActivate(
    next: ActivatedRouteSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.findToken(next);
  }

  findToken(next: ActivatedRouteSnapshot) {
    //&& this.securityService.hasClaim(claimType, true)
    //const claimType: string = next.data['claimType'];
    if (this.securityService.isAuthenticatedTemp()) {
      return true;
    } else {
      /* else if (this.securityService.isAuthenticated() && !this.securityService.hasClaim(claimType, true)) {
            this.router.navigate(['reniec']);
            return false;
        }*/
      // window.location.href = 'www.google.com.pe';//this.login_url + '?returnUrl=' + this.current_url;
      this.router.navigate(['/login']);
      return false;
    }
  }
}
