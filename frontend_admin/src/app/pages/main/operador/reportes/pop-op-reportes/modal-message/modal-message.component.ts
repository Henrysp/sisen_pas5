import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

class DialogData {
  messages: string[] = [];
  cabecera : string = 'Validación de documento de persona';
  btnCancel : boolean = false
}


@Component({
  selector: 'app-modal-message',
  templateUrl: './modal-message.component.html',
  styleUrls: ['./modal-message.component.scss']
})
export class ModalMessageComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ModalMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  ngOnInit(): void {
  }
  cancelar(){
    this.dialogRef.close(false);
  }

  aceptar(){
    //this.dialogRef.close(true);
    this.dialogRef.close(false);
    //this.document.location.href = 'https://casillaelectronica.onpe.gob.pe/#/login';
  
  }
}
