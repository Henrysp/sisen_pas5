import {Component, EventEmitter, OnInit} from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-validacion-correo',
  templateUrl: './validacion-correo.component.html',
  styleUrls: ['./validacion-correo.component.css']
})
export class ValidacionCorreoComponent implements OnInit {

  onReenviarCodigo = new EventEmitter()
  onValidarCodigo = new EventEmitter()

  enviandoCodigo = false
  enviarCodigoTextoButton = 'Reenviar código de validación'

  validandoCodigo = false
  validarCodigoTextoButton = 'VALIDAR'

  constructor(public dialogRef: MatDialogRef<ValidacionCorreoComponent>) {
  }

  ngOnInit(): void {
  }

  enviadoCodigoEstado(enviando: boolean) {
    this.enviandoCodigo = enviando
    this.enviarCodigoTextoButton = enviando ? 'Enviando código de validación' : 'Reenviar código de validación'
    this.validandoCodigo = enviando
  }

  validandoCodigoEstado(enviando: boolean) {
    this.enviandoCodigo = enviando
    this.validarCodigoTextoButton = enviando ? 'VALIDANDO' : 'VALIDAR'
    this.validandoCodigo = enviando

  }

  reenviarCodigo() {
    this.enviadoCodigoEstado(true)
    this.onReenviarCodigo.emit()
  }

  codigoReenviado() {
    this.enviadoCodigoEstado(false)
    this.enviarCodigoTextoButton = 'Reenviar código de validación'
  }

  codigoNoReenviado(){
    this.enviadoCodigoEstado(false)
    this.enviarCodigoTextoButton = 'Reenviar código de validación'
  }

  validarCodigo(codigo: string) {
    this.validandoCodigoEstado(true)
    this.onValidarCodigo.emit(codigo)
  }

  cancelarValidacion(){
    this.dialogRef.close(false)
  }

  codigoValidado() {
    this.dialogRef.close(true)
    this.validandoCodigoEstado(false)
  }

  codigoNoValidado() {
    this.validandoCodigoEstado(false)
  }
}
