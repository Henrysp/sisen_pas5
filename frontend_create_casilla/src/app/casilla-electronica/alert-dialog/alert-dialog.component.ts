import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import { DOCUMENT } from '@angular/common';

class DialogData {
  messages: string[] = [];
  cabecera : string = 'Validación de documento de persona';
  btnCancel : boolean = false
}

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.css']
})
export class AlertDialogComponent implements OnInit {

  activeCancel = false;
  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    @Inject(DOCUMENT) private document: Document,
  ) {
  

  }

  ngOnInit(): void {
  }

  cancelar(){
    this.dialogRef.close(false);
  }

  aceptar(){
    this.dialogRef.close(true);
    //this.document.location.href = 'https://casillaelectronica.onpe.gob.pe/#/login';
  
  }
}
