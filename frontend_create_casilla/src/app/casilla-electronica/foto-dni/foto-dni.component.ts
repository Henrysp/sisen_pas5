import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FileUploadValidators } from '@iplab/ngx-file-upload';
import { Subscription } from 'rxjs';
import { requestGlobal } from 'src/app/core/dto/request';
import { CasillaService } from 'src/app/core/services/casilla.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-foto-dni',
  templateUrl: './foto-dni.component.html',
  styleUrls: ['./foto-dni.component.css']
})
export class FotoDniComponent implements OnInit {

  @Output() completedStep = new EventEmitter<any>()
  @Output() previousStep = new EventEmitter<any>()
  maxsize_ = 5242880;
  ext = 'png  jpg jpeg PNG JPG JPEG';

  observableRequestSubscription!: Subscription;
  requestSave: requestGlobal = new requestGlobal();

  formGroup!: FormGroup;
  constructor( private formBuilder: FormBuilder,private casillaService: CasillaService,private dialog: MatDialog) {

    this.observableRequestSubscription = casillaService.casilla$.subscribe(
      (requestSave: requestGlobal) => {
        this.requestSave = requestSave;
        //if (requestSave) this.companyId = requestSave;
      }
    );
   }
  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      files: this.filesControl
    });
  }
  handleArchivoAgregado(event: any) {
    // console.log(event)
    this.formGroup.get('file')?.setValue(event)
  }
  regresar() {
    this.previousStep.emit()
  }
  continuar() {
    if(!this.formGroup.valid){
          this.formGroup.markAllAsTouched()
      return
    }
    this.requestSave.file = this.formGroup.controls['files'].value[0];
    this.casillaService.setCasilla(this.requestSave);
    this.completedStep.emit()
  }
  public filesControl = new FormControl( null, [
    Validators.required,
    FileUploadValidators.accept(['image/*']),
    FileUploadValidators.filesLimit(1),
    FileUploadValidators.fileSize(this.maxsize_),
   // this.noWhitespaceValidator,
  ]);
  get f(): { [key: string]: AbstractControl } {
    return this.formGroup.controls ;
  }
  validatorImage(){
    const Image = this.formGroup.controls['files'].value[0];
    if(Image.size < 1){
      this.dialog.open(AlertDialogComponent, {
        data: {cabecera : '!Advertencia!' ,messages: ['El archivo se actualizó satisfactoriamente.']}
      })
    }
    if(Image.size >= this.maxsize_){
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera : '!Advertencia!' ,messages: ['El peso de la imagen adjunta no debe superar los 5MB']}
      })
      this.filesControl.setValue([]);

    }

    let type = Image.name.split('.');
    type = type[type.length - 1];
    if(this.ext.indexOf(type) === -1){
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera : '!Advertencia!' ,messages: ['El archivo debe ser de tipo imagen en formato PNG, JPG o JPEG']}
      })
      this.filesControl.setValue([]);
    }

    if (Image.name.length>104) {
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera : '!Advertencia!' ,messages: ['El nombre del archivo no debe ser mayor a 100 caracteres.']}
      })
      this.filesControl.setValue([]);
    }
    return;
   // this.f.files.setValue(null)
    //  this.formGroup.get('files')?.setValue(null);
    //
  }
}
