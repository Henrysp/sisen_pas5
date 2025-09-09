import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const API_URL = environment.URL_SERVICES;
@Injectable({
    providedIn: 'root'
})
export class CollectionService {
    constructor(private http: HttpClient) { }

    exportCatalog(name, label): Observable<any> {
        return this.http.get(`${API_URL}/admin/export-collection`, { params: { name, label }, responseType: 'blob' as 'json' });
    }

    listColletions(): Observable<any> {
        return this.http.get(`${API_URL}/admin/collection-info`);
    }

}