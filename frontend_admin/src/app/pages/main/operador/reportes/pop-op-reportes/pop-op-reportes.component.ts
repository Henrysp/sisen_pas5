import { Component, ElementRef, Inject, OnInit, ViewChild, AfterViewChecked, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ReporteService } from 'src/app/services/reporte.service';
import { FuncionesService } from 'src/app/utils/funciones.service';
import * as moment from 'moment';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import {TypeDocument} from '../../../../../models/notifications/notification';
import {AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import { ModalMessageComponent } from './modal-message/modal-message.component';
export enum TipoReporteEnum {
  REPORTE_CASILLAS = 1,
  REPORTE_NOTIFICACIONES = 2,
  REPORTE_USUARIOS = 3,
  REPORTE_USUARIOS_ALL = 4
}
@Component({
  selector: 'app-pop-op-reportes',
  templateUrl: './pop-op-reportes.component.html',
  styleUrls: ['./pop-op-reportes.component.scss']
})
// export class PopOpReportesComponent implements OnInit, AfterViewInit,  AfterViewChecked {
export class PopOpReportesComponent implements OnInit {
  tipoReporte: TipoReporteEnum;
  isLoading = false;
  fechaInicio: Date = null;
  fechaFin: Date = null;
  minDatefi = new Date();
  maxDatefi = new Date();
  minDateff = new Date();
  maxDateff = new Date();
  mensaje = null;
  documentTypeSelected = '';
  maxlengthNumDoc: number;
  minlengthNumDoc: number;
  formGroup: FormGroup;
  toggleNroDocumento = false;
  // @ViewChild('frm_numerodoc') public frm_numerodoc! : ElementRef;
  /* Formulario = this.fb.group({
    fm_optiontipo: [''],
    fm_numerodoc: new FormControl('', []),
  });  */
  messageErrorDocmentNumber = '';
  typeDocument?: TypeDocument[] = [
    { id: 'todo', value: 'TODO' },
    { id: 'dni', value: 'DNI' },
    { id: 'ce', value: 'Carnet de Extranjería' },
    { id: 'ruc', value: 'RUC' },
    { id: 'pr', value: 'Partida Registral' },
  ];
  typeDocumentUsers?: TypeDocument[] = [
    { id: 'todo', value: 'TODO' },
    { id: 'dni', value: 'DNI' },
    { id: 'ce', value: 'Carnet de Extranjería' }
  ];
  listDocument: TypeDocument[];

  constructor(
    private formBuilder: FormBuilder,
    private dialog: MatDialogRef<PopOpReportesComponent>,
    private modalMessage: MatDialog,
    private reporteService: ReporteService,
    private _adapter: DateAdapter<any>,
    private fb: FormBuilder,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private funcionesService: FuncionesService) {
      this._locale = 'es';
      this._adapter.setLocale(this._locale);
     }

  ngOnInit(): void {
    this.createForm();
    this.minDatefi = new Date('2021-01-02');
    this.minDatefi.setDate(this.minDatefi.getDate()); // = new Date(currentYear,0,1); //.setFullYear(2000);
    // this.toggleNroDocumento = true;
    // console.log('this.formGroup.get : ', this.formGroup.get('fm_optiontipo').value);
    this.listDocument = (this.tipoReporte === 3 || this.tipoReporte === 4) ? this.typeDocumentUsers : this.typeDocument;
    if (this.formGroup.get('fm_optiontipo').value === 'todo') {
      this.formGroup.get('fm_numerodoc').disable();

    } else {
      this.formGroup.get('fm_numerodoc').enable();
    }
  }

  createForm() {
    this.formGroup = this.formBuilder.group({
      fm_optiontipo: ['todo', Validators.required],
      // fm_numerodoc:  ['', Validators.required],
      fm_numerodoc:  ['', [this.validateDocumentNumber.bind(this)]],
      startDate: [''],
      finishDate: [''],
    });
    // fm_numerodoc:  new FormControl('', []),
  }

  validateDocumentNumber(control: AbstractControl): ValidationErrors | null {
    // Devuelve un objeto con el error si no cumple la condición, de lo contrario, devuelve null
    if (control.value.length === 0) {
      return null;
    }

    if (this.minlengthNumDoc && this.maxlengthNumDoc) {

      if (control.value?.length < this.minlengthNumDoc || control.value.length > this.maxlengthNumDoc) {
        // console.log('Se enontró el erroorrrrrrrrrrrrrrrrrr.....')
        return { longitudInvalida: true };
      }
    }

    return null;
  }

  async handleOk() {
    this.mensaje = null;
    let promise: any;
    let tmpTipoReporte: string;
    let nameExcel: string;

    /* if(!this.fechaInicio || !this.fechaFin){
      this.mensaje ='Debe seleccionar un rango de fechas para obtener el reporte';
      return false;
    } */
    const documentType = this.formGroup.get('fm_optiontipo').value ;
    const documentNumber = this.formGroup.get('fm_numerodoc').value;
    const request = {
      documentType,
      documentNumber,
      fechaInicio: this.fechaInicio ? moment(this.fechaInicio).locale('PE') : null,
      fechaFin: this.fechaFin ? moment(this.fechaFin).locale('PE') : this.fechaFin
    };
    switch (this.tipoReporte){
      case TipoReporteEnum.REPORTE_CASILLAS:
        promise =   this.reporteService.reporteCasillas(request);
        tmpTipoReporte = 'Casillas';
        nameExcel = 'ReporteCasillas.xlsx';
        break;
      case TipoReporteEnum.REPORTE_NOTIFICACIONES:
       promise =   this.reporteService.reporteNotificaciones(request);
       tmpTipoReporte = 'Notificaciones';
       nameExcel = 'ReporteNotificaciones.xlsx';
       break;
      case TipoReporteEnum.REPORTE_USUARIOS:
        promise =   this.reporteService.reporteUsuarios(request);
        tmpTipoReporte = 'Usuarios';
        nameExcel = 'ReporteUsuarios.xlsx';
        break;
      case TipoReporteEnum.REPORTE_USUARIOS_ALL:
        /// Cambiar a histórico de usuarios
        promise =   this.reporteService.reporteUsuariosHistorico(request);
        tmpTipoReporte = 'Usuarios Histórico';
        nameExcel = 'ReporteUsuariosHistórico.xlsx';
        break;
    }

    // const promise = this.tipoReporte == TipoReporteEnum.REPORTE_CASILLAS ? this.reporteService.reporteCasillas({
    //   documentType,
    //   documentNumber,
    //   fechaInicio: this.fechaInicio ? moment(this.fechaInicio).locale("  PE") : null,
    //   fechaFin: this.fechaFin ?
    //     moment(this.fechaFin).locale("PE") : this.fechaFin
    // }) :
    //    this.reporteService.reporteNotificaciones({
    //     documentType,
    //     documentNumber,
    //     fechaInicio: this.fechaInicio ? moment(this.fechaInicio).locale("PE") : null,
    //     fechaFin: this.fechaFin ?
    //       moment(this.fechaFin).locale("PE") : this.fechaFin
    //   });

    // var tmpTipoReporte = (this.tipoReporte==1)?'Casillas':'Notificaciones';
    this.isLoading = true;
    this.funcionesService.showloading('Generando Reporte de ' + tmpTipoReporte, 'Cargando...');

    promise.subscribe(resp => {

      this.isLoading = false;
      this.funcionesService.closeloading();

      if (resp.type === 'json') {
        this.funcionesService.mensajeError(resp.body.message);
        // this.openModalMessage(resp.body.message);

      } else if ( resp.type === 'blob') {

       // console.log('Iniciando descarga ... ', resp.body);

        this.funcionesService.downloadFile(resp.body, nameExcel);
        this.dialog.close(true);
      }

    }, (err: any) => {
      this.isLoading = false;
      console.log('error : ', err);
      this.funcionesService.closeloading();
      this.funcionesService.mensajeError('Error en el servicio');
    });

  }

  openModalMessage(message: string) {
    // const dialogMessage =  this.modalMessage.open(ModalMessageComponent, {
    this.modalMessage.open(ModalMessageComponent, {
      width: '440px',
      height: '180px',
      disableClose: true,
      hasBackdrop: true,
      data: {cabecera : 'Verifique sus datos' , messages: [message]}
    });
    /* dialogMessage.afterClosed().subscribe(result => {
      console.log(`Modal cerrado con resultado: ${result}`);
    }); */

  }

  // Método para manejar el envío del formulario
  onSubmit() {
    if (this.formGroup.valid) {
      // console.log('Formulario enviando ... ');
      this.handleOk();
    } else {
      // Muestra un mensaje de error
      // console.log('Formulario con datos inválidos');
    }
  }

  getErrorMessage() {
    // console.log('Se está generando el mensaje : ');
    if (this.formGroup.get('fm_optiontipo').hasError('required')) {
      return 'Debes seleccionar una opción';

    } else if (this.formGroup.get('fm_numerodoc').hasError('longitudInvalida')) {
      return 'Debes ingresar un valor válido';

    } else if ( this.formGroup.get('startDate').hasError('required') ) {
      return 'Debes seleccionar fecha con valor válido';

    } else if ( this.formGroup.get('finishDate').hasError('required') ) {
      return 'Debes seleccionar fecha con valor válido';
    }
  }

  handleCancelar() {

    this.formGroup.disable();
    this.dialog.close(false);

    // this.modalMessage.closeAll();
  }

  onValueChange(e){
    this.fechaFin = null;
    // this.maxDateff = new Date(this.fechaInicio); finaliza 31 dias despues
    // this.maxDateff.setDate(this.maxDateff.getDate()+31); finaliza 31 dias despues
  }
  eChangeDocumento(event) {
    // console.log('init this.toggleNroDocumento : ', this.toggleNroDocumento);
    this.toggleNroDocumento = false;
    this.documentTypeSelected = event.value;
    // this.Document('fm_numerodoc').setValue('');
    if (this.documentTypeSelected === 'todo') {

      // this.minlengthNumDoc = 8;
      // this.maxlengthNumDoc = 8;
      this.toggleDocumentNumber(false);

    } else if (this.documentTypeSelected === 'dni') {
      this.minlengthNumDoc = 8;
      this.maxlengthNumDoc = 8;
      this.messageErrorDocmentNumber = 'El DNI debe tener 8 dígitos';
      this.toggleDocumentNumber(true);

    } else if (this.documentTypeSelected === 'ce') {
      this.minlengthNumDoc = 9;
      this.maxlengthNumDoc = 9;
      this.messageErrorDocmentNumber = 'El CE debe tener 9 dígitos';
      this.toggleDocumentNumber(true);

    } else if (this.documentTypeSelected === 'ruc') {
      this.minlengthNumDoc = 11;
      this.maxlengthNumDoc = 11;
      this.messageErrorDocmentNumber = 'El RUC debe tener 11 dígitos';
      this.toggleDocumentNumber(true);

    } else if (this.documentTypeSelected === 'pr') {
      this.minlengthNumDoc = 3;
      this.maxlengthNumDoc = 50;
      this.messageErrorDocmentNumber = 'La "Partida Regitral" debe tener entre 3 y 50 caractéres';
      this.toggleDocumentNumber(true);

    } else {
      this.toggleDocumentNumber(false);
          }
    // console.log('end this.toggleNroDocumento : ', this.toggleNroDocumento);
    // this.Formulario.fm_optiontipo.setValue(' ');
  }

  toggleDocumentNumber(show: boolean) {

    this.formGroup.get('fm_numerodoc').setValue('');

    if (show) {
      this.formGroup.get('fm_numerodoc').markAsTouched();
      this.formGroup.get('fm_numerodoc').enable();
      this.toggleNroDocumento = true;

    } else {
      this.formGroup.get('fm_numerodoc').disable();
      this.toggleNroDocumento = false;
    }
  }
  lostFocusDocumentNumber(event: any) {
    // console.log('Elemento perdió el foco. this.toggleNroDocumento:', this.toggleNroDocumento);
    this.toggleNroDocumento = false;
  }
  buildHolder = (name: string) => {
    switch (name) {
      case 'fm_numerodoc':
        if (this.documentTypeSelected === 'dni') { return 'Ingrese el número de DNI'; }
        if (this.documentTypeSelected === 'ce') { return 'Ingrese el número de CE'; }
        if (this.documentTypeSelected === 'ruc') { return 'Ingrese el número de RUC'; }
        if (this.documentTypeSelected === 'pr') { return 'Ingrese el número de PR'; }
        return 'Ingrese el número de documento';
    }
  }

  focusOnNumeroDoc() {
    // Accede al elemento DOM asociado al control del formulario y llama a focus()
    // this.fmNumerodoc.nativeElement.focus();
    // console.log('focusOnNumeroDoc');
    // console.log('this.frm_numerodoc:', this.frm_numerodoc);
    // this.frm_numerodoc.nativeElement.focus();

     /* setTimeout(() => {
      if (this.fm_numerodoc.nativeElement) {
        console.log('this.fmNumerodoc.nativeElement : ', this.fm_numerodoc.nativeElement);
        this.fm_numerodoc.nativeElement.focus();
      }

     }, 0)  */

  }

  validar_campo(event, type): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (this.documentTypeSelected === 'pr') {
      return !!/^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð/'-]+$/.test(event.key);
    }else if ( this.documentTypeSelected === 'ruc') {
      const numeroDocumento = type.value;
      if (numeroDocumento.toString().indexOf('20') === -1){
        type.Document.setValue('');
        return false;
      }
      }else if (this.documentTypeSelected === 'dni' || this.documentTypeSelected === 'ce' ) {
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      }
      return true;
    }
  }

  // enterValidDocumentNumber( event: KeyboardEvent ): void {
  enterValidDocumentNumber( event: Event, controlName: string ): void {
    const inputValue = (event.target as HTMLInputElement).value;

    let numericValue = '';
    if (this.documentTypeSelected === 'pr') {
      numericValue = inputValue.replace(/[^0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮ ŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð/'-]/g, '');

    }else if ( this.documentTypeSelected === 'ruc') {

      if (inputValue.length === 1) {
        const firstTwoDigits = inputValue.slice(0, 1);
        // if (firstTwoDigits !== '1' && firstTwoDigits !== '2') {
        if ( firstTwoDigits !== '2') {
          // Si los primeros dos dígitos no son 10 o 20, eliminarlos
          this.messageErrorDocmentNumber = 'El primer dígito debe ser "2"';
          this.formGroup.get(controlName)?.setValue(inputValue.slice(1));
          return null;
        }

      } else if (inputValue.length === 2 ) {
        const firstTwoDigits = inputValue.slice(0, 2);
        const secondDigit = inputValue.slice(1, 1);
        if (firstTwoDigits !== '10' && firstTwoDigits !== '20') {
          // Si los primeros dos dígitos no son 10 o 20, eliminarlos
          this.messageErrorDocmentNumber = 'El segundo dígito debe ser "0"';
          numericValue = secondDigit.replace(/[^0]/g, '');
          if (numericValue.length === 0) {
            this.formGroup.get(controlName)?.setValue(inputValue.slice(0, 1));

          } else {
            this.formGroup.get(controlName)?.setValue(inputValue.slice(0, 2));

          }
          return null;
        }
      } else {

        const pattern = /[^0-9]/g;
        const differtentNumber = pattern.test(inputValue);

        if (differtentNumber) {
          this.messageErrorDocmentNumber = `El ${this.documentTypeSelected.toUpperCase()} debe ser numérico`;
        } else {
          this.messageErrorDocmentNumber = 'El RUC debe tener 11 dígitos';
        }

      }

      numericValue = inputValue.replace(/[^0-9]/g, '');

    } else if (this.documentTypeSelected === 'dni' || this.documentTypeSelected === 'ce' ) {

      const pattern = /[^0-9]/g;
      const differtentNumber = pattern.test(inputValue);

      if (differtentNumber) {

        this.messageErrorDocmentNumber = `El ${this.documentTypeSelected.toUpperCase()} debe ser numérico`;
       } else {
        this.messageErrorDocmentNumber = `El ${this.documentTypeSelected.toUpperCase()} debe tener ${this.maxlengthNumDoc} dígitos`;
      }
      // numérico
      numericValue = inputValue.replace(/[^0-9]/g, '');
    }
     // Limitar la longitud a 8 dígitos
    const truncatedValue = numericValue.slice(0, this.maxlengthNumDoc);

    // Actualizar el valor del campo
    this.formGroup.get(controlName)?.setValue(truncatedValue);

  }

}
