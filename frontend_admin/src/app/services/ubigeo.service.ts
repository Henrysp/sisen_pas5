import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import { Departamento, Distrito, Provincia } from '../models/ubigeo';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UbigeoService {

  configUrl = `${environment.URL_SERVICES}/ubigeo`

  constructor(private http:HttpClient) { }


  getDepartamentoList(): Observable<Array<Departamento>> {
    return this.http.get<Array<Departamento>>(`${this.configUrl}/departamentos`)
  }

  getProvinciaList(codigoDepartamento:string): Observable<Array<Provincia>> {
    return this.http.get<Array<Provincia>>(`${this.configUrl}/provincias/${codigoDepartamento}`)
  }

  getDistritoList(codigoDepartamento:string, codigoProvincia:string): Observable<Array<Distrito>> {
    return this.http.get<Array<Distrito>>(`${this.configUrl}/distritos/${codigoDepartamento}/${codigoProvincia}`)
  }
}
