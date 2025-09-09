import {Component, OnInit,  Renderer2} from '@angular/core';
import {AbstractControl, FormControl} from '@angular/forms';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {firstValueFrom, Subscription} from "rxjs";
import {Condicion_Persona_Juridica,Condicion_Persona_Natural,TipoDocumento,TipoDocumento_RUC} from "../../core/dto/documento";
import {CasillaService} from "../../core/services/casilla.service";
import {Departamento, Distrito, Provincia} from "../../core/dto/ubigeo.dto";
import {UbigeoService} from "../../core/services/ubigeo.service";
import { PersonaJuridicaService } from 'src/app/core/services/persona-juridica.service';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ValidarCorreoService } from 'src/app/core/services/validar-correo.service';
import { SharedDialogComponent } from '../shared/shared-dialog/shared-dialog.component';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module, ReCaptchaV3Service} from 'ng-recaptcha';
import {TooltipPosition} from '@angular/material/tooltip';
import { requesGetData } from 'src/app/core/dto/personaJuridica';
import {ValidarCelularService} from "../../core/services/validar-celular.service";
import {FileUploadValidators} from "@iplab/ngx-file-upload";

@Component({
  selector: 'app-persona-juridica',
  templateUrl: './persona-juridica.component.html',
  styleUrls: ['./persona-juridica.component.css']
})
export class PersonaJuridicaComponent implements OnInit {

