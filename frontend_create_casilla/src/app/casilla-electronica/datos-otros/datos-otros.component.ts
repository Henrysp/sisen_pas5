import { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Cargo, Condicion_Persona_Natural, TipoDocumento, TipoDocumento_CE, TipoDocumento_DNI } from './../../core/dto/documento';
import {Component, OnInit, Output, EventEmitter, ChangeDetectorRef, Renderer2} from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { CasillaService } from 'src/app/core/services/casilla.service';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PersonaNaturalService } from 'src/app/core/services/persona-natural.service';
import { ObtenerDatosPersonaDniDto, PersonaNaturalDni } from 'src/app/core/dto/personaNaturalDni';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { RequestRepresentante, requestGlobal } from 'src/app/core/dto/request';

@Component({
  selector: 'app-datos-otros',
  templateUrl: './datos-otros.component.html',
  styleUrls: ['./datos-otros.component.css']
})
export class DatosOtrosComponent implements OnInit {
  @Output() previousStep = new EventEmitter<any>()
  @Output() completedStep = new EventEmitter<any>()
  TOkenCaptcha: string = '';
  loading: boolean = false;
  blockInput: boolean = true;
  buscando: boolean = false;
  presidente: boolean = false;
  representanteLegalOP: boolean = false;
  perfil_OP: boolean = false;
  formGroup!: FormGroup;
  maxlengtht: number = 8;
  minlengtht: number = 8;
  maxlengthr: number = 8;
  minlengthr: number = 8;
  maxlengthp: number = 8;
  minlengthp: number = 8;
  maxlengtho: number = 8;
  btnTesorero: Boolean | undefined = false;
  btnRepresentante: Boolean | undefined = false;
  btnPresidente: Boolean | undefined = false;
  btnOP: Boolean | undefined = false;
  personaNaturalDni: PersonaNaturalDni | null = null;
  tipoDocumentoList: Array<TipoDocumento> = []
  observableRequestSubscription!: Subscription;
  requestSave: requestGlobal = new requestGlobal();
  requestTesorero: RequestRepresentante = new RequestRepresentante();
  requestRepre: RequestRepresentante = new RequestRepresentante();
  requestPresidente: RequestRepresentante = new RequestRepresentante();
  requestOP: RequestRepresentante = new RequestRepresentante();
  cargoList: any = [
    { id: "3", value: "Tesorero" },
    { id: "4", value: "Representante Legal OP" },
    { id: "5", value: "Presidente" },
    { id: "6", value: "Presidente del OEC" }
  ]

