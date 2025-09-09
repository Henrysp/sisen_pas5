import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
  Renderer2,
  ChangeDetectorRef
} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {CasillaService} from "../../core/services/casilla.service";
import {
  Cargo,
  Condicion_Persona_Natural,
  TipoDocumento,
  TipoDocumento_DNI,
  TipoDocumento_CE
} from "../../core/dto/documento";
import {firstValueFrom, Subscription} from "rxjs";
import {ValidarCorreoService} from "../../core/services/validar-correo.service";
import {Departamento, Distrito, Provincia} from "../../core/dto/ubigeo.dto";
import {UbigeoService} from "../../core/services/ubigeo.service";
import {requestGlobal, RequestRepresentante} from 'src/app/core/dto/request';
import {FileUploadControl, FileUploadValidators} from '@iplab/ngx-file-upload';
import {ObtenerDatosPersonaDniDto, PersonaNaturalDni} from "../../core/dto/personaNaturalDni";
import {PersonaNaturalService} from "../../core/services/persona-natural.service";
import {AlertDialogComponent} from "../alert-dialog/alert-dialog.component";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module, ReCaptchaV3Service,} from 'ng-recaptcha';
import {SharedDialogComponent} from '../shared/shared-dialog/shared-dialog.component';
import {requestValidateRepresentative} from 'src/app/core/dto/personaJuridica';
import {PersonaJuridicaService} from 'src/app/core/services/persona-juridica.service';
import {ValidarCelularService} from "../../core/services/validar-celular.service";