  formGroup!: FormGroup;
  tipoDocumentoList: Array<TipoDocumento> = []
  departamentoList: Array<Departamento> = []
  provinciaList: Array<Provincia> = []
  distritoList: Array<Distrito> = []
  public loading: boolean = false;
  numeroRucValido: Boolean | undefined = undefined;
  minlength : number = 11
  maxlength : number = 11;
  TOkenCaptcha: string = '';
  positionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];
  position = new FormControl(this.positionOptions[0]);
  esIos: boolean = false;
  blockInput : boolean = true;
  cont = 0;
  oneClick = false;
  lblDocumento = "RUC";
  public buscando: boolean = false;
  maxsize_ = 10485760;
  public uploadedFiles: Array<File> = [];
  dropArea: any;
  bPc : boolean = false;
  personType = 'pj';

  err_max_files = false;
  err_format = false;
  err_size = false;
  err_size_name = false;
  err_duplicados = false;
  errorMessages: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private casillaService: CasillaService,
    private ubigeoService: UbigeoService,
    private personaJuridicaService :PersonaJuridicaService,
    private correoService : ValidarCorreoService,
    private smsService : ValidarCelularService,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private renderer: Renderer2,
    private dialog: MatDialog
  ) {
  }

  async ngOnInit() {

    this.createForm();
    this.formGroup.get('numeroDocumento')?.disable();
    this.desactivarInputsInit();
    this.tipoDocumentoList = await firstValueFrom(this.casillaService.getTipoDocumentoList(Condicion_Persona_Juridica))
    this.departamentoList = await firstValueFrom(this.ubigeoService.getDepartamentoList())
    this.dipositivo();
    this.tipoDocumentoCambiado();
    //this.dropArea.addEventListener('drop', this.validator, false);
  }


  validatorFile() {
    this.errorMessages = []
    let archivos = this.formGroup.controls['files'].value || [];
    this.err_max_files = false;
    this.err_format = false;
    this.err_size = false;
    this.err_size_name = false;
    this.err_duplicados = false;
    const archivosValidos = archivos.filter((archivo: any) => {
      const tipoArchivo = archivo.type.split("/")[1];

      if (tipoArchivo !== "pdf") {
        this.err_format = true;
        return false;
      }

      if (archivo.size >= this.maxsize_) {
        this.err_size = true
        return false;
      }

      if (archivo.name.length > 104) {
        this.err_size_name = true
        return false;
      }

      return true;
    });

    if (archivosValidos.length > 2) {
      this.err_max_files = true
      archivosValidos.splice(2);
    }

    const nombresArchivos = new Set();
    this.uploadedFiles = archivosValidos.filter((archivo: any) => {
      if (nombresArchivos.has(archivo.name)) {
        this.err_duplicados = true
        return false;
      }
      nombresArchivos.add(archivo.name);
      return true;
    });

    if (this.err_max_files) {
      this.errorMessages.push('Has alcanzado el límite de archivos permitidos');
    }
    if (this.err_format) {
      this.errorMessages.push('Contiene archivos con formato no válidos');
    }
    if (this.err_size) {
      this.errorMessages.push('Contiene archivos con tamaño mayor a 10MB');
    }
    if (this.err_size_name) {
      this.errorMessages.push('Contiene archivos con nombre mayor de 100 caracteres');
    }
    if (this.err_duplicados) {
      this.errorMessages.push('Contiene archivos duplicados');
    }
    if (this.err_format || this.err_size || this.err_size_name || this.err_duplicados || this.err_max_files){
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: { cabecera: '!Advertencia!', messages: this.errorMessages }
      });
    }
    this.filesControl.setValue(this.uploadedFiles);
  }
  createForm(value =""){
    this.formGroup = this.formBuilder.group({
      tipoDocumento: [value, Validators.required],
      numeroDocumento: ['', [Validators.required]],
      razonSocial: ['', Validators.required],
      numeroPartida: [''],
      asientoRegistral: ['', Validators.required],
      files: this.filesControl,
      //digitoVerificacion: ['',  Validators.required ],
      correoElectronico: ['',[ Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      numeroCelular: ['', Validators.required],
      numeroTelefono: [''],
      //ciudadTelefono: ['', Validators.required],
      //telefono: ['', Validators.required],
      departamento: ['', Validators.required],
      provincia: ['', Validators.required],
      distrito: ['', Validators.required],
      domicilioFisico: ['', [Validators.required, Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð,.'\" °\\-:;/()]{1,254}$")]],
      paginaWeb: [''],
      validateEmail : [false, Validators.required],
      validateSms : [false, Validators.required],
      recaptchaReactive: ['']
    })
  }

  public filesControl = new FormControl(null, [
    Validators.required,
    FileUploadValidators.filesLimit(2),
    FileUploadValidators.accept(['.pdf']),
    FileUploadValidators.fileSize(1048576 * 10),
    // this.noWhitespaceValidator,
  ]);

  dipositivo(){
    var ua = navigator.userAgent;
    if(/iPhone|iPad|iPod|CriOS/i.test(ua)){ //Todos los dispositivos móviles---->: if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua))
      this.esIos = true;
      this.formGroup.get("tipoDocumento")?.setValue('-');
    }
  }


  tipoDocumentoCambiado() {
    this.activarInputs();
    const value  = this.formGroup.get('tipoDocumento')?.value;
    this.blockInput = false;
    this.provinciaList = [];
    this.distritoList = [];
    this.invalidarDocumento();
    //this.formGroup.get('numeroDocumento')?.disable();
    if(value === "PR"){
      //this.desactivarInputsInit();
      this.lblDocumento = "Partida Registral";
      this.formGroup.get('numeroDocumento')?.enable();
      this.formGroup.get('razonSocial')?.enable();
      this.formGroup.get('numeroDocumento')?.clearValidators;
      this.formGroup.get('numeroDocumento')?.addValidators(Validators.pattern(/^(?!\s)(?!.*\s{2,})(?!.*--)(?!.*-$)[a-zA-Z0-9]+([\s-]+[a-zA-Z0-9]+)*$/));
      this.formGroup.get('numeroPartida')?.setErrors(null);
      this.formGroup.get('numeroPartida')?.setValidators(null);
      this.formGroup.get('numeroPartida')?.updateValueAndValidity();
      this.formGroup.get('razonSocial')?.addValidators(Validators.pattern('^[0-9a-zA-Z][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð,.\'\" °\\-:/;()]{1,254}$'));
      this.formGroup.get('numeroPartida')?.addValidators(Validators.pattern(/^(?!\s)(?!.*\s{2,})(?!.*--)(?!.*-$)[a-zA-Z0-9]+([\s-]+[a-zA-Z0-9]+)*$/));
      this.formGroup.get('asientoRegistral')?.addValidators(Validators.pattern(/^(?!\s)(?!.*\s{2,})(?!.*--)(?!.*-$)[a-zA-Z0-9]+([\s-]+[a-zA-Z0-9]+)*$/));
      this.formGroup.get('razonSocial')?.updateValueAndValidity();
      this.formGroup.get('numeroPartida')?.updateValueAndValidity();
      this.formGroup.get('asientoRegistral')?.updateValueAndValidity();
      this.bPc = false;
      this.minlength = 3;
      this.maxlength = 50;
    } else if(value === "RUC"){
      this.lblDocumento = "RUC";
      this.formGroup.get('numeroDocumento')?.enable();
      this.formGroup.get('razonSocial')?.disable();
      this.formGroup.get('numeroPartida')?.setErrors(null);
      this.formGroup.get('numeroPartida')?.setValidators([Validators.required,Validators.pattern(/^(?!\s)(?!.*\s{2,})(?!.*--)(?!.*-$)[a-zA-Z0-9]+([\s-]+[a-zA-Z0-9]+)*$/)]);
      this.formGroup.get('asientoRegistral')?.addValidators(Validators.pattern(/^(?!\s)(?!.*\s{2,})(?!.*--)(?!.*-$)[a-zA-Z0-9]+([\s-]+[a-zA-Z0-9]+)*$/));
      this.formGroup.get('numeroPartida')?.updateValueAndValidity();
      this.minlength = 11;
      this.maxlength = 11;
      this.bPc = true;
    } else {
      this.lblDocumento = "documento";
      this.formGroup.get('numeroDocumento')?.disable();
      this.formGroup.get('razonSocial')?.disable();
      this.formGroup.get('numeroPartida')?.disable();
      this.formGroup.get('asientoRegistral')?.disable();
      this.formGroup.get('numeroDocumento')?.clearValidators;
      this.formGroup.get('numeroPartida')?.setErrors(null);
      this.formGroup.get('numeroPartida')?.setValidators(null);
      this.formGroup.get('numeroPartida')?.updateValueAndValidity();
      this.formGroup.get('files')?.disable();
      this.formGroup.get('correoElectronico')?.disable();
      this.formGroup.get('numeroCelular')?.disable();
      this.formGroup.get('numeroTelefono')?.disable();
      this.formGroup.get('departamento')?.disable();
      this.formGroup.get('provincia')?.disable();
      this.formGroup.get('distrito')?.disable();
      this.formGroup.get('domicilioFisico')?.disable();
      this.formGroup.get('paginaWeb')?.disable();
      this.bPc = false;
    }
    this.limpiarCampos();
  }

  limpiarCampos() {
    this.formGroup.get('numeroDocumento')?.setValue('');
    this.formGroup.get('razonSocial')?.setValue('');
    this.formGroup.get('numeroPartida')?.setValue('');
    this.formGroup.get('asientoRegistral')?.setValue('');
    this.formGroup.get('departamento')?.setValue('');
    this.formGroup.get('correoElectronico')?.setValue('');
    this.formGroup.get('numeroCelular')?.setValue('');
    this.formGroup.get("validateSms")?.setValue(false);
    this.formGroup.get("validateEmail")?.setValue(false);
    this.formGroup.get('domicilioFisico')?.setValue('');
    this.formGroup.get('paginaWeb')?.setValue('');
    this.formGroup.get('numeroTelefono')?.setValue('');
    this.uploadedFiles = [];
  }
  desactivarInputsInit(){
    this.formGroup.get('numeroDocumento')?.disable();
    //this.formGroup.get('razonSocial')?.disable();
    //this.formGroup.get('digitoVerificacion')?.disable();
    this.formGroup.get('numeroPartida')?.disable();
    this.formGroup.get('asientoRegistral')?.disable();
    this.formGroup.get('correoElectronico')?.disable();
    this.formGroup.get('numeroCelular')?.disable();
    this.formGroup.get('numeroTelefono')?.disable();
    //this.formGroup.get('ciudadTelefono')?.disable();
    //this.formGroup.get('telefono')?.disable();
    this.formGroup.get('departamento')?.disable();
    this.formGroup.get('provincia')?.disable();
    this.formGroup.get('distrito')?.disable();
    this.formGroup.get('domicilioFisico')?.disable();
    this.formGroup.get('paginaWeb')?.disable();

  }

  activarInputs(){
    this.formGroup.get('numeroDocumento')?.enable();
    //this.formGroup.get('razonSocial')?.enable();
   // this.formGroup.get('digitoVerificacion')?.enable();
    this.formGroup.get('numeroPartida')?.enable();
    this.formGroup.get('asientoRegistral')?.enable();
    this.formGroup.get('files')?.enable();
    this.formGroup.get('correoElectronico')?.enable();
    this.formGroup.get('numeroCelular')?.enable();
    this.formGroup.get('numeroTelefono')?.enable();
    //this.formGroup.get('ciudadTelefono')?.enable();
    //this.formGroup.get('telefono')?.enable();
    this.formGroup.get('departamento')?.enable();
    this.formGroup.get('provincia')?.enable();
    this.formGroup.get('distrito')?.enable();
    this.formGroup.get('domicilioFisico')?.enable();
    this.formGroup.get('paginaWeb')?.enable();
  }


  obtenerCorreo() {
    return this.formGroup.get('correoElectronico')?.value
  }

  get esTipoDocumentoRuc() {
    return this.formGroup?.get('tipoDocumento')?.value == TipoDocumento_RUC
  }


  async cambiarProvincia() {
    this.formGroup.get("provincia")?.reset("");
    this.formGroup.get("distrito")?.reset("");
    // this.formGroup.get("provincia")?.setValue('');
    // this.formGroup.get("distrito")?.setValue('');
    this.provinciaList = [];

    var value  = this.formGroup.get('departamento')?.value.ubdep


    this.provinciaList = await firstValueFrom(this.ubigeoService.getProvinciaList(value))
    this.distritoList = []

  }

  getNumeroDoc(){
    return this.formGroup.get('numeroDocumento')?.value ?? '';
  }

  async cambiarDistrito() {
    this.distritoList = [];
    this.formGroup.get("distrito")?.reset("");
    var valueprovincia = this.formGroup.get('provincia')?.value.ubprv
    var valuedepar = this.formGroup.get('departamento')?.value.ubdep
    this.distritoList = await firstValueFrom(this.ubigeoService.getDistritoList(valuedepar, valueprovincia))
  }

  validarsoloTelefonoFijo(event : any): boolean{
    const charCode = (event.which) ? event.which : event.keyCode;
    const digitVer = this.formGroup.get('numeroTelefono')?.value;
    if(digitVer == " "){
      this.formGroup.get("numeroTelefono")?.setValue("");
    }
    var inp = String.fromCharCode(event.keyCode);
    if (charCode===45){return true;}
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
   }

  validarsoloNumeros(event : any): boolean{
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;

   }

   invalidarDocumento() {
    this.numeroRucValido = false
  }


  validardomicilio(e : any, idInput: string){
    var value = this.formGroup.get('domicilioFisico')?.value;

    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;

    this.formGroup.get('domicilioFisico')?.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
      return true;
   }
  validarEntrada(idInput: string, formGroup: FormGroup, controlName: string, event?: KeyboardEvent): boolean | void {
    const permitido = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9]$/;
    const inputForm = formGroup.get(controlName);
    const value: string = inputForm?.value || '';

    if (event) {
      const inputElement = event.target as HTMLInputElement;
      if (inputElement.selectionStart === 0 && !permitido.test(event.key)) {
        event.preventDefault();
        return false;
      }
    } else {
      if (value.length > 0 && !permitido.test(value.charAt(0))) {
        const nuevoValor = value.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]+/, '');
        inputForm?.setValue(nuevoValor);
        this.renderer.selectRootElement(`#${idInput}`).focus();
      }
    }
  }

   validarPaginaWeb(e : any, idInput: string){
     var value = this.formGroup.get('domicilioFisico')?.value;

     let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
     let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
     if (e.metaKey || e.ctrlKey) {
       return true;
     }
     if(inicio == 0 && e.key === ' ') return false;

     this.formGroup.get('domicilioFisico')?.setValue(value.replace(/ {2,}/g, ' '));
     this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
       return true;
    }



   validarPrimerDigitoRUC(event : any): boolean{
    if(this.formGroup.get('tipoDocumento')?.value === 'RUC') {
    const charCode = (event.which) ? event.which : event.keyCode;
    const numeroDocumento = this.formGroup.get('numeroDocumento')?.value;
    var posicion = event.target.selectionStart;
    var primerdato = numeroDocumento[0];
    var segundodato = numeroDocumento[1];
    if(numeroDocumento != ""){
      if(primerdato != 2  && charCode != 50){
        return false;
      }
      if(segundodato != 0  && charCode != 48){
        return false;
      }
    }
    if(posicion == 0 ){
      if(charCode == 50 ){
        return true;
      }else{
        return false;
      }
    } else if(posicion == 1){
      if(charCode == 48 ){
        return true;
      }else{
        return false;
      }
    } else{
      if( charCode > 31 && (charCode < 48 || charCode > 57)){
        return false;
      }else {
        if(numeroDocumento != ""){
          const numeroDocumento = this.formGroup.get('numeroDocumento')?.value;
          if (!numeroDocumento.toString().startsWith('20')){
            this.formGroup.get('numeroDocumento')?.setValue("");
            return false
          }
        }else{
          return true;
        }
        return true;
      }
    }
    } else {
      return true;
    }
   }
  validarCelular(event : any): boolean{
    const charCode = (event.which) ? event.which : event.keyCode;
    const numCelular = this.formGroup.get('numeroCelular')?.value;
    var posicion = event.target.selectionStart;
    var primerdato = numCelular[0];
    if(numCelular != ""){
      if(primerdato != 9  && charCode != 57)
        return false;
    }
    if(posicion == 0 ){
      if(charCode == 57 ){
        return true;
      }else{
        return false;
      }
    }else{
      if( charCode > 31 && (charCode < 48 || charCode > 57)){
        return false;
      }else {

        if(numCelular != ""){
          if(primerdato != 9  )
            return false;
        }else{
          return true;
        }

        return true;
      }
    }
   }


  ActiveButton():boolean{

    if(this.formGroup.get('validateEmail')?.value == true){
      return true;
    }else{
      if( this.formGroup.get('tipoDocumento')?.invalid ||this.formGroup.get('numeroDocumento')?.invalid || this.formGroup.get('correoElectronico')?.invalid || this.formGroup.get('tipoDocumento')?.value == "-"){
        return true
      }
      else{
        return false;
      }

    }
  }

  ActiveButtonSMS():boolean{
    if(this.formGroup.get('validateSms')?.value == true){
      return true;
    }else{
      if( this.formGroup.get('tipoDocumento')?.invalid ||this.formGroup.get('numeroDocumento')?.invalid || this.formGroup.get('numeroCelular')?.invalid || this.formGroup.get('tipoDocumento')?.value == "-"){
        return true
      }
      else{
        return false;
      }
    }
  }

  async validarCorreoElectronico() {
    this.oneClick = true;
    var validate = await this.executeAction('homeLogin');
    let request = {
      tipoDocumento : this.formGroup.get('tipoDocumento')?.value ,
      numeroDocumento : this.formGroup.get('numeroDocumento')?.value,
      correoElectronico : this.formGroup.get('correoElectronico')?.value.toLowerCase(),
      recaptcha : this.TOkenCaptcha
      }


    this.correoService.envioCorreoVerificacion(request).subscribe(res =>{
      this.oneClick = false;
      if(res){
        Object.assign(request, {personType : 'pj'} )
        const dialogRef = this.dialog.open(SharedDialogComponent, {
          width: "771px",
          height : "434px",
          disableClose: true,
          data: {  idEnvio :res.idEnvio , requestData : request , email : this.formGroup.get('correoElectronico')?.value.toLowerCase()},
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.formGroup.get("validateEmail")?.setValue(result);
          if(result){
            this.formGroup.get('correoElectronico')?.disable();
          }

        });

      } else {
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera : 'Advertencia' ,messages: ['Espere un momento e inténtelo nuevamente']}
        })
      }

    }, error =>{
      this.oneClick = false;
      if(error.error.statusCode == 401){
        const mensajeError = {cabecera : 'No autorizado', messages: [error.error.message]};
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: mensajeError
        }).afterClosed().subscribe(() => {
          window.location.reload();
        });
      }
    })
  }

  async validarNumeroCelular() {
    this.oneClick = true;

    var validate = await this.executeAction('homeLogin');
    var request = {
      tipoDocumento: this.formGroup.get('tipoDocumento')?.value,
      numeroDocumento: this.formGroup.get('numeroDocumento')?.value,
      numeroCelular: this.formGroup.get('numeroCelular')?.value,
      recaptcha: this.TOkenCaptcha
    }

    this.smsService.envioSMSVerificacion(request).subscribe(res => {
      this.oneClick = false;
      if (res) {
        Object.assign(request, {personType: 'pj'})

        const dialogRef = this.dialog.open(SharedDialogComponent, {
          width: "771px",
          height: "434px",
          disableClose: true,
          data: {
            idEnvio: res.idEnvio,
            requestData: request,
            email: null,
            celular: this.formGroup.get('numeroCelular')?.value,
            titleForm: "Validación de número de celular",
            info: "Te hemos enviado un mensaje de texto al número de celular ingresado, ingresa el código de verificación remitido aquí.",
            typeSevice: "SMS"
          },
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.formGroup.get("validateSms")?.setValue(result);
          if (result) {
            this.formGroup.get('numeroCelular')?.disable();
          }
        });
      } else {
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera : 'Advertencia' ,messages: ['Espere un momento e inténtelo nuevamente']}
        })
      }
    }, error => {
      this.oneClick = false;
      if (error.error.statusCode == 401) {
        const mensajeError = {cabecera: 'No autorizado', messages: [error.error.message]};
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: mensajeError
        }).afterClosed().subscribe(() => {
          window.location.reload();
        });
      }
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.formGroup.controls ;
  }

   async validarDocumento() {
    var validate = await this.executeAction('homeLogin');
    // console.log('validando documento',this.maxlength)
    this.loading = true;
    this.buscando = true;

    if(this.getNumeroDoc().length != this.maxlength) return;
    this.formGroup.get('numeroDocumento')?.disable();
    var request : requesGetData = {
      ruc : (this.formGroup.get('numeroDocumento')?.value ?? '') as string,
      recaptcha :this.TOkenCaptcha
    }

    const numeroDocumento = (this.formGroup.get('numeroDocumento')?.value ?? '') as string
    if (this.esTipoDocumentoRuc && numeroDocumento.length == 11) {
     //var res = await firstValueFrom(this.personaJuridicaService.obtenerDatosPersonaJuridica(request))


     this.personaJuridicaService.obtenerDatosPersonaJuridica(request).subscribe(res =>{
      this.numeroRucValido = true;
      if (res.success === true) {
        this.loading = false;
        this.buscando = false;
        this.formGroup.patchValue({
          'razonSocial': res.data.organizationName,
        });
      } else{
        this.loading = false;
        this.buscando = false;
        this.numeroRucValido = false
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera : 'Notificación' ,messages: ['No se encontró la información de la persona jurídica']}
        }).afterClosed().subscribe(() => {
          this.formGroup.get('numeroDocumento')?.setValue('')
          this.formGroup.get('numeroDocumento')?.enable()
        });
        return;
      }
     }, error => {
       this.oneClick = false;
       if (error.error.statusCode == 401) {
         const mensajeError = {cabecera: 'No autorizado', messages: [error.error.message]};
         this.dialog.open(AlertDialogComponent, {
           disableClose: true,
           hasBackdrop: true,
           data: mensajeError
         }).afterClosed().subscribe(() => {
           window.location.reload();
         });
       }
     })
    }
   }


  quitarDobleEspacio(idInput: string, e: any) {

    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;

    switch(idInput){
      case 'razonSocial':
        var value = this.formGroup.get('razonSocial')?.value;
      this.formGroup.get('razonSocial')?.setValue(value.replace(/ {1,}/g, ' ')); break;
    }

    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');

    return true;
  }

   public recentToken = '';
   public recentError?: { error: any };
   private singleExecutionSubscription!: Subscription;
  private executeAction = async (action: string) => {
    return new Promise((resolve) => {
      if (this.singleExecutionSubscription) {
        this.singleExecutionSubscription.unsubscribe();
      }
      this.singleExecutionSubscription = this.reCaptchaV3Service
        .execute(action)
        .subscribe(
          (token) => {
            this.recentToken = token;
            this.recentError = undefined;
            this.TOkenCaptcha = token;
            // console.log("Tocken persona-natural: "+this.TOkenCaptcha);
            this.formGroup.get("recaptchaReactive")?.setValue(this.TOkenCaptcha);
            resolve(true);
          },
          (error) => {
            this.recentToken = '';
            this.TOkenCaptcha = '';
            this.recentError = { error };
            resolve(false);
          }
        );
    });
  };

}
