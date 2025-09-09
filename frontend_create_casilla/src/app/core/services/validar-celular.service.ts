import {Injectable} from "@angular/core";
import {environment} from "../../../environments/environment";
import {CasillaService} from "./casilla.service";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ValidarCelularService {
  configUrl = `${environment.serviceUrl}`

  constructor(
    private casillaService: CasillaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
  }

  envioSMSVerificacion(request: any): Observable<any> {
    return this.http.post<any>(this.configUrl + '/enviar-sms-verificacion',request).pipe(map(resp=>resp));
  }

  validarCodigoVerificacion(request : any): Observable<any>{
    return this.http.post<any>(this.configUrl + '/validar-codigo-verificacion-sms',request).pipe(map(resp=>resp));
  }
}