@Component({
  selector: 'app-datos-representante',
  templateUrl: './datos-representante.component.html',
  styleUrls: ['./datos-representante.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DatosRepresentanteComponent implements OnInit {
  @ViewChild('fileUpload', {static: false}) fileUpload !: ElementRef;
  @Output() completedStep = new EventEmitter<any>()
  @Output() previousStep = new EventEmitter<any>()
  @Output() Other = new EventEmitter<any>();
  formGroup!: FormGroup;
  public animation: boolean = false;
  public multiple: boolean = false;
  validateRequestRepresentative: requestValidateRepresentative = new requestValidateRepresentative();
  observableRequestSubscription!: Subscription;
  requestSave: requestGlobal = new requestGlobal();
  requestRepresentante: RequestRepresentante = new RequestRepresentante();
  maxsize_ = 10485760;
  tipoDocumentoAdjuntoList: Array<TipoDocumento> = []
  tipoDocumentoList: Array<TipoDocumento> = []
  departamentoList: Array<Departamento> = []
  provinciaList: Array<Provincia> = []
  distritoList: Array<Distrito> = []
  cargoList: Array<Cargo> = []
  cargoLst: Array<Cargo> = []
  codigoEnviado = false;
  maxlength: number = 8;
  minlength: number = 8;
  esIos: boolean = false;
  blockInput: boolean = true;
  TOkenCaptcha: string = '';
  cont = 0;
  public loading: boolean = false;
  public buscando: boolean = false;
  personaNaturalDni: PersonaNaturalDni | null = null;
  numeroDniValido: Boolean | undefined = undefined;
  oneClick = false;
  cargoActive: boolean = false;
  cargoSelect: boolean = false;
  todaydate: Date = new Date(new Date().setFullYear(new Date().getFullYear() - 18));
  bloquearValidar: boolean = true;
  tipoDocumentoName = '';
  public uploadedFiles: Array<File> = [];

  err_max_files = false;
  err_format = false;
  err_size = false;
  err_size_name = false;
  err_duplicados = false;
  errorMessages: string[] = [];

  constructor(
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private casillaService: CasillaService,
    private ubigeoService: UbigeoService,
    private renderer: Renderer2,
    private personaNaturalService: PersonaNaturalService,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private correoService: ValidarCorreoService,
    private smsService: ValidarCelularService,
    private validarCorreoService: ValidarCorreoService,
    private personaJuridicaService: PersonaJuridicaService
  ) {

    this.observableRequestSubscription = casillaService.casilla$.subscribe(
      (requestSave: requestGlobal) => {
        this.requestSave = requestSave;
        //if (requestSave) this.companyId = requestSave;
      }
    );
  }


  validatorFile_bk() {
    const Image = this.formGroup.controls['files'].value[0];

    if (Image.size >= this.maxsize_) {
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera: '!Advertencia!', messages: ['El peso del archivo adjunto no debe superar los 10MB']}
      })
      this.filesControl.setValue([]);

    }

    const type = Image.type.split("/")[1]//substr(0,5)
    if (type !== "pdf") {
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera: '!Advertencia!', messages: ['El archivo debe ser de tipo documento en formato PDF']}
      })
      this.filesControl.setValue([]);
    }

    if (Image.name.length > 104) {
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera: '!Advertencia!', messages: ['El nombre del archivo no debe ser mayor a 100 caracteres.']}
      })
      this.filesControl.setValue([]);
    }
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

  async ngOnInit() {
    this.createForm();
    this.tipoDocumentoAdjuntoList = await firstValueFrom(this.casillaService.getTipoDocumentoAdjuntoList())
    this.tipoDocumentoList = await firstValueFrom(this.casillaService.getTipoDocumentoList(Condicion_Persona_Natural))
    this.departamentoList = await firstValueFrom(this.ubigeoService.getDepartamentoList())
    this.cargoList = await firstValueFrom(this.casillaService.getCargoList())
    this.cargoSelect = false;
  }

  // handleArchivoAgregado(event: any) {
  //   console.log(event)
  //   this.formGroup.get('file')?.setValue(event)
  // }

  regresar() {
    this.previousStep.emit()
  }

  createForm(value = "", valuetipo = "", dataEspecifique = "", asientoRegistralRep = "") {
    this.formGroup = this.formBuilder.group({
      tipoDocumentoAdjunto: [valuetipo],
      //tipoDocumentoAdjuntoNombre: [{value: dataEspecifique, disabled: true}],
      asientoRegistralRep: [asientoRegistralRep,[Validators.pattern('^[0-9a-zA-ZÀ-ÿ](?:(?:[- ][0-9a-zA-ZÀ-ÿ])?[0-9a-zA-ZÀ-ÿ]*)*$')]],
      //especifiqueDoc : FormControl = new FormControl({ value: '', disabled: true });
      files: this.filesControl,
      tipoDocumento: [value, Validators.required],
      orgSi: [false],
      orgNo: [false],
      cargo: [{ value: '', disabled: true }, [Validators.required]],
      numeroDocumento: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]],
      apellidoPaterno: [{ value: '', disabled: true }, [Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      apellidoMaterno: [{ value: '', disabled: true }, [Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      nombres: [{ value: '', disabled: true }, [Validators.required,Validators.pattern("^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð.\\-'\"° ]{0,253}$")]],
      correoElectronico: [{ value: '', disabled: true }, [Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      numeroCelular: [{ value: '', disabled: true }, Validators.required],
      numeroTelefono: [{ value: '', disabled: true }],
      validateEmail: [false, Validators.required],
      validateSms: [false, Validators.required],
      recaptchaReactive: [''],
      alterno: [null]
    },{ validators: this.apellidoRequerido.bind(this) })
    //this.tipoDocumentoAdjuntoChangue();
  }

  apellidoRequerido(formGroup: FormGroup) {
    const apellidoPaterno = formGroup.get('apellidoPaterno')?.value?.trim();
    const apellidoMaterno = formGroup.get('apellidoMaterno')?.value?.trim();

    return apellidoPaterno || apellidoMaterno ? null : { apellidoRequerido: true };
  }
  tipoDocumentoAdjuntoChangue() {


    const tipoDocAdjCod = this.formGroup.get('tipoDocumentoAdjunto')?.value;
    this.tipoDocumentoName = this.tipoDocumentoAdjuntoList.find(item => item.codigo === tipoDocAdjCod)?.nombre || '';

    // console.log("tipodocumento --->", tipoDocAdjCod);

    if (tipoDocAdjCod === '4') {
      this.formGroup.get('tipoDocumentoAdjuntoNombre')?.enable();
      this.formGroup.get('tipoDocumentoAdjuntoNombre')?.setValidators([Validators.required]);
      this.formGroup.get('tipoDocumentoAdjuntoNombre')?.updateValueAndValidity();
      this.formGroup.get('tipoDocumentoAdjuntoNombre')?.markAllAsTouched();

    } else {
      this.formGroup.get('tipoDocumentoAdjuntoNombre')?.disable();
      this.formGroup.get('tipoDocumentoAdjuntoNombre')?.setValue("");
      this.formGroup.get('tipoDocumentoAdjuntoNombre')?.clearValidators();
      this.formGroup.get('tipoDocumentoAdjuntoNombre')?.updateValueAndValidity();
    }
  }


  desactivarInputsInit() {
    this.formGroup.get('numeroDocumento')?.disable();
    this.formGroup.get('correoElectronico')?.disable();
    this.formGroup.get('numeroCelular')?.disable();
    this.formGroup.get('apellidoPaterno')?.disable();
    this.formGroup.get('apellidoMaterno')?.disable();
    this.formGroup.get('nombres')?.disable();
    this.formGroup.get('numeroTelefono')?.disable();

  }

  activarInputs() {
    this.formGroup.get('numeroDocumento')?.enable();
    this.formGroup.get('correoElectronico')?.enable();
    this.formGroup.get('numeroCelular')?.enable();
    this.formGroup.get('apellidoPaterno')?.enable();
    this.formGroup.get('apellidoMaterno')?.enable();
    this.formGroup.get('nombres')?.enable();
    this.formGroup.get('numeroTelefono')?.enable();
  }


  get f(): { [key: string]: AbstractControl } {
    return this.formGroup.controls;
  }

  quitarDobleEspacio(idInput: string, e: any) {

    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if (inicio == 0 && e.key === ' ') return false;
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');

    return true;
  }

  async siguientePaso() {
    // this.completedStep.emit();

    this.bloquearValidar = false;

    if (this.formGroup.valid) {
      await this.executeAction('homeLogin');
      var validate = this.formGroup.controls['validateEmail'].value;
      if (!validate) {
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera: 'Validación', messages: ['No validó el correo electrónico']}
        });
        this.bloquearValidar = true;
        return;
      }

      var validateSms = this.formGroup.controls['validateSms'].value;
      if (!validateSms) {
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera: 'Validación', messages: ['No validó el número de celular']}
        });
        this.bloquearValidar = true;
        return;
      }

      var cargo = this.formGroup.controls['cargo'].value;
      if(!this.requestSave?.tesorero?.positionName){
        if(cargo.codigo == '2' ){
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            //data: {cabecera: 'Notificación', messages: ['A continuación debe registrar los datos del Tesorero y Representante Legal de Organización Política de manera obligatoria,<br> asimismo, si cree necesario puede registrar al Presidente.']}
            data: {cabecera: 'Notificación', messages: ['A continuación debe registrar los datos del Tesorero de manera obligatoria.<br>Asimismo, si cree necesario puede registrar al Representante Legal OP, Presidente y Presidente del OEC.']}
          })
        }
      }
      this.validateRequestRepresentative.docType = this.formGroup.controls['tipoDocumento'].value;
      this.validateRequestRepresentative.doc = this.formGroup.controls['numeroDocumento'].value;
      this.validateRequestRepresentative.asientoRegistralRep = this.formGroup.controls['asientoRegistralRep'].value;
      this.validateRequestRepresentative.names = this.formGroup.controls['nombres'].value;
      this.validateRequestRepresentative.lastname = this.formGroup.controls['apellidoPaterno'].value;
      this.validateRequestRepresentative.second_lastname = this.formGroup.controls['apellidoMaterno'].value;
      this.validateRequestRepresentative.email = this.formGroup.controls['correoElectronico'].value;
      this.validateRequestRepresentative.cellphone = this.formGroup.controls['numeroCelular'].value;
      this.validateRequestRepresentative.position = cargo.codigo;
      this.validateRequestRepresentative.positionName = cargo.nombre;
      this.validateRequestRepresentative.documentTypeAttachment = this.formGroup.controls['tipoDocumentoAdjunto'].value;
      this.validateRequestRepresentative.documentNameAttachment = this.tipoDocumentoName;
      this.validateRequestRepresentative.recaptcha = this.TOkenCaptcha;
      this.validateRequestRepresentative.ruc = this.requestSave.numeroDocumento;

      this.personaJuridicaService.validarRepresentante(this.validateRequestRepresentative).subscribe(res => {
        if (res.success) {
          this.loadReaquestSave();
          this.bloquearValidar = true;
          //this.formGroup.markAllAsTouched();
          return;
        } else {
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            data: {cabecera: 'Verifique sus datos', messages: [res.message]}
          });
          this.bloquearValidar = true;
          this.formGroup.markAllAsTouched();
          return;
        }

      }, error => {
        this.dialog.open(AlertDialogComponent, { disableClose: true, hasBackdrop: true, data: {cabecera: 'Error', messages: ['Error de servicio.']} });
        this.bloquearValidar = true;
        return;
      });
    } else {
      this.bloquearValidar = true;
      return;
    }
  }


  loadReaquestSave() {

    // var nombreCompleto = this.formGroup.controls['nombres'].value + " " +this.formGroup.controls['apellidoPaterno'].value + " " + this.formGroup.controls['apellidoMaterno'].value;
    var cargo = this.formGroup.controls['cargo'].value;
    var tipoDocumento = this.formGroup.controls['tipoDocumento'].value;
    var tipoDocumentoAdjunto = this.formGroup.controls['tipoDocumentoAdjunto'].value;

    this.requestRepresentante.documentTypeAttachment = tipoDocumentoAdjunto;
    this.requestRepresentante.documentNameAttachment = this.tipoDocumentoName;
    this.requestRepresentante.asientoRegistralRep = this.formGroup.controls['asientoRegistralRep'].value;
    this.requestRepresentante.docType = tipoDocumento;
    this.requestRepresentante.doc = this.formGroup.controls['numeroDocumento'].value;
    this.requestRepresentante.names = this.formGroup.controls['nombres'].value.toUpperCase();
    this.requestRepresentante.lastname = this.formGroup.controls['apellidoPaterno'].value.toUpperCase();
    this.requestRepresentante.second_lastname = this.formGroup.controls['apellidoMaterno'].value.toUpperCase();
    this.requestRepresentante.email = this.formGroup.controls['correoElectronico'].value.toLowerCase();
    this.requestRepresentante.cellphone = this.formGroup.controls['numeroCelular'].value;
    //this.requestRepresentante.address = this.formGroup.controls['domicilioFisico'].value;
    this.requestRepresentante.position = cargo.codigo;
    this.requestRepresentante.positionName = cargo.nombre; // this.formGroup.controls['cargoNombre'].value;
    this.requestRepresentante.phone = this.formGroup.controls['numeroTelefono'].value;
    this.requestRepresentante.alterno = this.formGroup.controls['alterno'].value;
    //this.requestRepresentante.file = this.formGroup.controls['files'].value[0];

    //var departamento = this.formGroup.controls['departamento'].value;
    //var provincia = this.formGroup.controls['provincia'].value;
    //var distrito = this.formGroup.controls['distrito'].value;
    //let Ubigeo = departamento.nodep + " / " + provincia.noprv + " / " + distrito.nodis;
    //this.requestRepresentante.ubigeo = Ubigeo;
    this.requestSave.fileDocument = this.formGroup.controls['files'].value;
    this.requestSave.representante = this.requestRepresentante;
    this.requestSave.orgPol = this.cargoSelect ?"1":"0";
    this.casillaService.setCasilla(this.requestSave);
    this.completedStep.emit();
  }

  igualPJ(): boolean {
    const correRep = String(this.formGroup.controls['correoElectronico'].value.trim().toLowerCase());
    const correoPJ = String(this.requestSave.correoElectronico.toLowerCase());
    if (correRep === correoPJ) {
      this.formGroup.get("validateEmail")?.setValue(true);
      // this.formGroup.controls['validateEmail'].setValue(true);
      return true;
    } else {
      this.formGroup.get("validateEmail")?.setValue(false);
      // this.formGroup.controls['validateEmail'].setValue(false);
      return false;
    }
  }

  igualCelularPJ(): boolean {
    const valueRep = String(this.formGroup.controls['numeroCelular'].value.trim());
    const valuePJ = String(this.requestSave.numeroCelular);
    if (valueRep === valuePJ) {
      this.formGroup.get("validateSms")?.setValue(true);
      return true;
    } else {
      this.formGroup.get("validateSms")?.setValue(false);
      return false;
    }
  }

  public filesControl = new FormControl(null, [
    FileUploadValidators.accept(['.pdf']),
    FileUploadValidators.filesLimit(2),
    FileUploadValidators.fileSize(1048576 * 10),
    // this.noWhitespaceValidator,
  ]);

  tipoDocumentoCambiado() {

    if (this.cont == 0) {
      this.activarInputs();
      this.formGroup.get("validateSms")?.setValue(false);
      this.formGroup.get("validateEmail")?.setValue(false);
      //this.formGroup.get('numeroDocumento')?.enable();
    }


    const value = this.formGroup.get('tipoDocumento')?.value;
    const valueTipoDoc = this.formGroup.get('tipoDocumentoAdjunto')?.value;
    const dataEspecifique = this.formGroup.get('tipoDocumentoAdjuntoNombre')?.value;
    const asientoRegistralRep = this.formGroup.get('asientoRegistralRep')?.value;
    this.blockInput = false;
    this.provinciaList = [];
    this.distritoList = [];
    this.invalidarDocumento();

    if (value === TipoDocumento_DNI) {
      this.maxlength = 8;
      this.minlength = 8;
      this.formGroup.get('nombres')?.disable();
      this.formGroup.get('apellidoPaterno')?.disable();
      this.formGroup.get('apellidoMaterno')?.disable();
      this.formGroup.get('numeroDocumento')?.enable();
      this.formGroup.get('correoElectronico')?.enable();
      if (this.esIos = true) {
        this.formGroup.get('numeroDocumento')?.enable();
      }
    }
    if (value === TipoDocumento_CE) {
      this.maxlength = 9
      this.minlength = 9;
      this.formGroup.get('nombres')?.enable();
      this.formGroup.get('correoElectronico')?.enable();
      this.formGroup.get('apellidoPaterno')?.enable();
      this.formGroup.get('apellidoMaterno')?.enable();
      this.formGroup.get('numeroDocumento')?.enable();
    }

    if (value === "") {
      this.desactivarInputsInit();
    }
    this.formGroup.get('nombres')?.setValue("");
    this.formGroup.get('correoElectronico')?.setValue("");
    this.formGroup.get('apellidoPaterno')?.setValue("");
    this.formGroup.get('apellidoMaterno')?.setValue("");
    this.formGroup.get('numeroDocumento')?.setValue("");
    this.formGroup.get('numeroCelular')?.setValue("");
    this.formGroup.get('numeroTelefono')?.setValue("");
  }


  invalidarDocumento() {
    this.numeroDniValido = false
  }

  async validarDocumento() {

    if (this.getNumeroDoc().length != this.maxlength) return;

    this.loading = true;
    this.buscando = true;
    this.formGroup.get('numeroDocumento')?.disable();
    // console.log('validando documento')
    const numeroDocumento = (this.formGroup.get('numeroDocumento')?.value ?? '') as string
    if (this.esTipoDocumentoDni && numeroDocumento.length == 8) {

      var validate = await this.executeAction('homeLogin'); //  poner en true para desarrollo

      if (validate) {
        let envio: ObtenerDatosPersonaDniDto = new ObtenerDatosPersonaDniDto();
        envio.dni = numeroDocumento;
        envio.recaptcha = this.TOkenCaptcha;
        //this.personaNaturalDni = await firstValueFrom(this.personaNaturalService.obtenerDatosPersona(envio))

        this.personaNaturalService.obtenerDatosPersona(envio).subscribe(res => {
          if (res) {
            this.personaNaturalDni = res;
            if(this.personaNaturalDni.nombres!==null && (this.personaNaturalDni.apellidoPaterno !== null || this.personaNaturalDni.apellidoMaterno !== null)) {
              this.formGroup.patchValue({
                'nombres': this.personaNaturalDni.nombres.trimRight(),
                'apellidoPaterno': this.personaNaturalDni.apellidoPaterno ? this.personaNaturalDni.apellidoPaterno.trimRight() : this.formGroup.get('apellidoPaterno')?.value,
                'apellidoMaterno': this.personaNaturalDni.apellidoMaterno ? this.personaNaturalDni.apellidoMaterno.trimRight() : this.formGroup.get('apellidoMaterno')?.value,
              });
              this.loading = false;
              this.buscando = false;
              this.blockInput = false;
              this.numeroDniValido = true;
            }else{
              this.blockInput = true;
              this.loading = false;
              this.formGroup.get('numeroDocumento')?.enable();
              this.formGroup.get('tipoDocumento')?.enable();
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
            this.formGroup.get('numeroDocumento')?.enable();
            this.formGroup.get('tipoDocumento')?.enable();
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
            mensajeError = {cabecera: 'No autorizado', messages: [error.error.message]};
          }
          if (error.error.statusCode == 404) {
            this.personaNaturalService.obtenerDatosPersonaDb(envio).subscribe(res1 => {
              if (res1) {
                this.personaNaturalDni = res1;
                this.formGroup.patchValue({
                  'nombres': this.personaNaturalDni.nombres.trimRight(),
                  'apellidoPaterno': this.personaNaturalDni.apellidoPaterno.trimRight(),
                  'apellidoMaterno': this.personaNaturalDni.apellidoMaterno.trimRight()
                })
                this.loading = false;
                this.buscando = false;
                this.blockInput = false;
                this.numeroDniValido = true;
              } else {
                this.blockInput = true;
                this.loading = false;
                this.formGroup.get('numeroDocumento')?.enable();
                this.formGroup.get('tipoDocumento')?.enable();
                this.dialog.open(AlertDialogComponent, {
                  disableClose: true,
                  hasBackdrop: true,
                  data: {cabecera: 'Error', messages: ['No hubo respuesta, intente nuevamente en unos momentos.']}
                });
              }
            }, (error) => {
              //let mensajeError = {cabecera : 'Advertencia', messages: ['Error al obtener información.']};
              if (error.error.statusCode == 401) {
                mensajeError = {cabecera: 'No autorizado', messages: [error.error.message]};
              }
              if (error.error.statusCode == 404) {
                //mensajeError = {cabecera : 'Verifica si tu número de DNI ingresado es correcto.', messages: ['En caso sea correcto, te invitamos a presentar tu Solicitud mediante Mesa de Partes Física o Virtual.']};
                mensajeError = {
                  cabecera: 'Verifica si tu número de DNI ingresado es correcto.',
                  messages: ["En caso sea correcto, te invitamos a presentar tu Solicitud mediante Mesa de Partes Virtual (Ingrese <a href='https://www.web.onpe.gob.pe/mpve' target='_blank'>aquí</a>)<br/> o Física presentando el Formulario de Solicitud de Asignación de Casilla Electrónica (descargué <a href='assets/docs/Solicitud-asignacion-casilla-electronica.pdf' download='Solicitud-asignacion-casilla-electronica.pdf'>aquí</a>)."]
                };
                this.blockInput = true;
                this.loading = false;
                this.formGroup.get('numeroDocumento')?.enable();
                this.formGroup.get('tipoDocumento')?.enable();
                this.dialog.open(AlertDialogComponent, {
                  disableClose: true,
                  hasBackdrop: true,
                  data: mensajeError
                });
              }
            })
            //mensajeError = {cabecera : 'Verifica si el número de DNI ingresado es correcto.', messages: ['En caso sea correcto, te invitamos a presentar tu Solicitud mediante Mesa de Partes Física o Virtual.']};
          }
          /*this.blockInput = true;
          this.loading = false;
          this.formGroup.get('numeroDocumento')?.enable();
          this.formGroup.get('tipoDocumento')?.enable();
          this.loading = false;
          this.buscando = false;
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            data: mensajeError
          });
          return;*/
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

  obtenerCorreo() {
    return this.formGroup.get('correoElectronico')?.value ?? ''
  }

  getNumeroDoc() {
    return this.formGroup.get('numeroDocumento')?.value ?? '';
  }

  get esTipoDocumentoDni() {
    return this.formGroup?.get('tipoDocumento')?.value == TipoDocumento_DNI
  }

  async continuar() {
    if (await this.validarCorreoService.iniciarValidacion(this.obtenerCorreo(), this.codigoEnviado)) {
      // console.log('validación correcta')
      this.siguientePaso()
    } else {
      // console.log('no se ha validado')
      this.codigoEnviado = true
    }
  }


  async cambiarProvincia() {
    this.formGroup.get("provincia")?.reset("");
    this.formGroup.get("distrito")?.reset("");
    this.provinciaList = [];
    var value = this.formGroup.get('departamento')?.value.ubdep
    this.provinciaList = await firstValueFrom(this.ubigeoService.getProvinciaList(value))
    this.distritoList = []

  }

  async cambiarDistrito() {
    this.distritoList = [];
    this.formGroup.get("distrito")?.reset("");
    var valueprovincia = this.formGroup.get('provincia')?.value.ubprv
    var valuedepar = this.formGroup.get('departamento')?.value.ubdep
    this.distritoList = await firstValueFrom(this.ubigeoService.getDistritoList(valuedepar, valueprovincia))
  }

  validardomicilio(e: any, idInput: string) {
    var value = this.formGroup.get('domicilioFisico')?.value;

    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if (inicio == 0 && e.key === ' ') return false;

    this.formGroup.get('domicilioFisico')?.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
    return true;
  }

  validarCelular(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    const numCelular = this.formGroup.get('numeroCelular')?.value;
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

  validarsoloTelefonoFijo(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    const digitVer = this.formGroup.get('numeroTelefono')?.value;
    if (digitVer == " ") {
      this.formGroup.get("numeroTelefono")?.setValue("");
    }
    var inp = String.fromCharCode(event.keyCode);
    if (charCode === 45) {
      return true;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }


  async validarCorreoElectronico() {
    this.oneClick = true;
    var validate = await this.executeAction('homeLogin');

    var igualPj = this.igualPJ();

    if (igualPj) {
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera: 'Validado', messages: ['El correo ya fue validado']}
      });
      this.formGroup.get('correoElectronico')?.disable();
      this.oneClick = false;
      return;
    }

    let request = {
      tipoDocumento: this.formGroup.get('tipoDocumento')?.value,
      numeroDocumento: this.formGroup.get('numeroDocumento')?.value,
      correoElectronico: this.formGroup.get('correoElectronico')?.value.toLowerCase(),
      recaptcha: this.TOkenCaptcha
    }

    this.correoService.envioCorreoVerificacion(request).subscribe(res => {
      this.oneClick = false;
      if (res) {
        Object.assign(request, {personType: 'pj'})

        const dialogRef = this.dialog.open(SharedDialogComponent, {
          width: "771px",
          height: "434px",
          disableClose: true,
          data: {idEnvio: res.idEnvio, requestData: request, email: this.formGroup.get('correoElectronico')?.value.toLowerCase()},
        });
        dialogRef.afterClosed().subscribe((result: boolean) => {
          this.formGroup.get("validateEmail")?.setValue(result);
          //this.formGroup.controls['validateEmail'].setValue(result);
          // this.formGroup.patchValue({'validateEmail': result});
          // this.formGroup.setValue({validateEmail : result})
          //this.formGroup.controls.validateEmail.setValue(result);
          if (result) {
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
    }, error => {
      this.oneClick = false;
    });
  }

  validarsoloNumeros(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }


  ActiveButton(): boolean {

    const validateEmail = this.formGroup.controls['validateEmail'].value;
    //console.log("validateEMAILLLLL" , validateEmail);
    if (validateEmail == true) {
      return true;
    } else {
      if (this.formGroup.get('tipoDocumento')?.invalid || this.formGroup.get('numeroDocumento')?.invalid || this.formGroup.get('correoElectronico')?.invalid || this.formGroup.get('tipoDocumento')?.value == "-") {
        return true
      } else {
        return false;
      }
    }
  }

  ActiveButtonSMS(): boolean {
    if (this.formGroup.get('validateSms')?.value == true) {
      return true;
    } else {
      if (this.formGroup.get('tipoDocumento')?.invalid || this.formGroup.get('numeroDocumento')?.invalid || this.formGroup.get('numeroCelular')?.invalid || this.formGroup.get('tipoDocumento')?.value == "-") {
        return true
      } else {
        return false;
      }
    }
  }

  async validarNumeroCelular() {
    this.oneClick = true;

    var validate = await this.executeAction('homeLogin');
    var igualCelularPJ = this.igualCelularPJ();

    if (igualCelularPJ) {
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera: 'Validado', messages: ['El número de celular ya fue validado']}
      });
      this.formGroup.get('numeroCelular')?.disable();
      this.oneClick = false;
      return;
    }

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
    });
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


  validateForms(): boolean {
    if (this.formGroup.valid) {
      if (this.bloquearValidar && this.cargoActive) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  cargo(e: any){
    //this.cdr.detectChanges();
    let valorOrgNo = this.formGroup.get('orgNo')?.value;
    let valorOrgSi = this.formGroup.get('orgSi')?.value;

    if (!valorOrgNo && !valorOrgSi) {
      this.cargoLst = [];
      this.formGroup.get('cargo')?.setValue('');
      this.Other.emit(false);
      this.cargoActive = false;
      this.cargoSelect = false;
    } else if(e.target.name === 'orgSi'){
      this.formGroup.get('orgNo')?.setValue(false);
      this.cargoLst.push(this.cargoList[1]);
      this.formGroup.get('cargo')?.setValue(this.cargoList[1]);
      this.Other.emit(true);
      this.cargoActive = true;
      this.cargoSelect = true;
    } else if(e.target.name === 'orgNo') {
      this.formGroup.get('orgSi')?.setValue(false);
      this.cargoLst.push(this.cargoList[0]);
      this.formGroup.get('cargo')?.setValue(this.cargoList[0]);
      this.Other.emit(false);
      this.cargoActive = true;
      this.cargoSelect = false;
      this.requestSave.tesorero = new RequestRepresentante();
      this.requestSave.presidente = new RequestRepresentante();
      this.requestSave.perfilOP = new RequestRepresentante();
      this.requestSave.repre = new RequestRepresentante();
    }
    this.alternoOrAsientoRep();
  }
  alternoOrAsientoRep(){
    const orgSi = this.formGroup.get('orgSi')?.value;
    let orgNo = this.formGroup.get('orgNo')?.value;
    this.cdr.detectChanges();

    if (orgSi){
      this.formGroup.get('alterno')?.addValidators(Validators.required)
      this.formGroup.get('alterno')?.updateValueAndValidity();
      this.formGroup.get('asientoRegistralRep')?.setValidators(
        Validators.pattern('^[0-9a-zA-ZÀ-ÿ](?:(?:[- ][0-9a-zA-ZÀ-ÿ])?[0-9a-zA-ZÀ-ÿ]*)*$')
      );
      this.formGroup.get('asientoRegistralRep')?.updateValueAndValidity();
      this.formGroup.get('asientoRegistralRep')?.setValue('');
    } else if (orgNo) {
      this.formGroup.get('alterno')?.clearValidators();
      this.formGroup.get('alterno')?.updateValueAndValidity();
      this.formGroup.get('alterno')?.setValue(null);
      this.formGroup.get('asientoRegistralRep')?.addValidators(Validators.required)
      this.formGroup.get('asientoRegistralRep')?.updateValueAndValidity();
    } else{
      this.formGroup.get('asientoRegistralRep')?.setValue('');
      this.formGroup.get('alterno')?.setValue(null);
    }
  }
  toggleAlterno(event: any, value: boolean) {
    const isChecked = event.target.checked;
    if (isChecked) {
      this.formGroup.get('alterno')?.setValue(value);
    } else {
      const currentValue = this.formGroup.get('alterno')?.value;
      if (currentValue === value) {
        event.target.checked = true;
      }
    }
    console.log(this.formGroup.get('alterno')?.value)
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