  datosTesorero: string[] = ["apellidoPaternoTesorero", "apellidoMaternoTesorero", "nombresTesorero", "documentoTesorero", "emailTesorero", "emailConfirmacionTesorero", "celularTesorero", "celularConfirmacionTesorero"];
  datosRepresentante: string[] = ["apellidoPaternoRepre", "apellidoMaternoRepre", "nombresRepre", "documentoRepre", "emailRepre", "emailConfirmacionRepre", "celularRepre", "celularConfirmacionRepre","tipoDocumentoRepre"];
  datosPresidente: string[] = ["apellidoPaternoPresi", "apellidoMaternoPresi", "nombresPresi", "documentoPresi", "emailPresi", "emailConfirmacionPresi", "celularPresi", "celularConfirmacionPresi", "tipoDocumentoPresi"];
  datosPerfilOP: string[] = ["apellidoPaternoOP", "apellidoMaternoOP", "nombresOP", "documentoOP", "emailOP", "emailConfirmacionOP", "celularOP", "celularConfirmacionOP", "tipoDocumentoOP"];

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private casillaService: CasillaService,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private personaNaturalService: PersonaNaturalService,
    private renderer: Renderer2,
  ) {
    this.observableRequestSubscription = casillaService.casilla$.subscribe(
      (requestSave: requestGlobal) => {
        this.requestSave = requestSave;
      }
    );
  }

  ngOnInit() {
    this.createForm();
    this.validators();
    this.tipoDocumentos();
  }

  async tipoDocumentos(){
    this.tipoDocumentoList = await firstValueFrom(this.casillaService.getTipoDocumentoList(Condicion_Persona_Natural))
  }

  createForm(){
    this.formGroup = this.formBuilder.group({
      cargoTesorero: [{value: this.cargoList[0], disabled: true}],
      tipoDocumentoTesorero: ['', Validators.required],
      documentoTesorero: [{value:"", disabled: true}, [Validators.required]],
      apellidoPaternoTesorero: [{value:"", disabled: true}, [Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      apellidoMaternoTesorero: [{value:"", disabled: true}, [Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      nombresTesorero: [{value:"", disabled: true}, [Validators.required, Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      emailTesorero: [{value:"", disabled: true}, [Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      emailConfirmacionTesorero: [{value:"", disabled: true}, [ Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      celularTesorero: [{value:"", disabled: true}, Validators.required],
      celularConfirmacionTesorero: [{value:"", disabled: true}, Validators.required],

      cargoRepre: [{value:this.cargoList[1], disabled: true}],
      tipoDocumentoRepre: [''],
      documentoRepre: [{value:"", disabled: true}],
      apellidoPaternoRepre: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      apellidoMaternoRepre: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      nombresRepre: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      emailRepre: [{value:"", disabled: true}, [ Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      emailConfirmacionRepre: [{value:"", disabled: true}, [ Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      celularRepre: [{value:"", disabled: true}, Validators.required],
      celularConfirmacionRepre: [{value:"", disabled: true}, Validators.required],

      cargoPresi: [{value:this.cargoList[2], disabled: true}],
      tipoDocumentoPresi: [''],
      documentoPresi: [{value:"", disabled: true}],
      apellidoPaternoPresi: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      apellidoMaternoPresi: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      nombresPresi: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      emailPresi: [{value:"", disabled: true}, [ Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')] ],
      //emailPresi: [{value:"", disabled: true}, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')],
      emailConfirmacionPresi: [{value:"", disabled: true}, [ Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')] ],
      //emailConfirmacionPresi: [{value:"", disabled: true}, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')],
      celularPresi: [{value:"", disabled: true}, Validators.required],
      celularConfirmacionPresi: [{value:"", disabled: true}, Validators.required],

      cargoOP: [{value:this.cargoList[3], disabled: true}],
      tipoDocumentoOP: [''],
      documentoOP: [{value:"", disabled: true}],
      apellidoPaternoOP: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      apellidoMaternoOP: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      nombresOP: [{value:"", disabled: true},[Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      emailOP: [{value:"", disabled: true}, [ Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      emailConfirmacionOP: [{value:"", disabled: true}, [ Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      celularOP: [{value:"", disabled: true}, Validators.required],
      celularConfirmacionOP: [{value:"", disabled: true}, Validators.required],
    }, { validators: this.apellidoRequerido.bind(this) });
}
  apellidoRequerido(formGroup: FormGroup) {
    const grupos: [string, string][] = [
      ['apellidoPaternoTesorero', 'apellidoMaternoTesorero'],
      this.representanteLegalOP ? ['apellidoPaternoRepre', 'apellidoMaternoRepre'] : null,
      this.presidente ? ['apellidoPaternoPresi', 'apellidoMaternoPresi'] : null,
      this.perfil_OP ? ['apellidoPaternoOP', 'apellidoMaternoOP'] : null
    ].filter((grupo): grupo is [string, string] => grupo !== null);

    for (const [paterno, materno] of grupos) {
      const tieneApellido =
        formGroup.get(paterno)?.value?.trim() ||
        formGroup.get(materno)?.value?.trim();

      if (!tieneApellido) {
        return { apellidoRequerido: true };
      }
    }

    return null;
  }
  validators(){
    this.formGroup.get('emailConfirmacionTesorero')?.setValidators([Validators.required, this.passwordValidator("emailTesorero", "emailConfirmacionTesorero")]);
    this.formGroup.get('celularConfirmacionTesorero')?.setValidators([Validators.required, this.passwordValidator("celularTesorero", "celularConfirmacionTesorero")]);
    this.formGroup.get('emailConfirmacionRepre')?.setValidators([Validators.required, this.passwordValidator("emailRepre", "emailConfirmacionRepre")]);
    this.formGroup.get('celularConfirmacionRepre')?.setValidators([Validators.required, this.passwordValidator("celularRepre", "celularConfirmacionRepre")]);
    this.presidente = false;
  }

  tipoDocumento(event: any, campo: string){
    let value = event.target.value;
    let nombre: string = '';
    let parteno: string = '';
    let materno: string = '';
    let email: string = '';
    let confirmEmail: string = '';
    let celular: string = '';
    let confirmCelular: string = '';
    this.cdr.detectChanges();
    if(campo === 'documentoTesorero'){
      parteno = this.datosTesorero[0];
      materno = this.datosTesorero[1];
      nombre = this.datosTesorero[2];
      email = this.datosTesorero[4];
      confirmEmail = this.datosTesorero[5];
      celular = this.datosTesorero[6];
      confirmCelular = this.datosTesorero[7];
      this.maxlengtht = (value === TipoDocumento_DNI) ? 8: 9;
      this.maxlengtht = (value === TipoDocumento_DNI) ? 8: 9;
    } else if(campo === 'documentoRepre'){
      parteno = this.datosRepresentante[0];
      materno = this.datosRepresentante[1];
      nombre = this.datosRepresentante[2];
      email = this.datosRepresentante[4];
      confirmEmail = this.datosRepresentante[5];
      celular = this.datosRepresentante[6];
      confirmCelular = this.datosRepresentante[7];
      this.maxlengthr = (value === TipoDocumento_DNI) ? 8: 9;
      this.maxlengthr = (value === TipoDocumento_DNI) ? 8: 9;
    } else if(campo === 'documentoPresi'){
      parteno = this.datosPresidente[0];
      materno = this.datosPresidente[1];
      nombre = this.datosPresidente[2];
      email = this.datosPresidente[4];
      confirmEmail = this.datosPresidente[5];
      celular = this.datosPresidente[6];
      confirmCelular = this.datosPresidente[7];
      this.maxlengthp = (value === TipoDocumento_DNI) ? 8: 9;
      this.maxlengthp = (value === TipoDocumento_DNI) ? 8: 9;
    } else if(campo === 'documentoOP') {
      parteno = this.datosPerfilOP[0];
      materno = this.datosPerfilOP[1];
      nombre = this.datosPerfilOP[2];
      email = this.datosPerfilOP[4];
      confirmEmail = this.datosPerfilOP[5];
      celular = this.datosPerfilOP[6];
      confirmCelular = this.datosPerfilOP[7];
      this.maxlengtho = (value === TipoDocumento_DNI) ? 8 : 9;
      this.maxlengtho = (value === TipoDocumento_DNI) ? 8 : 9;
    }
    if(value !== ''){
      this.formGroup.get(campo)?.enable();
      if (value === TipoDocumento_DNI) {
        this.formGroup.get(nombre)?.disable();
        this.formGroup.get(parteno)?.disable();
        this.formGroup.get(materno)?.disable();
        this.formGroup.get(campo)?.enable();
        this.formGroup.get(campo)?.setValue("");
        this.formGroup.get(campo)?.setValidators([Validators.minLength(8), Validators.maxLength(8)]);
        this.formGroup.get(campo)?.updateValueAndValidity();
        this.activarInputs(email,confirmEmail,celular,confirmCelular);
      }else if (value === TipoDocumento_CE) {
        this.formGroup.get(nombre)?.enable();
        this.formGroup.get(parteno)?.enable();
        this.formGroup.get(materno)?.enable();
        this.formGroup.get(campo)?.enable();
        this.formGroup.get(campo)?.setValue("");
        this.formGroup.get(campo)?.setValidators([Validators.minLength(9), Validators.maxLength(9)]);
        this.formGroup.get(campo)?.updateValueAndValidity();
        this.activarInputs(email,confirmEmail,celular,confirmCelular);
      }
    }else{
      this.formGroup.get(nombre)?.disable();
      this.formGroup.get(parteno)?.disable();
      this.formGroup.get(materno)?.disable();
      this.formGroup.get(campo)?.disable();
      this.formGroup.get(campo)?.setValue("");
      this.formGroup.get(campo)?.updateValueAndValidity();
      this.formGroup.get(email)?.setValue("")
      this.formGroup.get(email)?.disable();
      this.formGroup.get(confirmEmail)?.setValue("");
      this.formGroup.get(confirmEmail)?.disable();
      this.formGroup.get(celular)?.setValue("");
      this.formGroup.get(celular)?.disable();
      this.formGroup.get(confirmCelular)?.setValue("");
      this.formGroup.get(confirmCelular)?.disable();
    }
    this.formGroup.get(nombre)?.setValue("");
    this.formGroup.get(nombre)?.updateValueAndValidity();
    this.formGroup.get(parteno)?.setValue("");
    this.formGroup.get(parteno)?.updateValueAndValidity();
    this.formGroup.get(materno)?.setValue("");
    this.formGroup.get(materno)?.updateValueAndValidity();
    this.btnTesorero = false;
    this.btnRepresentante = false;
    this.btnPresidente = false;
    this.btnOP = false;
}
  activarInputs(email: string, confirmEmail: string,celular: string,confirmCelular: string) {
        this.formGroup.get(email)?.enable();
        this.formGroup.get(email)?.setValue("")
        this.formGroup.get(confirmEmail)?.enable();
        this.formGroup.get(confirmEmail)?.setValue("");
        this.formGroup.get(celular)?.enable();
        this.formGroup.get(celular)?.setValue("");
        this.formGroup.get(confirmCelular)?.enable();
        this.formGroup.get(confirmCelular)?.setValue("");
  }
  agregarPresidente(){
    this.presidente = !this.presidente; // true -> fistTime
    this.UpdateForm(this.presidente, this.datosPresidente);
    // this.desactivarFom(this.presidente);
    // this.tipoDocumento(event,'documentoPresi');
    // this.formGroup.get('tipoDocumentoPresi')?.setValue("");
  }
  agregarRepresentanteLegalOP(){
    this.representanteLegalOP = !this.representanteLegalOP;
    this.UpdateForm(this.representanteLegalOP, this.datosRepresentante);
    // this.UpdateFormRepLegalOP(this.representanteLegalOP);
    // this.tipoDocumento(event,'documentoRepre');
    // // this.formGroup.get('tipoDocumentoRepre')?.reset();
    // this.formGroup.get('tipoDocumentoRepre')?.setValue("");
  }
  agregarPerfilOP(){
    this.perfil_OP = !this.perfil_OP;
    this.UpdateForm(this.perfil_OP, this.datosPerfilOP);
    // this.tipoDocumento(event,'documentoPresi');
    // this.formGroup.get('tipoDocumentoPresi')?.setValue("");
  }
  get f(): { [key: string]: AbstractControl } {
    return this.formGroup.controls;
  }

  //documento
  getNumeroDoc(campo:string) {
    return this.formGroup.get(campo)?.value ?? '';
  }

  //tipoDocumento
  getTipoDocumentoDni(campo:string) {
    return this.formGroup?.get(campo)?.value == TipoDocumento_DNI
  }

  //numeroDocumento , tipoDocumento
  activarBoton(campo: string, campo1: string){
    if(this.getNumeroDoc(campo).length == 8 && this.getTipoDocumentoDni(campo1)){
      if(campo === 'documentoTesorero'){
        this.btnTesorero = true;
      } else if(campo === 'documentoRepre'){
        this.btnRepresentante = true;
      } else if(campo === 'documentoPresi'){
        this.btnPresidente = true;
      } else if(campo === 'documentoOP'){
        this.btnOP = true;
      }
    }else if(this.formGroup?.get(campo1)?.value == TipoDocumento_CE){
      const ce = (this.formGroup.get(campo)?.value ?? '') as string;
      //Se removio validacion de DNI a petición del usuario.
      /*if(ce && !this.validaDocumento(ce, campo)){
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera: 'Error', messages: ['El documento ya se encuentra registrado en otro cargo']}
        });
        this.formGroup.get(campo)?.setValue('');
      }*/
    }
  }

  async validarDocumento(campo:string, campo1:string) {
    //numeroDocumento , tipoDocumento
    if (this.getNumeroDoc(campo).length != 8) return;

    let nombre: string;
    let parteno: string;
    let materno: string;

    if(campo === 'documentoTesorero'){
      parteno = this.datosTesorero[0];
      materno = this.datosTesorero[1];
      nombre = this.datosTesorero[2];
    } else if(campo === 'documentoRepre'){
      parteno = this.datosRepresentante[0];
      materno = this.datosRepresentante[1];
      nombre = this.datosRepresentante[2];
    } else if(campo === 'documentoPresi'){
      parteno = this.datosPresidente[0];
      materno = this.datosPresidente[1];
      nombre = this.datosPresidente[2];
    } else if(campo === 'documentoOP'){
      parteno = this.datosPerfilOP[0];
      materno = this.datosPerfilOP[1];
      nombre = this.datosPerfilOP[2];
    }
    this.loading = true;
    this.buscando = true;
    this.formGroup.get(campo)?.disable();
    const numeroDocumento = (this.formGroup.get(campo)?.value ?? '') as string
    if (this.getTipoDocumentoDni(campo1) && numeroDocumento.length == 8) {

      var validate = await this.executeAction('homeLogin'); //  poner en true para desarrollo

      if (validate) {
        let envio: ObtenerDatosPersonaDniDto = new ObtenerDatosPersonaDniDto();
        envio.dni = numeroDocumento;
        envio.recaptcha = this.TOkenCaptcha;

        this.personaNaturalService.obtenerDatosPersona(envio).subscribe(res => {
          if (res) {
            //Se removio validacion de DNI a petición del usuario.
            // if(!this.validaDocumento(envio.dni, campo)){
            //   this.dialog.open(AlertDialogComponent, {
            //     disableClose: true,
            //     hasBackdrop: true,
            //     data: {cabecera: 'Error', messages: ['El documento ya se encuentra registrado en otro cargo']}
            //   });
            //   this.loading = false;
            //   this.buscando = false;
            //   this.formGroup.get(campo)?.enable();
            //   this.formGroup.get(campo)?.setValue('');
            //   this.btnTesorero = this.btnRepresentante = this.btnPresidente = false;
            //   return;
            // }
            this.personaNaturalDni = res;
            if (this.personaNaturalDni.nombres !== null && (this.personaNaturalDni.apellidoPaterno !== null || this.personaNaturalDni.apellidoMaterno !== null)) {
              this.formGroup.get(nombre)?.setValue(this.personaNaturalDni.nombres.trimRight());
              this.formGroup.get(materno)?.setValue(this.personaNaturalDni.apellidoMaterno ? this.personaNaturalDni.apellidoMaterno.trimRight() : this.formGroup.get(materno)?.value);
              this.formGroup.get(parteno)?.setValue(this.personaNaturalDni.apellidoPaterno ? this.personaNaturalDni.apellidoPaterno.trimRight() : this.formGroup.get(parteno)?.value);
              this.loading = false;
              this.buscando = false;
              this.blockInput = false;
              this.btnTesorero = this.btnRepresentante = this.btnPresidente = this.btnOP = false;
            }else{
              this.blockInput = true;
              this.loading = false;
              this.formGroup.get(campo)?.enable();
              let mensajeError = {cabecera : 'Advertencia', messages: ['Error al obtener información.']};
              this.dialog.open(AlertDialogComponent, {
                disableClose: true,
                hasBackdrop: true,
                data: mensajeError
              });
              return;
            }
          } else {
            this.blockInput = true;
            this.loading = false;
            this.btnTesorero = this.btnRepresentante = this.btnPresidente = this.btnOP = false;
            this.formGroup.get(campo)?.enable();
            this.formGroup.get(campo1)?.enable();
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera: 'Error', messages: ['No hubo respuesta, intente nuevamente en unos momentos.']}
            });
            return;
          }

        }, error => {
          let mensajeError = {cabecera: 'Advertencia', messages: ['Error al obtener información.']};
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
          if (error.error.statusCode == 404) {
            this.personaNaturalService.obtenerDatosPersonaDb(envio).subscribe(res1 => {
              if (res1) {
                this.personaNaturalDni = res1;
                this.formGroup.get(nombre)?.setValue(this.personaNaturalDni.nombres.trimRight());
                this.formGroup.get(nombre)?.setValue(this.personaNaturalDni.nombres.trimRight());
                this.formGroup.get(materno)?.setValue(this.personaNaturalDni.apellidoMaterno.trimRight());
                this.formGroup.get(parteno)?.setValue(this.personaNaturalDni.apellidoPaterno.trimRight());
                this.loading = false;
                this.buscando = false;
                this.blockInput = false;
                this.btnTesorero = this.btnRepresentante = this.btnPresidente = this.btnOP = false;
              } else {
                this.blockInput = true;
                this.loading = false;
                this.btnTesorero = this.btnRepresentante = this.btnPresidente = this.btnOP = false;
                this.formGroup.get(campo)?.enable();
                this.formGroup.get(campo1)?.enable();
                this.dialog.open(AlertDialogComponent, {
                  disableClose: true,
                  hasBackdrop: true,
                  data: {cabecera: 'Error', messages: ['No hubo respuesta, intente nuevamente en unos momentos.']}
                });
              }
            }, (error) => {
              if (error.error.statusCode == 401) {
                mensajeError = {cabecera: 'No autorizado', messages: [error.error.message]};
              }
              if (error.error.statusCode == 404) {
                mensajeError = {
                  cabecera: 'Verifica si tu número de DNI ingresado es correcto.',
                  messages: ["En caso sea correcto, te invitamos a presentar tu Solicitud mediante Mesa de Partes Virtual (Ingrese <a href='https://www.web.onpe.gob.pe/mpve' target='_blank'>aquí</a>)<br/> o Física presentando el Formulario de Solicitud de Asignación de Casilla Electrónica (descargué <a href='assets/docs/Solicitud-asignacion-casilla-electronica.pdf' download='Solicitud-asignacion-casilla-electronica.pdf'>aquí</a>)."]
                };
                this.blockInput = true;
                this.loading = false;
                this.btnTesorero = this.btnRepresentante = this.btnPresidente = this.btnOP = false;
                this.formGroup.get(campo)?.enable();
                this.formGroup.get(campo1)?.enable();
                this.dialog.open(AlertDialogComponent, {
                  disableClose: true,
                  hasBackdrop: true,
                  data: mensajeError
                });
              }
            })
          }
        })

      } else {
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera: 'Error', messages: ['No hubo respuesta, intente nuevamente en unos momentos.']}
        });
        this.loading = false;
        this.buscando = false;
        return;
      }
    }
  }

  private validaDocumento(dni: string, campo: string){
    let dniRepre = this.requestSave.representante.doc;
    // console.log(this.formGroup.controls['documentoTesorero'].value);
    // console.log(this.formGroup.controls['documentoRepre'].value);
    // console.log(this.formGroup.controls['documentoPresi'].value);
    if(dni === dniRepre){
      return false;
    }
    if(campo !== 'documentoTesorero'){
      if(dni === this.formGroup.controls['documentoTesorero'].value){
        return false;
      }
    }
    if(campo !== 'documentoRepre'){
      if(dni === this.formGroup.controls['documentoRepre'].value){
        return false;
      }
    }
    if(campo !== 'documentoPresi'){
      if(dni === this.formGroup.controls['documentoPresi'].value){
        return false;
      }
    }
    if(campo !== 'documentoOP'){
      if(dni === this.formGroup.controls['documentoOP'].value){
        return false;
      }
    }
    return true;
  }

  validarEmail(campo: string, campo1: string){
    //Se removió validación de correos repetidos a petición del usuario.
    /*/let bError = true;
    const email = this.formGroup.controls[campo].value.toLowerCase();
    const emailGeneral = this.requestSave.correoElectronico.toLowerCase();
    console.log(email);
    console.log(emailGeneral);
    if(email === emailGeneral){
      bError = false;
    }
    let emailRepre = this.requestSave.representante.email.toLowerCase();
    if(email === emailRepre){
      bError = false;
    }
    if(campo !== 'emailTesorero'){
      const emailTesorero = this.formGroup.controls['emailTesorero'].value.toLowerCase();
      if(email === emailTesorero && emailTesorero !== ''){
        bError = false;
      }
    }
    if(campo !== 'emailRepre'){
      const emailRepre = this.formGroup.controls['emailRepre'].value.toLowerCase();
      if(email === emailRepre && emailRepre !== ''){
        bError = false;
      }
    }
    if(campo !== 'emailPresi'){
      const emailPresi = this.formGroup.controls['emailPresi'].value.toLowerCase();
      if(email === emailPresi && emailPresi !== ''){
        bError = false;
      }
    }
    if(!bError){
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera: 'Error', messages: ['El correo electronico ya se encuentra registrado en otro cargo']}
      });
      this.formGroup.get(campo)?.setValue('');
      this.formGroup.get(campo1)?.setValue('');
    }*/
  }

  validaCelular(event: any, campo: string): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    const numCelular = this.formGroup.get(campo)?.value;
    var posicion = event.target.selectionStart;
    var primerdato = numCelular[0];
    if (numCelular != "") {
      if (primerdato != 9 && charCode != 57)
        return false;
    }
    if (posicion == 0) {
      if (charCode == 57) {
        return true;
      } else {
        return false;
      }
    } else {
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      } else {
        if (numCelular != "") {
          if (primerdato != 9)
            return false;
        } else {
          return true;
        }
        return true;
      }
    }
  }

  validarCelular(campo: string, campo1: string){
    //Se removio validación de celular repetido  a solicitud del usuario.
    /*let bError = true;
    const celular = this.formGroup.controls[campo].value
    const celularGeneral = this.requestSave.numeroCelular;
    if(celular === celularGeneral){
      bError = false;
    }
    let celularRepre = this.requestSave.representante.cellphone;
    if(celular === celularRepre){
      bError = false;
    }
    if(campo !== 'celularTesorero'){
      const celularTesorero = this.formGroup.controls['celularTesorero'].value;
      if(celular === celularTesorero && celularTesorero !== ''){
        bError = false;
      }
    }
    if(campo !== 'celularRepre'){
      const celulaRepre = this.formGroup.controls['celularRepre'].value;
      if(celular === celulaRepre && celulaRepre !== ''){
        bError = false;
      }
    }
    if(campo !== 'celularPresi'){
      const celularPresi = this.formGroup.controls['celularPresi'].value;
      if(celular === celularPresi && celularPresi !== ''){
        bError = false;
      }
    }
    if(!bError){
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera: 'Error', messages: ['El numero de celular ya se encuentra registrado en otro cargo']}
      });
      this.formGroup.get(campo)?.setValue('');
      this.formGroup.get(campo1)?.setValue('');
    }*/
  }

  limpiarCampos(campo: string){
    this.formGroup.get(campo)?.setValue('');
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
            // console.log("Tocken persona-natural: " + this.TOkenCaptcha);
            this.formGroup.get("recaptchaReactive")?.setValue(this.TOkenCaptcha);
            resolve(true);
          },
          (error) => {
            this.recentToken = '';
            this.TOkenCaptcha = '';
            this.recentError = {error};
            resolve(false);
          }
        );
    });
  };

  public passwordValidator(campo: string, campo1: string): ValidatorFn {
    return () => {
      const password = this.formGroup.get(campo)?.value;
      const repeat_password = this.formGroup.get(campo1)?.value;
      if(!password || !repeat_password) return { isValid: false };
      if(password!==repeat_password) return {isValid:false};
      return null;
    };
  }

  desactivarFom(cargo: boolean){
    // console.log('El cargo es :', cargo);
    this.cdr.detectChanges();
    if(cargo){ // Crea las validaciones
      this.formGroup.get('tipoDocumentoPresi')?.setValue("");
      this.formGroup.get('tipoDocumentoPresi')?.setValidators(Validators.required);
      this.formGroup.get('tipoDocumentoPresi')?.updateValueAndValidity();
      this.formGroup.get('documentoPresi')?.setValue("");
      this.formGroup.get('documentoPresi')?.setValidators(Validators.required);
      this.formGroup.get('documentoPresi')?.updateValueAndValidity();
      this.formGroup.get('apellidoPaternoPresi')?.setValue("");
      this.formGroup.get('apellidoPaternoPresi')?.setValidators(Validators.required);
      this.formGroup.get('apellidoPaternoPresi')?.updateValueAndValidity();
      this.formGroup.get('apellidoMaternoPresi')?.setValue("");
      this.formGroup.get('apellidoMaternoPresi')?.setValidators(Validators.required);
      this.formGroup.get('apellidoMaternoPresi')?.updateValueAndValidity();
      this.formGroup.get('nombresPresi')?.setValue("");
      this.formGroup.get('nombresPresi')?.setValidators(Validators.required);
      this.formGroup.get('nombresPresi')?.updateValueAndValidity();
      this.formGroup.get('emailPresi')?.setValue("");
      this.formGroup.get('emailPresi')?.setValidators([Validators.required, Validators.email,Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
      this.formGroup.get('emailPresi')?.updateValueAndValidity();
      this.formGroup.get('emailConfirmacionPresi')?.setValue("");
      this.formGroup.get('emailConfirmacionPresi')?.setValidators([Validators.required, Validators.email,Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}'), this.passwordValidator("emailPresi", "emailConfirmacionPresi")]);
      this.formGroup.get('emailConfirmacionPresi')?.updateValueAndValidity();
      this.formGroup.get('celularPresi')?.setValue("");
      this.formGroup.get('celularPresi')?.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(9)]);
      this.formGroup.get('celularPresi')?.updateValueAndValidity();
      this.formGroup.get('celularConfirmacionPresi')?.setValue("");
      this.formGroup.get('celularConfirmacionPresi')?.setValidators([Validators.required, this.passwordValidator("celularPresi", "celularConfirmacionPresi")]);
      this.formGroup.get('celularConfirmacionPresi')?.updateValueAndValidity();
    }else{ // Elimina las validaciones
      this.formGroup.get('tipoDocumentoPresi')?.clearValidators();
      this.formGroup.get('tipoDocumentoPresi')?.updateValueAndValidity();
      this.formGroup.get('documentoPresi')?.clearValidators();
      this.formGroup.get('documentoPresi')?.updateValueAndValidity();
      this.formGroup.get('apellidoPaternoPresi')?.clearValidators();
      this.formGroup.get('apellidoPaternoPresi')?.updateValueAndValidity();
      this.formGroup.get('apellidoMaternoPresi')?.clearValidators();
      this.formGroup.get('apellidoMaternoPresi')?.updateValueAndValidity();
      this.formGroup.get('nombresPresi')?.clearValidators();
      this.formGroup.get('nombresPresi')?.updateValueAndValidity();
      this.formGroup.get('emailPresi')?.clearValidators();
      this.formGroup.get('emailPresi')?.updateValueAndValidity();
      this.formGroup.get('emailConfirmacionPresi')?.clearValidators();
      this.formGroup.get('emailConfirmacionPresi')?.updateValueAndValidity();
      this.formGroup.get('celularPresi')?.clearValidators();
      this.formGroup.get('celularPresi')?.updateValueAndValidity();
      this.formGroup.get('celularConfirmacionPresi')?.clearValidators();
      this.formGroup.get('celularConfirmacionPresi')?.updateValueAndValidity();
    }
  }

  UpdateFormRepLegalOP(showState: boolean){
    // console.log('El showState es :', showState);
    this.cdr.detectChanges();
    if(showState){ // Crea las validaciones
      this.formGroup.get('tipoDocumentoRepre')?.setValue("");
      this.formGroup.get('tipoDocumentoRepre')?.setValidators(Validators.required);
      this.formGroup.get('tipoDocumentoRepre')?.updateValueAndValidity();
      this.formGroup.get('documentoRepre')?.setValue("");
      this.formGroup.get('documentoRepre')?.setValidators(Validators.required);
      this.formGroup.get('documentoRepre')?.updateValueAndValidity();
      this.formGroup.get('apellidoPaternoRepre')?.setValue("");
      this.formGroup.get('apellidoPaternoRepre')?.setValidators(Validators.required);
      this.formGroup.get('apellidoPaternoRepre')?.updateValueAndValidity();
      this.formGroup.get('apellidoMaternoRepre')?.setValue("");
      this.formGroup.get('apellidoMaternoRepre')?.setValidators(Validators.required);
      this.formGroup.get('apellidoMaternoRepre')?.updateValueAndValidity();
      this.formGroup.get('nombresRepre')?.setValue("");
      this.formGroup.get('nombresRepre')?.setValidators(Validators.required);
      this.formGroup.get('nombresRepre')?.updateValueAndValidity();
      this.formGroup.get('emailRepre')?.setValue("");
      this.formGroup.get('emailRepre')?.setValidators([Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
      this.formGroup.get('emailRepre')?.updateValueAndValidity();
      this.formGroup.get('emailConfirmacionRepre')?.setValue("");
      this.formGroup.get('emailConfirmacionRepre')?.setValidators([Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}'), this.passwordValidator("emailRepre", "emailConfirmacionRepre")]);
      this.formGroup.get('emailConfirmacionRepre')?.updateValueAndValidity();
      this.formGroup.get('celularRepre')?.setValue("");
      this.formGroup.get('celularRepre')?.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(9)]);
      this.formGroup.get('celularRepre')?.updateValueAndValidity();
      this.formGroup.get('celularConfirmacionRepre')?.setValue("");
      this.formGroup.get('celularConfirmacionRepre')?.setValidators([Validators.required, this.passwordValidator("celularRepre", "celularConfirmacionRepre")]);
      this.formGroup.get('celularConfirmacionRepre')?.updateValueAndValidity();
    }else{ // Elimina las validaciones
      this.formGroup.get('tipoDocumentoRepre')?.clearValidators();
      this.formGroup.get('tipoDocumentoRepre')?.updateValueAndValidity();
      this.formGroup.get('documentoRepre')?.clearValidators();
      this.formGroup.get('documentoRepre')?.updateValueAndValidity();
      this.formGroup.get('apellidoPaternoRepre')?.clearValidators();
      this.formGroup.get('apellidoPaternoRepre')?.updateValueAndValidity();
      this.formGroup.get('apellidoMaternoRepre')?.clearValidators();
      this.formGroup.get('apellidoMaternoRepre')?.updateValueAndValidity();
      this.formGroup.get('nombresRepre')?.clearValidators();
      this.formGroup.get('nombresRepre')?.updateValueAndValidity();
      this.formGroup.get('emailRepre')?.clearValidators();
      this.formGroup.get('emailRepre')?.updateValueAndValidity();
      this.formGroup.get('emailConfirmacionRepre')?.clearValidators();
      this.formGroup.get('emailConfirmacionRepre')?.updateValueAndValidity();
      this.formGroup.get('celularRepre')?.clearValidators();
      this.formGroup.get('celularRepre')?.updateValueAndValidity();
      this.formGroup.get('celularConfirmacionRepre')?.clearValidators();
      this.formGroup.get('celularConfirmacionRepre')?.updateValueAndValidity();
    }
  }
  UpdateForm(value: boolean, cargo: any){
    // console.log('Se activa :', value);
    // console.log('El cargo es :', cargo);
    this.cdr.detectChanges();
    if(value){ // Crea las validaciones
      this.formGroup.get(cargo[0])?.setValue("");
      // this.formGroup.get(cargo[0])?.setValidators(Validators.required);
      this.formGroup.get(cargo[0])?.updateValueAndValidity();
      this.formGroup.get(cargo[1])?.setValue("");
      // this.formGroup.get(cargo[1])?.setValidators(Validators.required);
      this.formGroup.get(cargo[1])?.updateValueAndValidity();
      this.formGroup.get(cargo[2])?.setValue("");
      this.formGroup.get(cargo[2])?.addValidators([Validators.required, Validators.minLength( 2)]);
      this.formGroup.get(cargo[2])?.updateValueAndValidity();
      this.formGroup.get(cargo[3])?.setValue("");
      this.formGroup.get(cargo[3])?.setValidators(Validators.required);
      this.formGroup.get(cargo[3])?.updateValueAndValidity();
      this.formGroup.get(cargo[4])?.setValue("");
      this.formGroup.get(cargo[4])?.setValidators([Validators.required, Validators.email,Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
      this.formGroup.get(cargo[4])?.updateValueAndValidity();
      this.formGroup.get(cargo[5])?.setValue("");
      this.formGroup.get(cargo[5])?.setValidators([Validators.required, Validators.email,Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}'), this.passwordValidator(cargo[4], cargo[5])]);
      this.formGroup.get(cargo[5])?.updateValueAndValidity();
      this.formGroup.get(cargo[6])?.setValue("");
      this.formGroup.get(cargo[6])?.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(9)]);
      this.formGroup.get(cargo[6])?.updateValueAndValidity();
      this.formGroup.get(cargo[7])?.setValue("");
      this.formGroup.get(cargo[7])?.setValidators([Validators.required, this.passwordValidator(cargo[6], cargo[7])]);
      this.formGroup.get(cargo[7])?.updateValueAndValidity();
      this.formGroup.get(cargo[8])?.setValue("");
      this.formGroup.get(cargo[8])?.setValidators(Validators.required);
      this.formGroup.get(cargo[8])?.updateValueAndValidity();
    }else{// Elimina las validaciones
      this.formGroup.get(cargo[0])?.clearValidators();
      this.formGroup.get(cargo[0])?.updateValueAndValidity();
      this.formGroup.get(cargo[1])?.clearValidators();
      this.formGroup.get(cargo[1])?.updateValueAndValidity();
      this.formGroup.get(cargo[2])?.clearValidators();
      this.formGroup.get(cargo[2])?.updateValueAndValidity();
      this.formGroup.get(cargo[3])?.clearValidators();
      this.formGroup.get(cargo[3])?.updateValueAndValidity();
      this.formGroup.get(cargo[4])?.clearValidators();
      this.formGroup.get(cargo[4])?.updateValueAndValidity();
      this.formGroup.get(cargo[5])?.clearValidators();
      this.formGroup.get(cargo[5])?.updateValueAndValidity();
      this.formGroup.get(cargo[6])?.clearValidators();
      this.formGroup.get(cargo[6])?.updateValueAndValidity();
      this.formGroup.get(cargo[7])?.clearValidators();
      this.formGroup.get(cargo[7])?.updateValueAndValidity();
      this.formGroup.get(cargo[8])?.reset()
      this.formGroup.get(cargo[8])?.clearValidators();
      this.formGroup.get(cargo[8])?.updateValueAndValidity();
      this.tipoDocumento(event, cargo[3]);
    }
  }
  siguientePaso(){
    // const confirm = false ;
    let messageModal = '';
    //
    // if(!this.presidente && !this.representanteLegalOP && !this.perfil_OP){
    //   messageModal ='¿Desea continuar sin agregar los datos de los funcionario con cargo Representante Legal OP, Presidente y Perfil OP?';
    // } else if(!this.representanteLegalOP){
    //   messageModal ='¿Desea continuar sin agregar los datos del funcionario con cargo Representante Legal OP?';
    // } else if(!this.presidente){
    //   messageModal ='¿Desea continuar sin agregar los datos del funcionario con cargo Presidente?';
    // } else if(!this.perfil_OP){
    //   messageModal ='¿Desea continuar sin agregar los datos del funcionario con cargo OP?';
    // }

    // Mensaje variable de acuerdo a la ausencia de algún funcionario
    let cargosFaltantes: string[] = [];

    if (!this.representanteLegalOP) cargosFaltantes.push("Representante Legal OP");
    if (!this.presidente) cargosFaltantes.push("Presidente");
    if (!this.perfil_OP) cargosFaltantes.push("Presidente del OEC");

    if (cargosFaltantes.length > 0) {
      let cargosTexto = cargosFaltantes.join(", ");

      if (cargosFaltantes.length > 1) {
        const lastCommaIndex = cargosTexto.lastIndexOf(", ");
        cargosTexto = cargosTexto.substring(0, lastCommaIndex) + " y " + cargosTexto.substring(lastCommaIndex + 2);
      }
      messageModal = `¿Desea continuar sin agregar los datos del funcionario con cargo ${cargosTexto}?`;
    }

    if(!this.presidente || !this.representanteLegalOP || !this.perfil_OP){
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera : 'Notificación' ,messages: [messageModal],btnCancel : true}
      }).afterClosed().subscribe(result =>{
        if(result){
          this.save();
        }
      });
    }else{
      this.save();
    }
  }

  save(){
    if(this.formGroup.valid){
      //Se removió validación de DNIs, correo y numero de telefono a petición del usuario.
      //PJ
      /*if(this.requestSave?.correoElectronico === this.formGroup.controls['emailTesorero'].value ||
        this.requestSave?.correoElectronico === this.formGroup.controls['emailRepre'].value ||
        this.requestSave?.numeroCelular === this.formGroup.controls['celularTesorero'].value ||
        this.requestSave?.numeroCelular === this.formGroup.controls['celularRepre'].value){
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            data: {cabecera: 'Error', messages: ['Hay datos repetidos en los funcionarios, porfavor rectifique.']}
          });
          return;
      }

      //Representante
      if(this.requestSave?.representante?.doc === this.formGroup.controls['documentoTesorero'].value ||
        this.requestSave?.representante?.doc === this.formGroup.controls['documentoRepre'].value ||
        this.requestSave?.representante?.email === this.formGroup.controls['emailTesorero'].value ||
        this.requestSave?.representante?.email === this.formGroup.controls['emailRepre'].value ||
        this.requestSave?.representante?.cellphone === this.formGroup.controls['celularTesorero'].value ||
        this.requestSave?.representante?.cellphone === this.formGroup.controls['celularRepre'].value){
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            data: {cabecera: 'Error', messages: ['Hay datos repetidos en los funcionarios, porfavor rectifique.']}
          });
          return;
      }
      if(this.presidente){
        if(this.requestSave?.representante?.doc === this.formGroup.controls['documentoPresi'].value  ||
          this.requestSave?.representante?.email === this.formGroup.controls['emailPresi'].value ||
          this.requestSave?.representante?.cellphone === this.formGroup.controls['celularPresi'].value ||
          this.requestSave?.correoElectronico === this.formGroup.controls['emailPresi'].value ||
          this.requestSave?.numeroCelular === this.formGroup.controls['celularPresi'].value){
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera: 'Error', messages: ['Hay datos repetidos en los funcionarios, porfavor rectifique.']}
            });
            return;
          }
      }
      var emailTesorero = this.formGroup.controls['emailTesorero'].value;
      var emailRepre = this.formGroup.controls['emailRepre'].value;
      var emailPresi = this.formGroup.controls['emailPresi'].value;
      if(emailTesorero === emailRepre ||emailRepre === emailPresi || emailTesorero === emailPresi ){
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera: 'Validación', messages: ['No validó los correos son iguales']}
        });
        return;
      }

      var celularTesorero = this.formGroup.controls['celularTesorero'].value;
      var celularRepre = this.formGroup.controls['celularRepre'].value;
      var celularPresi = this.formGroup.controls['celularPresi'].value;
      if(celularTesorero === celularRepre ||celularRepre === celularPresi || celularTesorero === celularPresi ){
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera: 'Validación', messages: ['No validó numeors de celulares son iguales']}
        });
        return;
      }*/

      var cargoTesorero = this.formGroup.controls['cargoTesorero'].value;
      this.requestTesorero.position = cargoTesorero.id;
      this.requestTesorero.positionName = cargoTesorero.value;
      this.requestTesorero.docType = this.formGroup.controls['tipoDocumentoTesorero'].value;
      this.requestTesorero.doc = this.formGroup.controls['documentoTesorero'].value;
      this.requestTesorero.names = this.formGroup.controls['nombresTesorero'].value.toUpperCase();
      this.requestTesorero.lastname = this.formGroup.controls['apellidoPaternoTesorero'].value.toUpperCase();
      this.requestTesorero.second_lastname = this.formGroup.controls['apellidoMaternoTesorero'].value.toUpperCase();
      this.requestTesorero.email = this.formGroup.controls['emailTesorero'].value;
      this.requestTesorero.cellphone = this.formGroup.controls['celularTesorero'].value;

      if (this.representanteLegalOP) {
        var cargoRepre = this.formGroup.controls['cargoRepre'].value;
        this.requestRepre.position = cargoRepre.id;
        this.requestRepre.positionName = cargoRepre.value;
        this.requestRepre.docType = this.formGroup.controls['tipoDocumentoRepre'].value;
        this.requestRepre.doc = this.formGroup.controls['documentoRepre'].value;
        this.requestRepre.names = this.formGroup.controls['nombresRepre'].value.toUpperCase();
        this.requestRepre.lastname = this.formGroup.controls['apellidoPaternoRepre'].value.toUpperCase();
        this.requestRepre.second_lastname = this.formGroup.controls['apellidoMaternoRepre'].value.toUpperCase();
        this.requestRepre.email = this.formGroup.controls['emailRepre'].value;
        this.requestRepre.cellphone = this.formGroup.controls['celularRepre'].value;
        this.requestSave.repre = this.requestRepre;
      }else{
        this.requestSave.repre = new RequestRepresentante();
      }

      if(this.presidente){
        var cargoPresidente = this.formGroup.controls['cargoPresi'].value;
        this.requestPresidente.position = cargoPresidente.id;
        this.requestPresidente.positionName = cargoPresidente.value;
        this.requestPresidente.docType = this.formGroup.controls['tipoDocumentoPresi'].value;
        this.requestPresidente.doc = this.formGroup.controls['documentoPresi'].value;
        this.requestPresidente.names = this.formGroup.controls['nombresPresi'].value.toUpperCase();
        this.requestPresidente.lastname = this.formGroup.controls['apellidoPaternoPresi'].value.toUpperCase();
        this.requestPresidente.second_lastname = this.formGroup.controls['apellidoMaternoPresi'].value.toUpperCase();
        this.requestPresidente.email = this.formGroup.controls['emailPresi'].value;
        this.requestPresidente.cellphone = this.formGroup.controls['celularPresi'].value;
        this.requestSave.presidente = this.requestPresidente;
      }else {
        this.requestSave.presidente = new RequestRepresentante();
      }

      if(this.perfil_OP){
        const cargoOP = this.formGroup.controls['cargoOP'].value;
        this.requestOP.position = cargoOP.id;
        this.requestOP.positionName = cargoOP.value;
        this.requestOP.docType = this.formGroup.controls['tipoDocumentoOP'].value;
        this.requestOP.doc = this.formGroup.controls['documentoOP'].value;
        this.requestOP.names = this.formGroup.controls['nombresOP'].value.toUpperCase();
        this.requestOP.lastname = this.formGroup.controls['apellidoPaternoOP'].value.toUpperCase();
        this.requestOP.second_lastname = this.formGroup.controls['apellidoMaternoOP'].value.toUpperCase();
        this.requestOP.email = this.formGroup.controls['emailOP'].value;
        this.requestOP.cellphone = this.formGroup.controls['celularOP'].value;
        this.requestSave.perfilOP = this.requestOP;
      }else{
        this.requestSave.perfilOP = new RequestRepresentante();
      }

      this.requestSave.tesorero = this.requestTesorero;

      this.casillaService.setCasilla(this.requestSave);
      this.completedStep.emit();
    }
  }
  validarConfirmar(campo: string, campo1: string){
    let equal = true;
    const contact = this.formGroup.controls[campo].value;
    const contactConfirmar = this.formGroup.controls[campo1].value;
    if(contact !== contactConfirmar){
      equal = false;
    }
    if(!equal){
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera: 'Error', messages: ['Los datos no coinciden']}
      });
      this.formGroup.get(campo1)?.setValue('');
    }
  }
  regresar(){
    this.previousStep.emit()
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
}
