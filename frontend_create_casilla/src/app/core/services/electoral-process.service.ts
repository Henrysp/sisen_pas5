import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ElectoralProcessDTO } from "../dto/electotral-process.dto";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: 'root'
})
export class ElectoralProcessService {
    
    baseUrl = `${environment.serviceUrl}/electoral-process`;

    constructor(private http: HttpClient) { }
    
    getStatusActivesList(): Observable<Array<ElectoralProcessDTO>> {
        const statusParam = 'active';
        const url = `${this.baseUrl}?status=${statusParam}`;
        return this.http.get<Array<ElectoralProcessDTO>>(url);
    }
}