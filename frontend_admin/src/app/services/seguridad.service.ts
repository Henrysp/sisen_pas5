import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
// import {TOKEN_NAME} from '../shared/constantes';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { recoverypass, userChangePass, UserLogin } from '../models/UserLogin';
import {Departamento, Distrito, Provincia} from 'src/app/models/ubigeo';

const API_URL = environment.URL_SERVICES;
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class SeguridadService {
  private session = new Subject<boolean>();
  jwtHelper: JwtHelperService = new JwtHelperService();
  constructor(private http: HttpClient, private router: Router) {}

  GetLogin<T>(user: UserLogin): Observable<T> {
    return this.http
      .post<any>(API_URL + '/login', user, httpOptions)
      .pipe(map((res) => res));
  }

  GetRecoveryPassword<T>(modelrequest: recoverypass): Observable<T> {
    return this.http
      .post<any>(API_URL + '/recover-password', modelrequest, httpOptions)
      .pipe(map((res) => res));
  }

  changepassword<T>(user: userChangePass): Observable<T> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append(
      'Authorization',
      `Bearer ${sessionStorage.getItem('accessTemp')}`
    );
    headers = headers.append('Content-Type', `application/json`);
    return this.http
      .post<any>(API_URL + '/new-password', user, { headers })
      .pipe(map((res) => res));
  }

  setSessionCambio(status: boolean) {
    this.session.next(status);
  }

  getSessionCambio() {
    return this.session.asObservable();
  }
  verificarSesion = async () => {
    const helper = new JwtHelperService();
    const decodedToken = helper.decodeToken(sessionStorage.getItem('token'));
    if (decodedToken !== undefined && decodedToken !== null) {
      return true;
    } else {
      return false;
    }
  }
  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('accessToken');
    if (token === null) {
      return false;
    }
    return this.jwtHelper.isTokenExpired(token) === false;
  }

  isAuthenticatedTemp(): boolean {
    const token = sessionStorage.getItem('accessTemp');
    if (token === null) {
      return false;
    }
    return this.jwtHelper.isTokenExpired(token) === false;
  }

  cerrarSesion() {
    this.setSessionCambio(false);
    sessionStorage.clear();
    // console.log('Se borro tokens de storage');
    setTimeout(() => {
      this.router.navigate(['/login']);
      this.displayRecaptchaBadge(true);
    }, 500);
  }

  displayRecaptchaBadge(show = true){
    const el: any = document.querySelector('.grecaptcha-badge');
    if (el){
      el.style.visibility = show ? 'visible' : 'hidden';
    }
  }
  getAuthorizationToken(): string {
    return sessionStorage.getItem('accessToken');
  }
  resetSecurityObject(): void {
    sessionStorage.removeItem('accessToken');
  }
  getUserName(): string {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.name;
  }
  getUserLastName(): string {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.lastname;
  }
  getUserSecondLastName(): string {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.second_lastname;
  }
  getUserProfile(): string {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.profile;
  }
  getJobAreaName(): string {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.job_area_name;
  }
  getIsSuperAdmin(): boolean {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return false;
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.isSuperAdmin;
  }
  getLDAP(): string {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.LDAP;
  }
  getID(): string {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.id;
  }
  getEXP(): number {
    const token = sessionStorage.getItem('accessToken');
    if (token == null) {
      return 0;
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.exp;
  }
  getDepartamentoList(): Observable<Array<Departamento>> {
    return this.http.get<Array<Departamento>>(`${API_URL}/ubigeo/departamentos`);
  }
  getProvinciaList(codigoDepartamento: string): Observable<Array<Provincia>> {
    return this.http.get<Array<Provincia>>(`${API_URL}/ubigeo/provincias/${codigoDepartamento}`);
  }
  getDistritoList(codigoDepartamento: string, codigoProvincia: string): Observable<Array<Distrito>> {
    return this.http.get<Array<Distrito>>(`${API_URL}/ubigeo/distritos/${codigoDepartamento}/${codigoProvincia}`);
  }
  getProcesses(): Observable<any> {
    return this.http
      .get<any>(API_URL + '/get-processes', {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(map((res) => res));
  }
}
