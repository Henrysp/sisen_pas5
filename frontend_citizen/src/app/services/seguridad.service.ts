import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { TOKEN_NAME } from '../shared/constantes';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import {
  recoverypass,
  userChangePass,
  UserLogin,
} from '../models/user/UserLogin';

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

  changepassword<T>(user: userChangePass): Observable<T> {
    let headers: HttpHeaders = new HttpHeaders();
    //`Bearer ${sessionStorage.getItem('accessTemp')}`
    headers = headers.append(
      'Authorization',
      `Bearer ${localStorage.getItem('accessTemp')}`
    );
    headers = headers.append('Content-Type', `application/json`);

    return this.http
      .post<any>(API_URL + '/new-password', user, { headers })
      .pipe(map((res) => res));
  }

  GetRecoveryPassword<T>(modelrequest: recoverypass): Observable<T> {
    return this.http
      .post<any>(API_URL + '/recover-password', modelrequest, httpOptions)
      .pipe(map((res) => res));
  }

  GetValidChangePass<T>(id:string, doc:string): Observable<T> {
    return this.http.get<any>(`${API_URL}/valida-contrasena/${id}/${doc}`)
  }

  setSessionCambio(status: boolean) {
    this.session.next(status);
  }

  getSessionCambio() {
    return this.session.asObservable();
  }

  getCodUsu(): string {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.userid;
  }

  get() {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken;
  }

  verificarSesion = async () => {
    const helper = new JwtHelperService();
    const decodedToken = helper.decodeToken(localStorage.getItem(TOKEN_NAME));
    if (decodedToken !== undefined && decodedToken !== null) {
      return true;
    } else {
      return false;
    }
  };

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (token === null) {
      return false;
    }
    return this.jwtHelper.isTokenExpired(token) === false;
  }

  isAuthenticatedTemp(): boolean {
    const token = localStorage.getItem('accessTemp');
    if (token === null) {
      return false;
    }
    return this.jwtHelper.isTokenExpired(token) === false;
  }

  cerrarSesion() {
    this.setSessionCambio(false);
    localStorage.clear();
    // console.log('Se borro tokens de storage');
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 500);
  }


  CerrarSesionPre(): Observable<any> {
    return this.http
      .post<any>(API_URL + '/logout',"")
      .pipe(map((res) => res));
  }


  getAuthorizationToken(): string {
    return localStorage.getItem('accessToken');
  }

  resetSecurityObject(): void {
    localStorage.removeItem('accessToken');
  }

  getUserName(): string {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.name;
  }

  getUserLastName(): string {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.lastname;
  }

  getUserOrganizationName(): string {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.organization_name;
  }

  getUserDocType(): string {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.docType;
  }

  getCargo(): string {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
      return '';
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.cargo_name;
  }
  getEXP(): number {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
      return 0;
    }
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.exp;
  }
}
