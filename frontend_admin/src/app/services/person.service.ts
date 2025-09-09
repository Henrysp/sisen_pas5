import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

const API_URL = environment.URL_SERVICES;

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  constructor(private http: HttpClient) { }

  findExiste(dni: string): Observable<any> {
    return this.http
      .get<any>(API_URL + '/person/findExiste', {
        params: {dni},
        headers: new HttpHeaders({
          'Content-Type':'application/json'
        })
      })
      .pipe(map((res) => res));
  }

  findByDni(dni: string): Observable<any> {
    return this.http
      .get<any>(API_URL + '/person/findByDni', {
        params: {dni},
        headers: new HttpHeaders({
          'Content-Type':'application/json'
        })
      })
      .pipe(map((res) => res));
  }

  save(formData: FormData) {
    return this.http
      .post<any>(API_URL + '/person/save', formData)
      .pipe(map((res) => res));
  }

}
