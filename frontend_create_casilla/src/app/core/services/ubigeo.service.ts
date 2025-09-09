import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {Departamento, Distrito, Provincia} from "../dto/ubigeo.dto";

@Injectable({
  providedIn: 'root'
})
export class UbigeoService {

  configUrl = `${environment.serviceUrl}`

  constructor(private http:HttpClient) { }

  departamentos(): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.configUrl}/departamento`)
  }

  getDepartamentoList(): Observable<Array<Departamento>> {
    return this.http.get<Array<Departamento>>(`${this.configUrl}/departamento`)
  }

  getProvinciaList(codigoDepartamento:string): Observable<Array<Provincia>> {
    return this.http.get<Array<Provincia>>(`${this.configUrl}/departamento/${codigoDepartamento}`)
  }

  getDistritoList(codigoDepartamento:string, codigoProvincia:string): Observable<Array<Distrito>> {
    return this.http.get<Array<Distrito>>(`${this.configUrl}/departamento/${codigoDepartamento}/${codigoProvincia}`)
  }
}
