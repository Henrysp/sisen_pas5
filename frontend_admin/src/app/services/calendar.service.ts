import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

const API_URL = environment.URL_SERVICES;
const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json',
    }),
};
@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    constructor(private http: HttpClient) { }

    getCalendar(page:string, size:string, filters:string): Observable<any> {
        return this.http
          .get<any>(API_URL + '/calendar', {
            params: {page, size, filters},
            headers: new HttpHeaders({
              'Content-Type':'application/json'
            })
          })
          .pipe(map((res) => res));
    }

    getCalendarxId(id): Observable<any> {
        return this.http
        .get<any>(API_URL + '/calendar/one', {
          params: {id},
          headers: new HttpHeaders({
            'Content-Type':'application/json'
          })
        })
        .pipe(map((res) => res['data']));
    }

    save(boxRequest: FormData): Observable<any>{
        return this.http.post<any>(API_URL + '/calendar/save', boxRequest)
        .pipe(map((res) => res));
    }

    update(boxRequest: FormData): Observable<any>{
        return this.http.put<any>(API_URL + '/calendar/update', boxRequest)
        .pipe(map((res) => res));
    }
}