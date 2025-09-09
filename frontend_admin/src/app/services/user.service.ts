import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';
import {map} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import {BoxRequest, UserRequest} from '../models/users/user-request';
import {UserData} from '../models/users/user-data';
import {convertObjectToGetParams} from '../utils/http-utils';
import {IResendEmailAndSms, UserDetail, UserDetailUpdate, UserDetailUpdatePn} from '../models/users/user';
import { FuncionesService } from 'src/app/utils/funciones.service';

const API_URL = environment.URL_SERVICES;

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private fields = new BehaviorSubject<UserRequest>(null);
  fieldsSearch = this.fields.asObservable();


  constructor(
    private http: HttpClient,
    private funcionesService: FuncionesService
  ) {
  }
  delete(docType: string, doc: any): Observable<any> {
    return this.http
      .post(API_URL + '/delete-user', {docType, doc}, httpOptions)
      .pipe(map((res) => res));
  }

  download(path: string): Observable<any> {
    return this.http
      .get<any>(API_URL + '/download-pdf', {
        params: {path},
        responseType: 'blob' as 'json',
      })
      .pipe(map((res) => res));
  }

  getUser(id: string): Observable<any> {
    return this.http
      .get<any>(API_URL + '/get-user', {
        params: {id},
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(map((res) => res));
  }

  getUserDetail(id: string, enAtencion: boolean): Observable<any> {
    const atender = enAtencion ? 'true' : 'false';
    return this.http
      .get<any>(API_URL + '/get-user-info-detail', {
        params: {id, atender}, headers: new HttpHeaders({
          'Content-Type': 'application/json',
        })
      }).pipe(map((res) => ({
          ...res,
        })
      ));
  }
  getUserID(id: string): Observable<any> {
    return this.http
      .get<any>(API_URL + '/get-user-id', {
        params: {id},
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(map((res) => res));
  }

  getUserDetailPn(id: string, enAtencion: boolean): Observable<any> {
    const atender = enAtencion ? 'true' : 'false';
    return this.http
      .get<any>(API_URL + '/get-user-info-detail-edit', {
        params: {id, atender}, headers: new HttpHeaders({
          'Content-Type': 'application/json',
        })
      }).pipe(map((res) => res));
  }
  getUserDetailPJ(id: string, enAtencion: boolean): Observable<any> {
    const atender = enAtencion ? 'true' : 'false';
    return this.http
      .get<any>(API_URL + '/get-user-info-detail-pj', {
        params: {id, atender}, headers: new HttpHeaders({
          'Content-Type': 'application/json',
        })
      }).pipe(map((res) => res));
  }
  updateEstateInbox(request: { idUser: string, estado: string, motivo: {}, name: string, email: string }
  ) {
    return this.http
      .post<any>(API_URL + '/updateEstateInbox', request)
      .pipe(map((res) => res));
  }

  editUserDetail(userDetail: UserDetail
  ) {
    return this.http
      .post<any>(API_URL + '/inbox/edit', userDetail)
      .pipe(map((res) => res));
  }

  editUserDetailUpdate(userDetail: FormData) {
    return this.http.post<any>(API_URL + '/inbox/edit', userDetail).pipe(map((res) => res));
  }

  editUserDetailUpdatePn(userDetail: FormData) {
    return this.http.post<any>(API_URL + '/inbox/edit', userDetail).pipe(map((res) => res));
  }
  GetUsers(userRequest: UserRequest): Observable<UserData> {
    return this.http
      .post<any>(API_URL + '/users', userRequest, httpOptions)
      .pipe(map((res) => res));
  }
  ListUsers(userRequest: UserRequest): Observable<UserData> {
    return this.http
      .post<any>(API_URL + '/list-users', userRequest, httpOptions)
      .pipe(map((res) => res));
  }
  crearteUser(request: { docType: string, doc: string, profiles: any, name: string, lastname: string,
    second_lastname: string, email: string , UUOO: string, UUOO_name: string, LDAP: string}) {
    const datosTrimmed = this.funcionesService.trimAllFields(request);
    return this.http
      .post<any>(API_URL + '/create-user', datosTrimmed)
      .pipe(map((res) => res));
  }

  EditUser(request: { id: string, docType: string, doc: string, name: string, lastname: string,
    second_lastname: string, email: string , profiles: any, LDAP: string, UUOO: string, UUOO_name: string}) {
    return this.http
      .put<any>(API_URL + '/edit-user', request)
      .pipe(map((res) => res));
  }
  EditUserCitizen(request: {
    doc: string;
    name: string;
    lastname: string;
    email: string;
  }) {
    return this.http
      .put<any>(API_URL + '/edit-user-citizen', request)
      .pipe(map((res) => res));
  }
  EditUserOrg(request: {
    doc: string;
    name: string;
    lastname: string;
    email: string;
  }) {
    return this.http
      .put<any>(API_URL + '/edit-user-org', request)
      .pipe(map((res) => res));
  }
  GetTypeAcreditation(): Observable<any> {
    return this.http
      .get(API_URL + '/cache-box', httpOptions)
      .pipe(map((res) => res));
  }
  ConsultPerson(personRequest: any): Observable<any> {
    return this.http
      .post<any>(API_URL + '/person', personRequest, httpOptions)
      .pipe(map((res) => res));
  }
  CreateBox(boxRequest: FormData): Observable<any> {
    return this.http
      .post<any>(API_URL + '/create-box', boxRequest)
      .pipe(map((res) => res));
  }
  SaveRepresentative(formData: FormData) {
    return this.http.post<any>(API_URL + '/representative/save', formData).pipe(map((res) => res));
  }
  SaveRepresentativeOfficial(formData: FormData) {
    return this.http.post<any>(API_URL + '/representative/official/save', formData).pipe(map((res) => res));
  }
  ConsultaReniec = (doc: string) => {
    const request = {
      dni: doc,
    };
    return this.http.get(API_URL + '/search-person', {
      params: convertObjectToGetParams(request),
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  ConsultaSunat(ruc: string): Observable<any> {
    const request = {
      ruc: ruc,
    };
    return this.http.get(API_URL + '/search-ruc', {
      params: convertObjectToGetParams(request),
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  ConsultaCE(doc: string, type: string): Observable<any> {
    const request = {
      doc: doc,
      type: type
    };
    return this.http.get(API_URL + '/search-ce', {
      params: convertObjectToGetParams(request),
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  ConsultaCasilla(doc: string, type: string): Observable<any> {
    const request = {
      doc: doc.toUpperCase(),
      type: type
    };
    return this.http.get(API_URL + '/search-casilla', {
      params: convertObjectToGetParams(request),
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  ConsultaCasillaXExpediente(nro_expediente: string): Observable<any> {
    const request = {
      nro_expediente: nro_expediente
    };
    return this.http.get(API_URL + '/search-casilla-nroexpediente', {
      params: convertObjectToGetParams(request),
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  ConsultaUsuario(doc: string, type: string): Observable<any> {
    const request = {
      doc: doc,
      type: type
    };
    return this.http.get(API_URL + '/search-user-mongo', {
      params: convertObjectToGetParams(request),
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  consultaLDAP(usuario: string): Observable<any> {
    const request = {
      ldap_username: usuario
    };
    return this.http.get(API_URL + '/search-user-ldap', {
      params: convertObjectToGetParams(request),
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  consultaLDAPMongo(usuario: string): Observable<any> {
    const request = {
      usuario: usuario
    };
    return this.http.get(API_URL + '/search-user-ldap-mongo', {
      params: convertObjectToGetParams(request),
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  ConsultaClaridad(doc: string): Observable<any> {
    return this.http.post<any>('', '', httpOptions);
  }

  CerrarSesion(): Observable<any> {
    return this.http
      .post<any>(API_URL + '/logout', "")
      .pipe(map((res) => res));
  }
  searchListuser(value: UserRequest) {
    this.fields.next(value);
  }
  getAttachments(id: string): Observable<any> {
    return this.http
      .get<any>(API_URL + '/download-attachments', {
        params: {id},
        responseType: 'blob' as 'json',
      })
      .pipe(map((res) => res));
  }
  resendEmailAndSms(resendData: IResendEmailAndSms) {
    return this.http.post<any>(API_URL + '/resend/communication', resendData).pipe(map((res) => res));
  }
  getUserOfficials(id: string): Observable<any> {
    return this.http.get<any>(API_URL + '/representative/official/list', {
      params: {id}, headers: new HttpHeaders({'Content-Type': 'application/json'})
    }).pipe(map((res) => res));
  }
  userDisable(id: string, motivo?: string): Observable<any> {
    return this.http
      .post(API_URL + '/user-disable', {id, motivo}, httpOptions)
      .pipe(map((res) => res));
  }
  userEnable(id: string, motivo?: string): Observable<any> {
    return this.http
      .post(API_URL + '/user-enable', {id, motivo}, httpOptions)
      .pipe(map((res) => res));
  }
  profilesAvailable(id: string, profile: string): Observable<any> {
    return this.http
      .get<any>(API_URL + '/profiles-available', {
        params: {id, profile},
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(map((res) => res));
  }
  BulkDisableUsers(file: FormData): Observable<any> {
    return this.http
      // .post(API_URL + '/bulk-disable-user', file, {responseType: 'blob', })
      .post(API_URL + '/bulk-disable-user', file)
      .pipe(map((res) => res));
  }
  userDisableCitizen(official: any, motivo?: string): Observable<any> {
    return this.http
      .post(API_URL + '/user-citizen-disable', {official, motivo}, httpOptions)
      .pipe(map((res) => res));
  }
  userEnableCitizen(official: any, motivo?: string): Observable<any> {
    return this.http
      .post(API_URL + '/user-citizen-enable', {official, motivo}, httpOptions)
      .pipe(map((res) => res));
  }
  inboxStatusChange(id: string, motivo?: string, change?: string): Observable<any> {
    return this.http
      .post(API_URL + '/inbox-status-change', {id, motivo, change}, httpOptions)
      .pipe(map((res) => res));
  }
  getUU_OO(): Observable<any> {
    return this.http
      .get<any>(API_URL + '/get-uuoo', {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(map((res) => res));
  }
}
