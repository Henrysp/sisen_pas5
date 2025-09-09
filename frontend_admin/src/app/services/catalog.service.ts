import { HttpClient, HttpHeaders } from '@angular/common/http';
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
export class CatalogService {
    constructor(private http: HttpClient) { }

    paginateCatalog(request: {
        search: string;
        page: number;
        count: number;
    }): Observable<any> {
        return this.http
            .post<any>(API_URL + '/catalog/paginate', request, httpOptions)
            .pipe(map((res) => res));
    }
    gettypes(): Observable<any> {
        return this.http
            .get<any>(API_URL + '/catalog/types', {})
            .pipe(map((res) => res));
    }
    listCatalog(type: string): Observable<any> {
        return this.http
            .get<any>(API_URL + '/catalog', { params: { type } })
            .pipe(map((res) => res));
    }


    createCatalog(request: {
        type: string;
        code: string;
        value: string;
    }): Observable<any> {
        return this.http
            .post<any>(API_URL + '/catalog/create', request, httpOptions)
            .pipe(map((res) => res));
    }

    updateCatalog(request: {
        id: string;
        type: string;
        value: string;
        valueold: string;
    }): Observable<any> {
        return this.http
            .post<any>(API_URL + '/catalog/update', request, httpOptions)
            .pipe(map((res) => res));
    }

    removeCatalog(id): Observable<any> {
        return this.http
            .post<any>(API_URL + '/catalog/remove', { id }, httpOptions)
            .pipe(map((res) => res));
    }

    nextcodeCatalog(type:string): Observable<any> {
        return this.http
            .get<any>(API_URL + '/catalog/nextcode',  { params: { type } })
            .pipe(map((res) => res));
    }
}


