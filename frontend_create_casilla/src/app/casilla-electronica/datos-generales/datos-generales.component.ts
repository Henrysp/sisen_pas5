import {ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CasillaService} from "../../core/services/casilla.service";
import {Condicion, Condicion_Persona_Juridica, Condicion_Persona_Natural,} from "../../core/dto/documento";
import {MatDialog} from "@angular/material/dialog";
import {PersonaNaturalComponent} from "../persona-natural/persona-natural.component";
import {PersonaJuridicaComponent} from "../persona-juridica/persona-juridica.component";
import {firstValueFrom, Subscription} from "rxjs";
import {ValidarCorreoService} from "../../core/services/validar-correo.service";
import { RequestValidateData } from 'src/app/core/dto/personaNaturalDni';
import { PersonaNaturalService } from 'src/app/core/services/persona-natural.service';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { requestGlobal } from 'src/app/core/dto/request';
import {
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaV3Module,
  ReCaptchaV3Service,
} from 'ng-recaptcha';
import { PersonaJuridicaService } from 'src/app/core/services/persona-juridica.service';
import { RequestValidatePJ, requestValidateRepresentative } from 'src/app/core/dto/personaJuridica';
import { DatosRepresentanteComponent } from '../datos-representante/datos-representante.component';

@Component({
  selector: 'app-datos-generales',
  templateUrl: './datos-generales.component.html',
  styleUrls: ['./datos-generales.component.css']
})
export class DatosGeneralesComponent implements OnInit {


  @ViewChild(PersonaNaturalComponent)  personaNaturalComponent !: PersonaNaturalComponent ;
  @ViewChild(PersonaJuridicaComponent) personaJuridicaComponent!: PersonaJuridicaComponent;
  @ViewChild(DatosRepresentanteComponent) datosRepresentanteComponent !: DatosRepresentanteComponent;

  @Output() completedStep = new EventEmitter<any>();
  @Output() TipoPerson = new EventEmitter<any>();

  formGroup!: FormGroup;
  condicionList: Array<Condicion> = []
  codigoEnviado = false;

  validateRequest : RequestValidateData = new RequestValidateData();
  validateRequesPJ : RequestValidatePJ = new RequestValidatePJ();
  //@ViewChild('myButton') button : any;

  observableRequestSubscription!: Subscription;
  requestSave: requestGlobal = new requestGlobal();
  TOkenCaptcha: string = '';
  bloquearValidar: boolean = true;

  constructor(
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private casillaService: CasillaService,
    private validarCorreoService: ValidarCorreoService,
    private cdr: ChangeDetectorRef,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private personaService : PersonaNaturalService,
    private personaJuridicaService : PersonaJuridicaService

  ) {

    this.observableRequestSubscription = casillaService.casilla$.subscribe(
      (requestSave: requestGlobal) => {
        this.requestSave = requestSave;
        //if (requestSave) this.companyId = requestSave;
      }
    );
  }

  update() {
    this.cdr.detectChanges();
    var data = this.obtenerCondicion();
    this.requestSave.TipoPersona = data;
    this.TipoPerson.emit(data);

  }
  get personaNaturalFormGroup() {
    return this.personaNaturalComponent?.formGroup || null;
  }

  get personaJuridicaFormGroup() {
    return this.personaJuridicaComponent?.formGroup || null;
  }

  get representante() {
    return this.datosRepresentanteComponent?.formGroup || null;
  }

  async ngOnInit() {
    this.formGroup = this.formBuilder.group({
      condicion: ['', Validators.required],
      documentType: [''],
    });
    this.personaNaturalFormGroup;
    this.personaJuridicaFormGroup;
    this.representante;
    this.condicionList = await firstValueFrom(this.casillaService.getCondicionList())
    //console.log("this.condicionList this.condicionList -->",this.condicionList);

    //SOLO PERSONA NATURAL
    this.formGroup.get('condicion')?.setValue(this.condicionList[0].codigo)
    //console.log("condition",this.formGroup.get('condicion')?.value )
    //this.formGroup.controls['condicion'].disable();
    this.update();
  }

  obtenerCondicion() {
    //return Condicion_Persona_Natural
    //todo enable
    return this.formGroup.get('condicion')?.value
  }

