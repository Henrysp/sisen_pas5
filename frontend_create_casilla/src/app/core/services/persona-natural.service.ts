import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { map, Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {ObtenerDatosPersonaDniDto, PersonaNaturalDni, RequestValidateData, ResponseValidateData} from "../dto/personaNaturalDni";

@Injectable({
  providedIn: 'root'
})
export class PersonaNaturalService {

  configUrl = `${environment.serviceUrl}`

  constructor(
    private http: HttpClient
  ) { }

  obtenerDatosPersona(request: ObtenerDatosPersonaDniDto): Observable<PersonaNaturalDni> {
    return this.http.post<PersonaNaturalDni>(`${this.configUrl}/obtener-datos-persona-dni`, request).pipe(map(resp=>resp));
  }

  obtenerDatosPersonaDb(request: ObtenerDatosPersonaDniDto): Observable<PersonaNaturalDni> {
    return this.http.post<PersonaNaturalDni>(`${this.configUrl}/obtener-datos-persona-dni-db`, request).pipe(map(resp=>resp));
  }

  validarDatosPersona(datos : RequestValidateData):Observable<ResponseValidateData>{
    // console.log("va a validarDatosPersona---->", datos);
    return this.http.post<ResponseValidateData>(this.configUrl + '/validarPersona',datos).pipe(map(resp=>resp));
  }
}
