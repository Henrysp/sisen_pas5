import {Injectable} from '@angular/core';
import {ValidacionCorreoComponent} from "../../casilla-electronica/validacion-correo/validacion-correo.component";
import {firstValueFrom, map, Observable} from "rxjs";
import {CasillaService} from "./casilla.service";
import {MatDialog} from "@angular/material/dialog";
import {environment} from "../../../environments/environment";
import {MatSnackBar} from "@angular/material/snack-bar";
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ValidarCorreoService {
  configUrl = `${environment.serviceUrl}`
  constructor(
    private casillaService: CasillaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
  }
  envioCorreoVerificacion(request : any): Observable<any>{
    return this.http.post<any>(this.configUrl + '/enviar-correo-verificacion',request).pipe(map(resp=>resp));
   // return this.http.get("../../assets/enviocorreoverifica.json").pipe(map(resp=>resp));
  }

  validarCodigoVerificacion(request : any): Observable<any>{
    return this.http.post<any>(this.configUrl + '/validar-codigo-verificacion',request).pipe(map(resp=>resp));
  }
  async enviarCorreo(correo: string) {
    if (!this.esCorreoValido(correo)) {
      this.showMessage('El correo electrónico no es válido')
      return false
    }
    try {
      await firstValueFrom(this.casillaService.enviarCodigoValidacion(correo))
      this.showMessage(`Código de verificación enviado correctamente a ${correo}`)
      return true
    } catch (e) {
      this.showMessage('No se ha enviado el código de validación. Por favor reintente.')
      return false
    }
  }
  async validarCodigo(correo: string, codigo: string) {
    if (!this.esCorreoValido(correo)) {
      this.showMessage('El correo electrónico no es válido')
      return false
    }
    if (codigo == '') {
      this.showMessage('El código de verificación no es válido')
      return false
    }
    try {
      await firstValueFrom(this.casillaService.validarCodigoValidacion(correo, codigo))
      return true
    } catch (e) {
      this.showMessage('No se ha podido validar el código. Por favor reintente')
      return false
    }
  }
  async iniciarValidacion(correo: string, codigoEnviado:boolean): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      //todo: enable to avoid send email every time dialog is opened
      //if(!codigoEnviado) {
        if (!await this.enviarCorreo(correo)) {
          resolve(false)
          return
        }
      //}
      const dialogRef = this.dialog.open(ValidacionCorreoComponent, {
        disableClose: true,
        hasBackdrop: true
      });
      dialogRef.componentInstance.onReenviarCodigo.subscribe(async () => {
        if (await this.enviarCorreo(correo)) {
          dialogRef.componentInstance.codigoReenviado()
        } else {
          dialogRef.componentInstance.codigoNoReenviado()
        }
      })
      dialogRef.componentInstance.onValidarCodigo.subscribe(async (codigo: string) => {
        if (await this.validarCodigo(correo, codigo)) {
          dialogRef.componentInstance.codigoValidado()
        } else {
          dialogRef.componentInstance.codigoNoValidado()
        }
      })
      dialogRef.afterClosed().subscribe((value) => {
        if (value) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }
  esCorreoValido(correo: string) {
    //todo: validar
    return correo != ''
  }
  private showMessage(message: string) {
    this.snackBar.open(message, 'Aceptar', {
      duration: environment.snackbarDuration,
    })
  }
}
