import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { map, Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import { requesGetData, RequestValidatePJ, requestValidateRepresentative, responseSunat, responseValidateRepresentative } from '../dto/personaJuridica';
import { ResponseValidateData } from '../dto/personaNaturalDni';

@Injectable({
  providedIn: 'root'
})
export class PersonaJuridicaService {

  configUrl = `${environment.serviceUrl}`

  constructor(
    private http: HttpClient
  ) { }

  obtenerDatosPersonaJuridica(request: requesGetData): Observable<responseSunat> {
    return this.http.post<responseSunat>(`${this.configUrl}/legal/person/data`, request);
  } 

  validarRepresentante(request: requestValidateRepresentative): Observable<responseValidateRepresentative> {
    return this.http.post<responseSunat>(`${this.configUrl}/legal/representative/validate`, request);
  } 

  validarDatosPersonaJuridica(datos : RequestValidatePJ):Observable<ResponseValidateData>{
    return this.http.post<ResponseValidateData>(this.configUrl + '/legal/person/validate',datos).pipe(map(resp=>resp));
  }

}
