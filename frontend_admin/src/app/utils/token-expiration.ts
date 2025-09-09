import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { SeguridadService } from 'src/app/services/seguridad.service';

@Injectable({
  providedIn: 'root'
})
export class TokenExpiration {
  private expirationTimer: any;

  constructor(
    private router: Router,
    private funcionesService: FuncionesService,
    private securityService: SeguridadService
  ) {}

  setupExpirationTimer(): void {
    this.clearExpirationTimer();
    const expiration = sessionStorage.getItem('token_expiration');
    if (!expiration) { return; }
    const expiresAt = parseInt(expiration, 10);
    const now = Date.now();
    const timeUntilExpiration = expiresAt - now;

    if (timeUntilExpiration <= 0) {
      this.handleExpiration();
    }

    // console.log(`Token expirará en ${timeUntilExpiration / 1000} segundos`);

    this.expirationTimer = setTimeout(() => {
      this.handleExpiration();
    }, timeUntilExpiration);
  }

  private handleExpiration(): void {
    const currentUrl = window.location.href;
    if (!currentUrl.includes('/login')) {
      this.funcionesService.mensajeError('Sesión expirada, por favor ingrese nuevamente.')
        .then(() => {
          this.securityService.cerrarSesion();
        });
    } else {
      this.router.navigate(['/login']);
    }
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
  }
}