  async continuar() {
    this.bloquearValidar = false;
    // this.completedStep.emit();
    var validate = await this.executeAction('homeLogin'); //Poner en true para desarrollo y pruebas
    if(validate){
      this.siguientePaso();
    }else{
      this.bloquearValidar = true;
    }
  }

  siguientePaso() {

    if(this.formGroup.valid){

      // console.log("Tipo Persona PN", this.esPersonaNatural);
      // console.log("Tipo Persona PJ", this.esPersonaJuridica);

      if(this.esPersonaNatural){
        if(this.personaNaturalFormGroup.valid){

          let priDigitoCelular = this.personaNaturalFormGroup.controls['numeroCelular'].value
          var primerdato = priDigitoCelular[0];
          if(primerdato != 9){
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera : 'Validación' ,messages: ['El número de celular debe empezar en 9']}
            });
            this.bloquearValidar = true;
            return;
          }

          if(!this.personaNaturalFormGroup.controls['validateEmail'].value){
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera : 'Validación' ,messages: ['No validó el correo electrónico']}
            });
            this.bloquearValidar = true;
            return;
          }

          if(!this.personaNaturalFormGroup.controls['validateSms'].value){
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera : 'Validación' ,messages: ['No validó el número de celular']}
            });
            this.bloquearValidar = true;
            return;
          }

          this.validateRequest.tipoDocumento = this.personaNaturalFormGroup.controls['tipoDocumento'].value;
          this.validateRequest.dni = this.personaNaturalFormGroup.controls['numeroDocumento'].value;
          this.validateRequest.nroDocumento = this.personaNaturalFormGroup.controls['numeroDocumento'].value;
          this.validateRequest.fechaNacimiento = new Date (this.personaNaturalFormGroup.controls['fechaNacimento'].value);
          this.validateRequest.codigoVerifi = this.personaNaturalFormGroup.controls['digitoVerificacion'].value;
          this.validateRequest.correo = this.personaNaturalFormGroup.controls['correoElectronico'].value;
          this.validateRequest.recaptcha = this.TOkenCaptcha;
          // console.log("request envio", this.validateRequest)

          this.personaService.validarDatosPersona(this.validateRequest).subscribe(res =>{
            if(res.status){

             this.generateRequestNaturalEmit();

            }else{
              this.dialog.open(AlertDialogComponent, {
                disableClose: true,
                hasBackdrop: true,
                data: {cabecera : 'Verifique sus datos' ,messages: [res.mensaje]}
              });
              this.bloquearValidar = true;
              return;
            }

            this.bloquearValidar = true;
          },error => {
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
        }else{
          this.personaNaturalComponent?.formGroup.markAllAsTouched()
        }
      }

      if(this.esPersonaJuridica){
        if(this.personaJuridicaFormGroup.valid){
          if(!this.personaJuridicaFormGroup.controls['validateEmail'].value){
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera : 'Validación' ,messages: ['No validó el correo electrónico']}
            });
            this.bloquearValidar = true;
            return;
          }

          if(!this.personaJuridicaFormGroup.controls['validateSms'].value){
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera : 'Validación' ,messages: ['No validó el número de celular']}
            });
            this.bloquearValidar = true;
            return;
          }

          var departamento  = this.personaJuridicaFormGroup.controls['departamento'].value.ubdep;
          var provincia  = this.personaJuridicaFormGroup.controls['provincia'].value.ubprv;
          var distrito  = this.personaJuridicaFormGroup.controls['distrito'].value.ubdis;

          this.validateRequesPJ.docType = this.personaJuridicaFormGroup.controls['tipoDocumento'].value;
          this.validateRequesPJ.doc = this.personaJuridicaFormGroup.controls['numeroDocumento'].value;
          this.validateRequesPJ.organizationName = this.personaJuridicaFormGroup.controls['razonSocial'].value;
          this.validateRequesPJ.numeroPartida = this.personaJuridicaFormGroup.controls['numeroPartida'].value;
          this.validateRequesPJ.asientoRegistral = this.personaJuridicaFormGroup.controls['asientoRegistral'].value;
          this.validateRequesPJ.email = this.personaJuridicaFormGroup.controls['correoElectronico'].value.toLowerCase();
          this.validateRequesPJ.cellphone = this.personaJuridicaFormGroup.controls['numeroCelular'].value;
          this.validateRequesPJ.telephone = this.personaJuridicaFormGroup.controls['numeroTelefono'].value;
          this.validateRequesPJ.ubigeo =  departamento + "" + provincia + "" + distrito
          this.validateRequesPJ.address = this.personaJuridicaFormGroup.controls['domicilioFisico'].value;
          this.validateRequesPJ.webSite = this.personaJuridicaFormGroup.controls['paginaWeb'].value.toLowerCase();
          this.validateRequesPJ.recaptcha = this.TOkenCaptcha;

          this.validateRequesPJ.files = this.personaJuridicaFormGroup.controls['files'].value;
          // console.log(this.validateRequesPJ);

          this.personaJuridicaService.validarDatosPersonaJuridica(this.validateRequesPJ).subscribe(resp =>{

            if(resp.success){
              this.generateRequestJuridicaEmit();
              this.bloquearValidar = true;
            }else{
              this.dialog.open(AlertDialogComponent, {
                disableClose: true,
                hasBackdrop: true,
                data: {cabecera : 'Verifique sus datos' ,messages: [resp.message]}
              });
              this.bloquearValidar = true;
              return;
            }
          } , error =>{
            if (error.error.statusCode == 401) {
              const mensajeError = {cabecera: 'No autorizado', messages: [error.error.message]};
              this.dialog.open(AlertDialogComponent, {
                disableClose: true,
                hasBackdrop: true,
                data: mensajeError
              }).afterClosed().subscribe(() => {
                window.location.reload();
              });
            }else{
              this.dialog.open(AlertDialogComponent, {
                disableClose: true,
                hasBackdrop: true,
                data: {cabecera: 'Error', messages: ['Error de servicio.']}
              });
              this.bloquearValidar = true;
              return;
            }
          })
        }else{
          this.bloquearValidar = true;
          this.personaJuridicaFormGroup.markAllAsTouched()
        }
      }
    }else{
      this.formGroup.markAllAsTouched();
    }
  }

  validateForms():boolean{

    let retorno = true;


    if(this.formGroup.valid ){

      if(this.esPersonaNatural){
        if(
          this.personaNaturalFormGroup?.valid && this.personaNaturalFormGroup?.controls["nombres"].value != null &&
          (this.personaNaturalFormGroup?.controls["apellidoMaterno"].value != null || this.personaNaturalFormGroup?.controls["apellidoPaterno"].value != null || this.personaNaturalFormGroup?.controls["tipoDocumento"].value != "-") && this.bloquearValidar
        ){
          retorno= false;
        }


      } else{
        if(this.personaJuridicaFormGroup?.valid && this.bloquearValidar){
          retorno= false;
        }
      }

      return retorno;

    }else{
      return true;
    }


  }


  generateRequestJuridicaEmit(){

    this.requestSave.tipoDocumento =this.personaJuridicaFormGroup.controls['tipoDocumento'].value;
    this.requestSave.tipoDocumentoDes = (this.requestSave.tipoDocumento=='PR')?"Partida registral":this.requestSave.tipoDocumento;
    this.requestSave.numeroDocumento = this.personaJuridicaFormGroup.controls['numeroDocumento'].value.trimEnd();
    this.requestSave.numeroDocumento = this.requestSave.numeroDocumento.toUpperCase();
    this.requestSave.razonSocial = this.personaJuridicaFormGroup.controls['razonSocial'].value.toUpperCase();
    this.requestSave.numeroPartida = this.personaJuridicaFormGroup.controls['numeroPartida'].value;
    this.requestSave.numeroPartida = this.requestSave.numeroPartida.toUpperCase();
    this.requestSave.asientoRegistral = this.personaJuridicaFormGroup.controls['asientoRegistral'].value;
    this.requestSave.correoElectronico = this.personaJuridicaFormGroup.controls['correoElectronico'].value.toLowerCase();
    this.requestSave.telefono = this.personaJuridicaFormGroup.controls['numeroTelefono'].value;
    this.requestSave.numeroCelular = this.personaJuridicaFormGroup.controls['numeroCelular'].value;
    this.requestSave.domicilioFisico =  this.personaJuridicaFormGroup.controls['domicilioFisico'].value;
    this.requestSave.paginaWeb = this.personaJuridicaComponent.formGroup.controls['paginaWeb'].value.toLowerCase();
    var departamento  = this.personaJuridicaFormGroup.controls['departamento'].value;
    var provincia  = this.personaJuridicaFormGroup.controls['provincia'].value;
    var distrito  = this.personaJuridicaFormGroup.controls['distrito'].value;

    this.requestSave.departamento = departamento.nodep;
    this.requestSave.provincia = provincia.noprv;
    this.requestSave.distrito = distrito.nodis;
    this.requestSave.fileDocumentPJ = this.personaJuridicaFormGroup.controls['files'].value;


    this.casillaService.setCasilla(this.requestSave);

    this.completedStep.emit();
  }



  generateRequestNaturalEmit(){

    //var apellidos = this.personaNaturalFormGroup.controls['apellidos'].value.split(' ');
    //var apellidoPaterno = this.personaNaturalFormGroup.controls['apellidoPaterno'].value.split(' ');
    //var apellidoMaterno = this.personaNaturalFormGroup.controls['apellidoMaterno'].value.split(' ');
    var tipoDoc = this.personaNaturalFormGroup.controls['tipoDocumento'].value;
    this.requestSave.tipoDocumento = tipoDoc;
    this.requestSave.numeroDocumento = this.personaNaturalFormGroup.controls['numeroDocumento'].value;
    this.requestSave.nombres = this.personaNaturalFormGroup.controls['nombres'].value; this.requestSave.nombres = this.requestSave.nombres.toUpperCase();
    //this.requestSave.apePaterno = apellidos[0];
    //this.requestSave.apeMaterno =  apellidos[1];
    this.requestSave.apePaterno = this.personaNaturalFormGroup.controls['apellidoPaterno'].value; this.requestSave.apePaterno = this.requestSave.apePaterno.toUpperCase();
    this.requestSave.apeMaterno =  this.personaNaturalFormGroup.controls['apellidoMaterno'].value; this.requestSave.apeMaterno = this.requestSave.apeMaterno.toUpperCase();

    this.requestSave.correoElectronico = this.personaNaturalFormGroup.controls['correoElectronico'].value;
    this.requestSave.numeroCelular = this.personaNaturalFormGroup.controls['numeroCelular'].value;
    this.requestSave.telefono = this.personaNaturalFormGroup.controls['numeroTelefono'].value;
    this.requestSave.domicilioFisico =  this.personaNaturalFormGroup.controls['domicilioFisico'].value;

    var departamento  = this.personaNaturalFormGroup.controls['departamento'].value;
    var provincia  = this.personaNaturalFormGroup.controls['provincia'].value;
    var distrito  = this.personaNaturalFormGroup.controls['distrito'].value;

    this.requestSave.departamento = departamento.nodep;
    this.requestSave.provincia = provincia.noprv;
    this.requestSave.distrito = distrito.nodis;
    this.requestSave.recaptcha = this.personaNaturalFormGroup.controls['recaptchaReactive'].value;
    this.requestSave.statusCandidateElectoralProcess = this.personaNaturalFormGroup.controls['statusCandidateElectoralProcess'].value;
    this.requestSave.electoralProcess = this.personaNaturalFormGroup.controls['listElectoralProcess'].value;

    this.casillaService.setCasilla(this.requestSave);

    this.completedStep.emit();
  }

  get esPersonaNatural(): boolean {
    return this.obtenerCondicion() == Condicion_Persona_Natural
  }

  get esPersonaJuridica(): boolean {
    return this.obtenerCondicion() == Condicion_Persona_Juridica
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
           // console.log("Tocken datos-generales: "+this.TOkenCaptcha);
           //this.formGroup.get("recaptchaReactive")?.setValue(this.TOkenCaptcha);
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

  valueDocumentType($event: any){
    this.formGroup.controls['documentType'].setValue($event);
  }
}
