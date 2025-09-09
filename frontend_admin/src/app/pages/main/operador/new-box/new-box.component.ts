import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TypeDocument } from 'src/app/models/notifications/notification';
import { Box, TypeAccreditation } from 'src/app/models/users/user';
import { BoxRequest } from 'src/app/models/users/user-request';
import { UserService } from 'src/app/services/user.service';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { FileUploadControl, FileUploadValidators } from '@iplab/ngx-file-upload';
import { Profile } from 'src/app/transversal/enums/global.enum';
import { SeguridadService } from 'src/app/services/seguridad.service';
import {
  LBL_ADD_FILES, LBL_ERROR_MAX_LENGTH_NAME, LBL_ERROR_ONLY_FILE, LBL_FEATURES_FILE, MAXFILES, MAX_LENGTH_NAME_FILES, MAX_TAM_FILES_10, MIN_TAM_FILES,
  LBL_ERROR_MAX_SIZE_FILE, LBL_ERROR_MAX_FILES
} from '../../../../shared/constantes';
import { DatePipe } from '@angular/common';
import { Departamento, Distrito, Provincia } from 'src/app/models/ubigeo';
import { PersonService } from 'src/app/services/person.service';
import { Cargo } from 'src/app/models/Cargo';
import { TipoDocumento_CE, TipoDocumento_DNI } from 'src/app/constants/codePhone';

interface Filtro {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-nueva-casilla',
  templateUrl: './new-box.component.html',
  styleUrls: ['./new-box.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NewBoxComponent implements OnInit {

  constructor(
    private userService: UserService,
    private funcionesService: FuncionesService,
    private router: Router,
    private fb: FormBuilder,
    private renderer: Renderer2,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private seguridadService: SeguridadService,
    private personService: PersonService
  ) {
    this.dateMax = this.datePipe.transform(this.toDay, 'yyyy-MM-dd');
  }

  get esAdministrador() {
    const typeProfile = this.seguridadService.getUserProfile();
    return typeProfile === Profile.Administrador || typeProfile === Profile.RegistryOperator;
  }
  @ViewChild('fileUpload', { static: false }) fileUpload: ElementRef;

  departamentoList: Array<Departamento> = [];
  provinciaList: Array<Provincia> = [];
  distritoList: Array<Distrito> = [];
  provinciaListPJ: Array<Provincia> = [];
  distritoListPJ: Array<Distrito> = [];
  load = false;
  boxRequest: BoxRequest = new BoxRequest();
  box: Box = new Box();
  typeAccreditationSelected = '';
  name = '';
  documentTypeSelected = '';
  documentTypeSelectedRep = '';
  maxlengthNumDoc: number;
  minlengthNumDoc: number;
  maxlengthNumDocRep: number;
  minlengthNumDocRep: number;
  listTypeAcreditation: TypeAccreditation[];
  loading = false;
  presidente = false;
  representanteLegalOP = true;
  presidenteOEC = false;
  inputDisabled = false;
  checkBoxDisabled = true;
  deshabilitado = false;
  btnTesorero: Boolean | undefined = false;
  btnRepresentante: Boolean | undefined = false;
  btnPresidente: Boolean | undefined = false;
  placeHolder = 'Ingrese número ';
  Formulario!: FormGroup;
  nombres: FormControl = new FormControl({ value: '', disabled: true });
  apPaterno: FormControl = new FormControl({ value: '', disabled: true });
  apMaterno: FormControl = new FormControl({ value: '', disabled: true });
  fm_direccion: FormControl = new FormControl({ value: '', disabled: true }, [Validators.required,
    Validators.minLength(5),
    Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);
  especifiqueDoc: FormControl = new FormControl({ value: '', disabled: true });
  fm_direccion_PJ: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.minLength(5)]);
  fm_cargo: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required]);
  fm_paginawebPJ: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.pattern('^(https?:\\/\\/)?(www\\.)[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,4}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$|^(https?:\\/\\/)?(www\\.)?(?!ww)[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,4}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$')]);
  fm_correo: FormControl = new FormControl({ value: '', disabled: true }, [Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
  fm_correo_pj: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
  fm_organizacion: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, []);
  fm_nroExpediente: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);
  fm_txtfechapres: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required]);
  fm_razon_social: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required]);
  fm_observacion: FormControl = new FormControl({ value: '', disabled: true }, [Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);
  // fm_electoral_process: FormControl = new FormControl({ value: '', disabled: false });
  fm_numerodoc: FormControl = new FormControl({ value: '' , disabled: true}, [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s{2,})(?!.*--)(?!.*-$)[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+([\s-]+[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/)]);
  fm_numerodoc_rep: FormControl = new FormControl({ value: '' }, [Validators.required]);

  fileLoad: any;
  public fileToUpload: File;
  uploadedFiles: Array<File> = [];
  uploadedFilesRep: Array<File> = [];
  uploadedFilesCiu: Array<File> = [];
  uploadedFilesValid: Array<File> = [];
  revision: Array<File> = [];
  cargoLst: Array<Cargo> = [];
  btype = true;
  errmaxLengthName = false;
  errmaxSizeFile = false;
  errminSizeFile = false;
  errorOnlyFile = false;
  errmaxFiles = false;
  errduplicate = false;
  maxFiles: number = MAXFILES;
  maxSizeFile: number = MAX_TAM_FILES_10;
  minSizeFile: number = MIN_TAM_FILES;
  maxLengthName: number = MAX_LENGTH_NAME_FILES;
  lblAddFiles: string = LBL_ADD_FILES;
  lblFeaturesFile: string = LBL_FEATURES_FILE;
  lblErrorOnlyFile: string = LBL_ERROR_ONLY_FILE;
  lblErrorMaxLengthName: string = LBL_ERROR_MAX_LENGTH_NAME;
  lblErrorMaxSizeFile: string = LBL_ERROR_MAX_SIZE_FILE;
  lblErrorMaxFiles: string = LBL_ERROR_MAX_FILES;
  txtfechapres = '';
  dateMax = '';
  toDay = new Date();
  maxsize_ = 10485760;
  ext = 'pdf jpg jpeg png bmp PDF JPG JPEG PNG BMP';
  err_max_files = false;
  err_format = false;
  err_size = false;
  err_size_name = false;
  err_duplicados = false;
  maxlengtht = 8;
  minlengtht = 8;
  maxlengthr = 8;
  minlengthr = 8;
  maxlengthp = 8;
  minlengthp = 8;
  listProcesses = [];
  existData = true;
  typeDocument: TypeDocument[] = [
    { id: 'dni', value: 'DNI' },
    { id: 'ce', value: 'Carnet de Extranjería' },
    { id: 'ruc', value: 'RUC' },
    { id: 'pr', value: 'Partida Registral' },
  ];

  typeDocument2: TypeDocument[] = [
    { id: 'dni', value: 'DNI' },
    { id: 'ce', value: 'Carnet de Extranjería' },
  ];

  tipoDocumentoAdjunto = [
    { id: '1', value: 'Documento que acredita su representación en la Organización Pública' },
    { id: '2', value: 'Documento que acredita su representación en la Institución Pública/Privada' }
  ];
  cargos = [
    { codigo: '1', nombre: 'Representante Legal' },
    { codigo: '2', nombre: 'Personero Legal Titular' },
  ];
  cargoList: any = [
    { id: '3', value: 'Tesorero' },
    { id: '4', value: 'Representante Legal OP' },
    { id: '5', value: 'Presidente' },
    { id: '6', value: 'Presidente del OEC' }
  ];

  datosTesorero: string[] = ['fm_apellidoPaternoTesorero', 'fm_apellidoMaternoTesorero', 'fm_nombresTesorero', 'fm_documentoTesorero', 'fm_tipoDocumentoTesorero', 'fm_emailTesorero', 'fm_celularTesorero'];
  datosRepresentante: string[] = ['fm_apellidoPaternoRepre', 'fm_apellidoMaternoRepre', 'fm_nombresRepre', 'fm_documentoRepre', 'fm_tipoDocumentoRepre', 'fm_emailRepre', 'fm_celularRepre'];
  datosPresidente: string[] = ['fm_apellidoPaternoPresi', 'fm_apellidoMaternoPresi', 'fm_nombresPresi', 'fm_documentoPresi', 'fm_tipoDocumentoPresi', 'fm_emailPresi', 'fm_celularPresi'];
  datosPresidenteOEC: string[] = ['fm_apellidoPaternoPresiOEC', 'fm_apellidoMaternoPresiOEC', 'fm_nombresPresiOEC', 'fm_documentoPresiOEC', 'fm_tipoDocumentoPresiOEC', 'fm_emailPresiOEC', 'fm_celularPresiOEC'];

  isCE = false;
  isPR = false;
  isCERep = false;
  cargoActive = false;
  cargoSelect = false;
  lblNombre = 'Nombres';
  lblApPat = 'Apellido paterno';
  lblApMat = 'Apellido materno';

  txtButtonRepresentanteLegalOP = 'Agregar Representante Legal OP';
  txtButtonPresidente = 'Agregar Presidente';
  txtButtonPresidenteOEC = 'Agregar Presidente del OEC';

  // ----------------------------

  filesControl = new FormControl(null, [
    Validators.required,
    FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({ minSize: this.minSizeFile, maxSize: this.maxSizeFile }),
    this.noWhitespaceValidator,
  ]);

  filesControlRep = new FormControl(null, [
    Validators.required,
    FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({ minSize: this.minSizeFile, maxSize: this.maxSizeFile }),
    this.noWhitespaceValidator,
  ]);

  filesControlCiu = new FormControl(null, [
    Validators.required,
    FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({ minSize: this.minSizeFile, maxSize: this.maxSizeFile }),
    this.noWhitespaceValidator,
  ]);

  protected readonly screenLeft = screenLeft;

  ngOnInit(): void {
    this.buildForm();
    this.getTypeAcreditacion();
    this.listarDepartamento();
    this.listarProcesos();
    this.validators();
    this.fm_numerodoc.setValue('');
  }

  /// ----------------------------
  private buildForm = () => {
    this.Formulario = this.fb.group({
      fm_optiontipo: this.fb.control({value: '', disabled: this.inputDisabled}, [Validators.required]),
      fm_departamentoList: this.fb.control({value: '', disabled: true}, [Validators.required]),
      fm_departamentoListPJ: this.fb.control({value: '', disabled: this.inputDisabled}, [Validators.required]),
      fm_provinciaList: this.fb.control({value: '', disabled: true}, [Validators.required]),
      fm_provinciaListPJ: this.fb.control({value: '', disabled: this.inputDisabled}, [Validators.required]),
      fm_distritoList: this.fb.control({value: '', disabled: true}, [Validators.required]),
      fm_distritoListPJ: this.fb.control({value: '', disabled: this.inputDisabled}, [Validators.required]),
      fm_optiontipo_rep: this.fb.control({value: '', disabled: this.inputDisabled}, [Validators.required]),
      fm_tipoDocumentoAdjunto: this.fb.control({value: '', disabled: this.inputDisabled}, [Validators.required]),
      fm_razon_social: this.fm_razon_social,
      fm_partida_registral: this.fb.control(''),
      fm_asiento_registral: this.fb.control('', [Validators.required] ),
      fm_observacion: this.fm_observacion,
      fm_candidate: [null],
      // fm_electoral_process: this.fm_electoral_process,
      fm_electoral_process: this.fb.control({value: '', disabled: this.inputDisabled}, []),
      fm_organizacion: this.fm_organizacion,
      fm_numerodoc: this.fm_numerodoc,
      fm_numerodoc_rep: this.fm_numerodoc_rep,
      nombres: this.nombres,
      apPaterno: this.apPaterno,
      apMaterno: this.apMaterno,
      fm_correo: this.fm_correo,
      fm_correo_pj: this.fm_correo_pj,
      fm_phone: this.fb.control({ value: '', disabled: true }, [
        Validators.minLength(6),
        this.validatorRepeatFijo,
      ]),
      fm_phone_pj: this.fb.control({ value: '', disabled: this.inputDisabled }, [
        Validators.minLength(6),
        this.validatorRepeatFijo,
      ]),
      fm_celular: this.fb.control({ value: '', disabled: true }, [
        Validators.required,
        Validators.minLength(9),
        this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')
      ]),
      fm_mobilePhone_pj: this.fb.control({ value: '', disabled: this.inputDisabled }, [
        Validators.required,
        Validators.minLength(9),
        this.validatorRepeatMovil,
      ]),
      fm_cargo: this.fm_cargo,
      fm_paginawebPJ: this.fm_paginawebPJ,
      fm_direccion: this.fm_direccion,
      especifiqueDoc: this.especifiqueDoc,
      fm_direccion_PJ: this.fm_direccion_PJ,
      fm_nroExpediente: this.fm_nroExpediente,
      fm_txtfechapres: this.fm_txtfechapres,
      fm_asiento_registral_rep: this.fb.control(''),
      files: this.filesControl,
      filesRep: this.filesControlRep,
      filesCiu: this.filesControlCiu,

      fm_orgSi: [false],
      fm_orgNo: [false],
      alterno: [null],
      // TESORERO
      fm_cargoTesorero: [{value: this.cargoList[0], disabled: true}],
      fm_tipoDocumentoTesorero: [''],
      fm_documentoTesorero: [{value: '', disabled: true}],
      fm_apellidoPaternoTesorero: [{value: '', disabled: true}],
      fm_apellidoMaternoTesorero: [{value: '', disabled: true}],
      fm_nombresTesorero: [{value: '', disabled: true}],
      fm_emailTesorero: ['', [ Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      fm_celularTesorero: ['', this.validatorRepeatFijo],

      // REPRESENTANTE LEGAL OP
      fm_cargoRepre: [{value: this.cargoList[1], disabled: true}],
      fm_tipoDocumentoRepre: ['', null],
      fm_documentoRepre: [{value: '', disabled: true}],
      fm_apellidoPaternoRepre: [{value: '', disabled: true}],
      fm_apellidoMaternoRepre: [{value: '', disabled: true}],
      fm_nombresRepre: [{value: '', disabled: true}],
      fm_emailRepre: [''],
      fm_celularRepre: [''],

      // PRESIDENTE
      fm_cargoPresi: [{value: this.cargoList[2], disabled: true}],
      fm_tipoDocumentoPresi: [''],
      fm_documentoPresi: [{value: '', disabled: true}],
      fm_apellidoPaternoPresi: [{value: '', disabled: true}],
      fm_apellidoMaternoPresi: [{value: '', disabled: true}],
      fm_nombresPresi: [{value: '', disabled: true}],
      fm_emailPresi: ['', [Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      fm_celularPresi: ['', this.validatorRepeatFijo],

      // PRESIDENTE OEC
      fm_cargoPresiOEC: [{value: this.cargoList[3], disabled: true}],
      fm_tipoDocumentoPresiOEC: [''],
      fm_documentoPresiOEC: [{value: '', disabled: true}],
      fm_apellidoPaternoPresiOEC: [{value: '', disabled: true}],
      fm_apellidoMaternoPresiOEC: [{value: '', disabled: true}],
      fm_nombresPresiOEC: [{value: '', disabled: true}],
      fm_emailPresiOEC: ['', [Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      fm_celularPresiOEC: ['', this.validatorRepeatFijo],
    }, { validators: this.apellidoRequerido.bind(this) });
    this.Formulario.controls.files.disable();
    this.getNumeroDocumento();
    this.getNumeroDocumentoRep();
  }
  apellidoRequerido(formGroup: FormGroup) {
    const grupos: [string, string][] = [
      ['apPaterno' , 'apMaterno'],
      this.cargoActive ? ['fm_apellidoPaternoTesorero', 'fm_apellidoMaternoTesorero'] : null,
      this.representanteLegalOP ? ['fm_apellidoPaternoRepre', 'fm_apellidoMaternoRepre'] : null,
      this.presidente ? ['fm_apellidoPaternoPresi', 'fm_apellidoMaternoPresi'] : null,
      this.presidenteOEC ? ['fm_apellidoPaternoPresiOEC', 'fm_apellidoMaternoPresiOEC'] : null
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
    this.cargoActive = false;
    this.presidente = false;
    this.representanteLegalOP = false;
  }

  cargo(e: any){
    this.cargoLst = [];
    if (e.source.name === 'fm_orgSi' && e.checked){
      this.Formulario.get('fm_orgNo')?.setValue(false);
      this.cargoLst.push(this.cargos[1]);
      this.Formulario.get('fm_cargo')?.setValue(this.cargos[1]);
      this.cargoActive = true;
      this.cargoSelect = true;
      this.validarFormulario(true);
    }
    if (e.source.name === 'fm_orgNo' && e.checked) {
      this.Formulario.get('fm_orgSi')?.setValue(false);
      this.cargoLst.push(this.cargos[0]);
      this.Formulario.get('fm_cargo')?.setValue(this.cargos[0]);
      this.cargoActive = false;
      this.cargoSelect = true;
      this.presidente ? this.agregarPresidente() : this.presidente = false;
      this.representanteLegalOP ? this.agregarRepresentanteLegalOP() : this.representanteLegalOP = false;
      this.presidenteOEC ? this.agregarPresidenteOEC() : this.presidenteOEC = false;
      this.validarFormulario(false);
    }
    if (!e.checked){
      this.Formulario.get('fm_cargo')?.setValue('');
      this.cargoActive = false;
      this.cargoSelect = false;
      this.presidente ? this.agregarPresidente() : this.presidente = false;
      this.representanteLegalOP ? this.agregarRepresentanteLegalOP() : this.representanteLegalOP = false;
      this.presidenteOEC ? this.agregarPresidenteOEC() : this.presidenteOEC = false;
      this.validarFormulario(false);
    }
    this.alternoOrAsientoRep();
  }
  toggleAlterno(event: any, value: boolean) {
    if (event.checked) {
      this.Formulario.get('alterno')?.setValue(value);
    } else {
      event.source.checked = true;
      this.Formulario.get('alterno')?.setValue(value);
    }
  }
  toggleCandidate(event: any, value: boolean) {
    if (event.checked) {
      this.Formulario.get('fm_candidate')?.setValue(value);
    } else {
      event.source.checked = true;
      this.Formulario.get('fm_candidate')?.setValue(value);
    }
  }
  toggleCheckbox(event: any, value: boolean, label: string){
    if (event.checked) {
      this.Formulario.get(label)?.setValue(value);
    } else {
      event.source.checked = true;
      this.Formulario.get(label)?.setValue(value);
    }
  }
  changeCandidate(){
    const change = this.Formulario.get('fm_candidate').value;
    if (change){
      this.Formulario.get('fm_electoral_process')?.setValidators(Validators.required);
      this.Formulario.get('fm_electoral_process')?.updateValueAndValidity();
    }else{
      this.Formulario.get('fm_electoral_process').clearValidators();
      this.Formulario.get('fm_electoral_process').setValue('');
    }
  }
  alternoOrAsientoRep(){
    const orgSi = this.Formulario.get('fm_orgSi')?.value;
    const orgNo = this.Formulario.get('fm_orgNo')?.value;
    this.cdr.detectChanges();

    if (orgSi){
      this.Formulario.get('alterno')?.setValidators(Validators.required);
      this.Formulario.get('alterno')?.updateValueAndValidity();
      this.Formulario.get('fm_asiento_registral_rep')?.setErrors(null);
      this.Formulario.get('fm_asiento_registral_rep')?.setValidators(
        Validators.pattern('^[0-9a-zA-ZÀ-ÿ](?:(?:[- ][0-9a-zA-ZÀ-ÿ])?[0-9a-zA-ZÀ-ÿ]*)*$')
      );
      this.Formulario.get('fm_asiento_registral_rep')?.updateValueAndValidity();
      this.Formulario.get('fm_asiento_registral_rep')?.setValue('');
    } else if (orgNo) {
      this.Formulario.get('alterno')?.clearValidators();
      this.Formulario.get('alterno')?.updateValueAndValidity();
      this.Formulario.get('alterno')?.setValue(null);
      this.Formulario.get('fm_asiento_registral_rep')?.setErrors(null);
      this.Formulario.get('fm_asiento_registral_rep')?.setValidators(Validators.required);
      this.Formulario.get('fm_asiento_registral_rep')?.updateValueAndValidity();
    }else{
      this.Formulario.get('alterno')?.clearValidators();
      this.Formulario.get('alterno')?.updateValueAndValidity();
      this.Formulario.get('alterno')?.setValue(null);
      this.Formulario.get('fm_asiento_registral_rep')?.setErrors(null);
      this.Formulario.get('fm_asiento_registral_rep')?.setValidators(
        Validators.pattern('^[0-9a-zA-ZÀ-ÿ](?:(?:[- ][0-9a-zA-ZÀ-ÿ])?[0-9a-zA-ZÀ-ÿ]*)*$')
      );
      this.Formulario.get('fm_asiento_registral_rep')?.updateValueAndValidity();
      this.Formulario.get('fm_asiento_registral_rep')?.setValue('');
    }
  }
  habilitarcampos(){
    this.fm_correo.enable();
    this.fm_numerodoc.enable();
    this.Formulario.controls.files.enable();
    this.Formulario.get('fm_departamentoList').enable();
    this.Formulario.get('fm_provinciaList').enable();
    this.Formulario.get('fm_distritoList').enable();
    this.Formulario.get('fm_phone').enable();
    this.Formulario.get('fm_celular').enable();
    this.fm_direccion.enable();
    this.fm_observacion.enable();
    this.checkBoxDisabled = false;
  }

  validarFormulario(cargo: boolean){
    this.cdr.detectChanges();
    const required = cargo ? [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)] : null;
    const required2 = cargo ? [Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)] : null;
    const requiredCel = cargo ? [Validators.required, Validators.minLength(9), this.validatorRepeatFijo, Validators.pattern('^9[0-9]*$')] : null;
    const requiredEmail = cargo ? [Validators.email, Validators.required,
      Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')] : null;
    this.Formulario.get('fm_tipoDocumentoTesorero')?.setValue('');
    this.Formulario.get('fm_tipoDocumentoTesorero')?.setValidators(required);
    this.Formulario.get('fm_tipoDocumentoTesorero')?.updateValueAndValidity();
    this.Formulario.get('fm_documentoTesorero')?.setValue('');
    this.Formulario.get('fm_documentoTesorero')?.setValidators(required);
    this.Formulario.get('fm_documentoTesorero')?.updateValueAndValidity();
    this.Formulario.get('fm_documentoTesorero')?.disable();
    this.Formulario.get('fm_apellidoPaternoTesorero')?.setValue('');
    this.Formulario.get('fm_apellidoPaternoTesorero')?.setValidators(required2);
    this.Formulario.get('fm_apellidoPaternoTesorero')?.updateValueAndValidity();
    this.Formulario.get('fm_apellidoPaternoTesorero')?.disable();
    this.Formulario.get('fm_apellidoMaternoTesorero')?.setValue('');
    this.Formulario.get('fm_apellidoMaternoTesorero')?.setValidators(required2);
    this.Formulario.get('fm_apellidoMaternoTesorero')?.updateValueAndValidity();
    this.Formulario.get('fm_apellidoMaternoTesorero')?.disable();
    this.Formulario.get('fm_nombresTesorero')?.setValue('');
    this.Formulario.get('fm_nombresTesorero')?.setValidators(required);
    this.Formulario.get('fm_nombresTesorero')?.updateValueAndValidity();
    this.Formulario.get('fm_nombresTesorero')?.disable();
    this.Formulario.get('fm_emailTesorero')?.setValue('');
    this.Formulario.get('fm_emailTesorero')?.setValidators(requiredEmail);
    this.Formulario.get('fm_emailTesorero')?.updateValueAndValidity();
    this.Formulario.get('fm_celularTesorero')?.setValue('');
    this.Formulario.get('fm_celularTesorero')?.setValidators(requiredCel);
    this.Formulario.get('fm_celularTesorero')?.updateValueAndValidity();
  }

  agregarPresidente(){
    this.presidente = !this.presidente;
    this.updateForm(this.presidente, this.datosPresidente);
    this.txtButtonPresidente = (this.presidente) ? 'Remover Presidente' : 'Agregar Presidente';
  }

  agregarRepresentanteLegalOP(){
    this.representanteLegalOP = !this.representanteLegalOP; // true fistTime
    this.updateForm(this.representanteLegalOP, this.datosRepresentante);
    this.txtButtonRepresentanteLegalOP = (this.representanteLegalOP) ? 'Remover Representante Legal OP' : ' Agregar Representante Legal OP';
  }
  agregarPresidenteOEC(){
    this.presidenteOEC = !this.presidenteOEC;
    this.updateForm(this.presidenteOEC, this.datosPresidenteOEC);
    this.txtButtonPresidenteOEC = (this.presidenteOEC) ? 'Remover Presidente del OEC' : ' Agregar Presidente del OEC';
  }

  toggleFormRepresentanteLegalOP(cargo: boolean){
    this.cdr.detectChanges();
    const required = cargo ? [Validators.required] : null;
    const requiredCel = cargo ? [Validators.required, this.validatorRepeatFijo] : null;
    const requiredEmail = cargo ? [Validators.email,
      Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')] : null;
    this.Formulario.get('fm_tipoDocumentoRepre')?.setValue('');
    this.Formulario.get('fm_tipoDocumentoRepre')?.setValidators(required);
    this.Formulario.get('fm_tipoDocumentoRepre')?.updateValueAndValidity();
    this.Formulario.get('fm_documentoRepre')?.setValue('');
    this.Formulario.get('fm_documentoRepre')?.setValidators(required);
    this.Formulario.get('fm_documentoRepre')?.updateValueAndValidity();
    this.Formulario.get('fm_documentoRepre')?.disable();
    this.Formulario.get('fm_apellidoPaternoRepre')?.setValue('');
    this.Formulario.get('fm_apellidoPaternoRepre')?.setValidators(required);
    this.Formulario.get('fm_apellidoPaternoRepre')?.updateValueAndValidity();
    this.Formulario.get('fm_apellidoPaternoRepre')?.disable();
    this.Formulario.get('fm_apellidoMaternoRepre')?.setValue('');
    this.Formulario.get('fm_apellidoMaternoRepre')?.setValidators(required);
    this.Formulario.get('fm_apellidoMaternoRepre')?.updateValueAndValidity();
    this.Formulario.get('fm_apellidoMaternoRepre')?.disable();
    this.Formulario.get('fm_nombresRepre')?.setValue('');
    this.Formulario.get('fm_nombresRepre')?.setValidators(required);
    this.Formulario.get('fm_nombresRepre')?.updateValueAndValidity();
    this.Formulario.get('fm_nombresRepre')?.disable();
    this.Formulario.get('fm_emailRepre')?.setValue('');
    this.Formulario.get('fm_emailRepre')?.setValidators(requiredEmail);
    this.Formulario.get('fm_emailRepre')?.updateValueAndValidity();
    this.Formulario.get('fm_celularRepre')?.setValue('');
    this.Formulario.get('fm_celularRepre')?.setValidators(requiredCel);
    this.Formulario.get('fm_celularRepre')?.updateValueAndValidity();
  }

  desactivarFom(cargo: boolean){
    this.cdr.detectChanges();
    const required = cargo ? [Validators.required] : null;
    const requiredCel = cargo ? [Validators.required, this.validatorRepeatFijo] : null;
    const requiredEmail = cargo ? [Validators.email, Validators.required,
      Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')] : null;
    this.Formulario.get('fm_tipoDocumentoPresi')?.setValue('');
    this.Formulario.get('fm_tipoDocumentoPresi')?.setValidators(required);
    this.Formulario.get('fm_tipoDocumentoPresi')?.updateValueAndValidity();
    this.Formulario.get('fm_documentoPresi')?.setValue('');
    this.Formulario.get('fm_documentoPresi')?.setValidators(required);
    this.Formulario.get('fm_documentoPresi')?.updateValueAndValidity();
    this.Formulario.get('fm_documentoPresi')?.disable();
    this.Formulario.get('fm_apellidoPaternoPresi')?.setValue('');
    this.Formulario.get('fm_apellidoPaternoPresi')?.setValidators(required);
    this.Formulario.get('fm_apellidoPaternoPresi')?.updateValueAndValidity();
    this.Formulario.get('fm_apellidoPaternoPresi')?.disable();
    this.Formulario.get('fm_apellidoMaternoPresi')?.setValue('');
    this.Formulario.get('fm_apellidoMaternoPresi')?.setValidators(required);
    this.Formulario.get('fm_apellidoMaternoPresi')?.updateValueAndValidity();
    this.Formulario.get('fm_apellidoMaternoPresi')?.disable();
    this.Formulario.get('fm_nombresPresi')?.setValue('');
    this.Formulario.get('fm_nombresPresi')?.setValidators(required);
    this.Formulario.get('fm_nombresPresi')?.updateValueAndValidity();
    this.Formulario.get('fm_nombresPresi')?.disable();
    this.Formulario.get('fm_emailPresi')?.setValue('');
    this.Formulario.get('fm_emailPresi')?.setValidators(requiredEmail);
    this.Formulario.get('fm_emailPresi')?.updateValueAndValidity();
    this.Formulario.get('fm_celularPresi')?.setValue('');
    this.Formulario.get('fm_celularPresi')?.setValidators(requiredCel);
    this.Formulario.get('fm_celularPresi')?.updateValueAndValidity();
  }
  updateForm(value: boolean, cargo: any){
    this.cdr.detectChanges();
    const required = value ? [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)] : null;
    const required2 = value ? [Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)] : null;
    const requiredCel = value ? [Validators.required, Validators.minLength(9), this.validatorRepeatFijo, Validators.pattern('^9[0-9]*$')] : null;
    const requiredEmail = value ?
      [Validators.email, Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')] : null;
    this.Formulario.get(cargo[4])?.setValue('');
    this.Formulario.get(cargo[4])?.setValidators(required);
    this.Formulario.get(cargo[4])?.updateValueAndValidity();
    this.Formulario.get(cargo[3])?.setValue('');
    this.Formulario.get(cargo[3])?.setValidators(required);
    this.Formulario.get(cargo[3])?.updateValueAndValidity();
    this.Formulario.get(cargo[3])?.disable();
    this.Formulario.get(cargo[0])?.setValue('');
    this.Formulario.get(cargo[0])?.setValidators(required2);
    this.Formulario.get(cargo[0])?.updateValueAndValidity();
    this.Formulario.get(cargo[0])?.disable();
    this.Formulario.get(cargo[1])?.setValue('');
    this.Formulario.get(cargo[1])?.setValidators(required2);
    this.Formulario.get(cargo[1])?.updateValueAndValidity();
    this.Formulario.get(cargo[1])?.disable();
    this.Formulario.get(cargo[2])?.setValue('');
    this.Formulario.get(cargo[2])?.setValidators(required);
    this.Formulario.get(cargo[2])?.updateValueAndValidity();
    this.Formulario.get(cargo[2])?.disable();
    this.Formulario.get(cargo[5])?.setValue('');
    this.Formulario.get(cargo[5])?.setValidators(requiredEmail);
    this.Formulario.get(cargo[5])?.updateValueAndValidity();
    this.Formulario.get(cargo[6])?.setValue('');
    this.Formulario.get(cargo[6])?.setValidators(requiredCel);
    this.Formulario.get(cargo[6])?.updateValueAndValidity();
  }
  tipoDocumento(event: any, campo: string){
    const value = event.source.value;
    let nombre = '';
    let parteno = '';
    let materno = '';
    this.cdr.detectChanges();
    if (campo === 'fm_documentoTesorero'){
      parteno = this.datosTesorero[0];
      materno = this.datosTesorero[1];
      nombre = this.datosTesorero[2];
      this.maxlengtht = (value === TipoDocumento_DNI) ? 8 : 9;
      this.maxlengtht = (value === TipoDocumento_DNI) ? 8 : 9;
    } else if (campo === 'fm_documentoRepre'){
      parteno = this.datosRepresentante[0];
      materno = this.datosRepresentante[1];
      nombre = this.datosRepresentante[2];
      this.maxlengthr = (value === TipoDocumento_DNI) ? 8 : 9;
      this.maxlengthr = (value === TipoDocumento_DNI) ? 8 : 9;
    } else if (campo === 'fm_documentoPresi'){
      parteno = this.datosPresidente[0];
      materno = this.datosPresidente[1];
      nombre = this.datosPresidente[2];
      this.maxlengthp = (value === TipoDocumento_DNI) ? 8 : 9;
      this.maxlengthp = (value === TipoDocumento_DNI) ? 8 : 9;
    } else if (campo === 'fm_documentoPresiOEC'){
      parteno = this.datosPresidenteOEC[0];
      materno = this.datosPresidenteOEC[1];
      nombre = this.datosPresidenteOEC[2];
      this.maxlengthp = (value === TipoDocumento_DNI) ? 8 : 9;
      this.maxlengthp = (value === TipoDocumento_DNI) ? 8 : 9;
    }
    if (value !== ''){
      this.Formulario.get(campo)?.enable();
      if (value === TipoDocumento_DNI) {
        this.Formulario.get(nombre)?.disable();
        this.Formulario.get(parteno)?.disable();
        this.Formulario.get(materno)?.disable();
        this.Formulario.get(campo)?.enable();
        this.Formulario.get(campo)?.setValue('');
        this.Formulario.get(campo)?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(8)]);
        this.Formulario.get(campo)?.updateValueAndValidity();
      }
      if (value === TipoDocumento_CE) {
        this.Formulario.get(nombre)?.enable();
        this.Formulario.get(parteno)?.enable();
        this.Formulario.get(materno)?.enable();
        this.Formulario.get(campo)?.enable();
        this.Formulario.get(campo)?.setValue('');
        this.Formulario.get(campo)?.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(9)]);
        this.Formulario.get(campo)?.updateValueAndValidity();
      }
    }else{
      this.Formulario.get(nombre)?.disable();
      this.Formulario.get(parteno)?.disable();
      this.Formulario.get(materno)?.disable();
      this.Formulario.get(campo)?.disable();
      this.Formulario.get(campo)?.setValue('');
      this.Formulario.get(campo)?.updateValueAndValidity();
    }
    this.Formulario.get(nombre)?.setValue('');
    this.Formulario.get(nombre)?.updateValueAndValidity();
    this.Formulario.get(parteno)?.setValue('');
    this.Formulario.get(parteno)?.updateValueAndValidity();
    this.Formulario.get(materno)?.setValue('');
    this.Formulario.get(materno)?.updateValueAndValidity();
  }

  activarBoton(campo: string, campo1: string){
    const doc = (this.Formulario.get(campo)?.value ?? '') as string;
    const docType = (this.Formulario.get(campo1)?.value ?? '') as string;
    if (doc.length === 8 && docType === 'dni'){
      if (campo === 'fm_numerodoc_rep'){
        this.eSearch('representante');
      }else {
        this.sDocument(campo, campo1);
      }
    }
    if (doc.length === 9 && docType === 'ce'){
      if (campo === 'fm_numerodoc_rep'){
        this.eSearch('representante');
      }else {
        this.sDocument(campo, campo1);
      }
    }
  }

  private eResetForm = (level: number) => {
    this.nombres.setValue('');
    this.apPaterno.setValue('');
    this.apMaterno.setValue('');
    this.Formulario.get('fm_numerodoc_rep').setValue('');
    if (level === 6) { return; }
    this.Formulario.get('fm_razon_social').setValue('');
    this.Formulario.get('fm_optiontipo_rep').setValue(null);
    this.fm_organizacion.setValue('');
    this.Formulario.get('fm_numerodoc').setValue('');
    if (level === 5) { return; }
  }

  eChangeDocumento(event: any) {
    this.eResetForm(5);
    this.habilitarcampos();
    this.existData = false;
    this.cargoActive = false;
    this.cargoSelect = false;
    this.documentTypeSelected = event.value;
    this.isCE = this.documentTypeSelected === 'ce';
    this.isPR = false;
    this.Formulario.get('fm_orgSi')?.setValue(false);
    this.Formulario.get('fm_orgNo')?.setValue(false);
    if (this.documentTypeSelected === 'dni') {
      this.minlengthNumDoc = 8;
      this.maxlengthNumDoc = 8;
      this.changeLabelRequired(false);
      this.eChangeType(false);
      this.eChangeRequired(false);
      this.eChangeFile(true);
      this.cargoSelect = true;
      this.apPaterno.disable();
      this.apMaterno.disable();
      this.nombres.disable();
      this.validarFormulario(false);
    } else if (this.documentTypeSelected === 'ce') {
      this.minlengthNumDoc = 9;
      this.maxlengthNumDoc = 9;
      this.changeLabelRequired(true);
      this.eChangeType(true);
      this.eChangeRequired(false);
      this.eChangeFile(true);
      this.cargoSelect = true;
      this.apPaterno.enable();
      this.apMaterno.enable();
      this.nombres.enable();
      this.validarFormulario(false);
    } else if (this.documentTypeSelected === 'ruc') {
      this.minlengthNumDoc = 11;
      this.maxlengthNumDoc = 11;
      this.changeLabelRequired(false);
      this.eChangeType(false);
      this.eChangeRequired(true);
      this.existData = true;
      this.eChangeFile(false);
      this.apPaterno.disable();
      this.apMaterno.disable();
      this.nombres.disable();
      this.Formulario.get('fm_razon_social').disable();
    } else if (this.documentTypeSelected === 'pr') {
      this.isPR = true;
      this.minlengthNumDoc = 3;
      this.maxlengthNumDoc = 50;
      this.changeLabelRequired(false);
      this.eChangeType(false);
      this.eChangeTypepr(true);
      this.eChangeRequired(true);
      this.existData = false;
      this.eChangeFile(false);
      this.apPaterno.disable();
      this.apMaterno.disable();
      this.nombres.disable();
      this.Formulario.get('fm_razon_social').enable();
    }
    this.presidente ? this.agregarPresidente() : this.presidente = false;
    this.representanteLegalOP ? this.agregarRepresentanteLegalOP() : this.representanteLegalOP = false;
    this.presidenteOEC ? this.agregarPresidenteOEC() : this.presidenteOEC = false;
    this.limpiarCampos();
    this.alternoOrAsientoRep();
    this.changeCandidate();
  }
  eChangeFile(status: boolean){
      const required = status ? [Validators.required] : null;
      const required2 = status ? [Validators.required, Validators.minLength(5), Validators.pattern('^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð,.\'" °\\-:;/()]{1,254}$')] : null;
      const a1 = this.Formulario.get('fm_departamentoList');
      const a2 = this.Formulario.get('fm_provinciaList');
      const a3 = this.Formulario.get('fm_distritoList');
      const a4 = this.Formulario.get('fm_direccion');

      a1.setErrors(null);
      a2.setErrors(null);
      a3.setErrors(null);
      a4.setErrors(null);

      a1.setValidators(required);
      a2.setValidators(required);
      a3.setValidators(required);
      a4.setValidators(required2);

      a1.updateValueAndValidity();
      a2.updateValueAndValidity();
      a3.updateValueAndValidity();
      a4.updateValueAndValidity();

      this.btype = status;
  }

  limpiarCampos() {
    this.Formulario.get('fm_departamentoList').reset();
    this.Formulario.get('fm_provinciaList').reset();
    this.Formulario.get('fm_distritoList').reset();
    this.Formulario.get('fm_direccion').setValue('');
    this.Formulario.get('fm_departamentoListPJ').reset();
    this.Formulario.get('fm_provinciaListPJ').reset();
    this.Formulario.get('fm_distritoListPJ').reset();
    this.Formulario.get('fm_optiontipo_rep').reset();
    this.Formulario.get('fm_tipoDocumentoAdjunto').reset();
    this.Formulario.get('fm_razon_social').reset();
    this.Formulario.get('fm_partida_registral').setValue('');
    this.Formulario.get('fm_asiento_registral').setValue('');
    this.Formulario.get('fm_observacion').reset();
    this.Formulario.get('fm_organizacion').reset();
    this.Formulario.get('fm_numerodoc').setValue('');
    this.Formulario.get('fm_numerodoc_rep').setValue('');
    this.Formulario.get('nombres').reset();
    this.Formulario.get('apPaterno').reset();
    this.Formulario.get('apMaterno').reset();
    this.Formulario.get('fm_correo').setValue('');
    this.Formulario.get('fm_correo_pj').setValue('');
    this.Formulario.get('fm_phone').setValue('');
    this.Formulario.get('fm_phone_pj').setValue('');
    this.Formulario.get('fm_celular').reset();
    this.Formulario.get('fm_mobilePhone_pj').reset();
    this.Formulario.get('fm_cargo').reset();
    this.Formulario.get('fm_paginawebPJ').setValue('');
    this.Formulario.get('especifiqueDoc').reset();
    this.Formulario.get('fm_direccion_PJ').setValue('');
    this.Formulario.get('fm_asiento_registral_rep').setValue('');
    this.Formulario.get('filesCiu').setValue([]);
    this.Formulario.get('files').setValue([]);
    this.uploadedFilesCiu = [];
    this.uploadedFiles = [];
    this.Formulario.get('filesRep').setValue([]);
    this.Formulario.get('fm_candidate').setValue(null);
    this.Formulario.get('fm_electoral_process').setValue('');
  }
  eChangeDocumentoAttach(event) {
    const value = event.value;

    if (value === '4') {
      this.Formulario.get('especifiqueDoc').setValidators([Validators.required]);
      this.Formulario.controls.especifiqueDoc.enable();
      this.Formulario.controls.especifiqueDoc.markAllAsTouched();
    } else {
      this.Formulario.get('especifiqueDoc').setValidators(null);
      this.Formulario.controls.especifiqueDoc.disable();
    }
    this.Formulario.get('especifiqueDoc').updateValueAndValidity();

  }

  changeLabelRequired(required: boolean) {
    if (required) {
      this.lblNombre = 'Nombres*';
    } else {
      this.lblNombre = 'Nombres';
    }
  }

  eChangeDocumentoRep(event: any) {
    this.eResetForm(6);
    this.existData = true;
    this.documentTypeSelectedRep = event.value;
    this.isCERep = this.documentTypeSelectedRep === 'ce';
    if (this.documentTypeSelectedRep === 'dni') {
      this.minlengthNumDocRep = 8;
      this.maxlengthNumDocRep = 8;
      this.changeLabelRequired(false);
      this.eChangeType(false);
      this.fm_numerodoc_rep.enable();
      this.apPaterno.disable();
      this.apMaterno.disable();
      this.nombres.disable();
    } else if (this.documentTypeSelectedRep === 'ce') {
      this.minlengthNumDocRep = 9;
      this.maxlengthNumDocRep = 9;
      this.changeLabelRequired(true);
      this.eChangeType(true);
      this.fm_numerodoc_rep.enable();
      this.apPaterno.enable();
      this.apMaterno.enable();
      this.nombres.enable();
    }
  }

  getNumeroDocumento() {
    this.Formulario.get('fm_numerodoc').valueChanges.subscribe((documento) => {
      if (this.documentTypeSelected === 'dni') {
        if (documento.length === this.minlengthNumDoc) {
          this.eSearch('general');
        }
        else {
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
        }
      } else if (this.documentTypeSelected === 'ruc') {
        if (documento.length === this.minlengthNumDoc) {
          const numeroDocumento = this.Formulario.get('fm_numerodoc')?.value;
          if (!numeroDocumento.toString().startsWith('20')){
            this.Formulario.get('fm_numerodoc')?.setValue('');
          }
          else{
            this.eSearch('general');
          }
        } else {
          this.Formulario.get('fm_razon_social').setValue('');
        }
      } else if (this.documentTypeSelected === 'ce') {
        if (documento.length === this.minlengthNumDoc) {
          this.eSearch('general');
        }else{
          this.existData = true;
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
        }
      }
    });
  }

  getNumeroDocumentoRep() {
    /*this.Formulario.get('fm_numerodoc_rep').valueChanges.subscribe((documento) => {
      if (this.documentTypeSelectedRep == 'dni') {
        if (documento.length == this.minlengthNumDocRep) {
          this.eSearch('representante');
        }
        else {
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
        }
      }
      else if (this.documentTypeSelectedRep == 'ruc') {
        if (documento.length == this.minlengthNumDocRep) {
          this.eSearch('representante');
        }
      }
      else if (this.documentTypeSelectedRep === 'ce') {
        if (documento.length === this.minlengthNumDocRep) {
          this.eSearch('representante');
        } else {
          this.existData = true;
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
        }
      }
    });*/
  }

  private eChangeType = (status) => {
    const required = status ? [
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(
        /^(?!.*[(),:;\/])([a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð](?!.*\s{2,})(?!.*\s$)[a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'\"-°]*)$/
      )
    ] : null;

    const required2 = status ? [
      Validators.minLength(2),
      Validators.pattern(
        /^(?!.*[(),:;\/])([a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð](?!.*\s{2,})(?!.*\s$)[a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'\"-°]*)$/
      )
    ] : null;

    this.nombres.setErrors(null);
    this.apPaterno.setErrors(null);
    this.apMaterno.setErrors(null);

    this.nombres.setValidators(required);
    this.apPaterno.setValidators(required2);
    this.apMaterno.setValidators(required2);

    this.nombres.updateValueAndValidity();
    this.apPaterno.updateValueAndValidity();
    this.apMaterno.updateValueAndValidity();
  }

  private eChangeTypepr = (status: boolean) => {
    const required = status ? [
      Validators.required,
      Validators.pattern(
        '^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.\'"-°]+$'
      ),
    ] : null;
    const required2 = status ? [
      Validators.required,
      Validators.pattern(/^(?!\s)(?!.*\s{2,})(?!.*--)(?!.*-$)[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+([\s-]+[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/)
    ] : null;

    // this.Formulario.get('fm_numerodoc').setValidators(required2);
    // this.Formulario.get('fm_numerodoc').updateValueAndValidity();
    this.nombres.setErrors(null);
    this.nombres.setValidators(required);
    this.nombres.updateValueAndValidity();
  }

  validatorFile(name: string) {
    this.err_max_files = false;
    this.err_format = false;
    this.err_size = false;
    this.err_size_name = false;
    this.err_duplicados = false;
    const size = this.Formulario.controls[name].value.length || 0;
    this.uploadedFilesValid = this.Formulario.controls[name].value;

    if (size !== 0) {
      for (let index = 0; index < this.uploadedFilesValid.length; index++) {
        const doc = this.Formulario.controls[name].value[index];
        let type = doc.name.split('.');
        type = type[type.length - 1];
        if (this.ext.indexOf(type) === -1 ) {
          delete (this.uploadedFilesValid[index]);
          this.err_format = true;
        }

        if (doc.size >= this.maxsize_) {
          delete (this.uploadedFilesValid[index]);
          this.err_size = true;
        }

        if (doc.name.length > 104) {
          delete (this.uploadedFilesValid[index]);
          this.err_size_name = true;
        }
      }
      this.Formulario.controls[name].setValue(this.uploadedFilesValid);
      this.uploadedFilesValid = this.Formulario.controls[name].value;
      const hash = {};

      this.revision = this.uploadedFilesValid.filter(o => hash[o.name] ? false : hash[o.name] = true);
      if (this.revision.length !== this.uploadedFilesValid.length){
        this.err_duplicados = true;
      }

      if (this.revision.length > this.maxFiles) {
        this.err_max_files = true;
        this.revision.splice(this.maxFiles);
      }
    }

    let msj = '';
    if (this.err_max_files){
      msj = msj.concat('<li>Has alcanzado el límite de archivos permitidos</li>');
    }
    if (this.err_format){
      msj = msj.concat('<li>Contiene archivos con formato no válidos</li>');
    }
    if (this.err_size){
      msj = msj.concat('<li>Contiene archivos con tamaño mayor a 10MB</li>');
    }
    if (this.err_size_name){
      msj = msj.concat('<li>Contiene archivos con nombre mayor de 100 caracteres</li>');
    }
    if (this.err_duplicados){
      msj = msj.concat('<li>Contiene archivos duplicados</li>');
    }
    if (this.err_format || this.err_size || this.err_size_name || this.err_duplicados || this.err_max_files){
      this.funcionesService.mensajeErrorHtml('Error en la subida de algunos documentos:<ul>' + msj + '</ul>') ;
    }
    this.Formulario.controls[name].setValue(this.revision);
  }

  private eChangeRequired = (status: boolean) => {
    const required = status ? [Validators.required] : null;
    const required2 = status ? [Validators.required, Validators.minLength(5), Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)] : null;
    const validateEmail = status ? [Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')] : null;
    const required3 = status ?
      [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s{2,})(?!.*--)(?!.*-$)[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+([\s-]+[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/),
        Validators.minLength(3), Validators.maxLength(50)]
      : null;
    const validateRazonSocial = status ? [Validators.required, Validators.minLength(2), Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)] : null;
    const notRequired = null;
    const requiredPN = status ? null : [Validators.required];

    const a1 = this.Formulario.get('fm_optiontipo_rep');
    const a2 = this.Formulario.get('fm_numerodoc_rep');
    const a3 = this.Formulario.get('fm_razon_social');
    const a4 = this.Formulario.get('fm_correo_pj');
    const a6 = this.Formulario.get('fm_departamentoListPJ');
    const a7 = this.Formulario.get('fm_provinciaListPJ');
    const a8 = this.Formulario.get('fm_distritoListPJ');
    const a9 = this.Formulario.get('fm_direccion_PJ');
    const a11 = this.Formulario.get('fm_tipoDocumentoAdjunto');
    const a12 = this.Formulario.get('filesRep');
    const a14 = this.Formulario.get('filesCiu');
    const a17 = this.Formulario.get('fm_mobilePhone_pj');
    const a16 = this.Formulario.get('fm_cargo');
    const a19 = this.Formulario.get('fm_partida_registral');
    const a20 = this.Formulario.get('fm_asiento_registral');
    // const a21 = this.Formulario.get('fm_asiento_registral_rep');
    const a22 = this.Formulario.get('fm_candidate');

    a1.setErrors(null);
    a2.setErrors(null);
    a3.setErrors(null);
    a4.setErrors(null);
    a6.setErrors(null);
    a7.setErrors(null);
    a8.setErrors(null);
    a9.setErrors(null);
    a11.setErrors(null);
    a12.setErrors(null);
    a14.setErrors(null);
    a16.setErrors(null);
    a19.setErrors(null);
    a20.setErrors(null);
    // a21.setErrors(null);
    a22.setErrors(null);


    a1.setValidators(required);
    a3.setValidators(validateRazonSocial);
    a4.setValidators(validateEmail);
    a6.setValidators(required);
    a7.setValidators(required);
    a8.setValidators(required);
    a9.setValidators(required2);
    a11.setValidators(notRequired);
    a12.setValidators(notRequired);
    a14.setValidators(required);
    a16.setValidators(notRequired);
    a22.setValidators(requiredPN);


    a1.updateValueAndValidity();
    a3.updateValueAndValidity();
    a4.updateValueAndValidity();
    a6.updateValueAndValidity();
    a7.updateValueAndValidity();
    a8.updateValueAndValidity();
    a9.updateValueAndValidity();
    a11.updateValueAndValidity();
    a12.updateValueAndValidity();
    a14.updateValueAndValidity();
    a16.updateValueAndValidity();
    a22.updateValueAndValidity();


    if (!this.isPR){
      a19.reset();
      a19.setValidators(required3);
      a19.updateValueAndValidity();
    }else{
      a19.reset();
      a19.setValidators(null);
      a19.updateValueAndValidity();
    }

    const a13 = this.Formulario.get('files');
    a13.setErrors(null);
    if (status) {
      a13.setValidators(null);
      a2.setValidators([Validators.required, Validators.minLength(this.minlengthNumDocRep), Validators.maxLength(this.maxlengthNumDocRep)]);
      a17.setValidators([Validators.required, Validators.minLength(9), this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')]);
      a20.setValidators(required3);
      // a21.setValidators(notRequired);
    } else {
      a2.setValidators(null);
      a13.setValidators(Validators.required);
      a17.setValidators(null);
      a20.setValidators(null);
      // a21.setValidators(null);
    }
    a2.updateValueAndValidity();
    a13.updateValueAndValidity();
    a17.updateValueAndValidity();
    a20.updateValueAndValidity();
    // a21.updateValueAndValidity();
  }
  eSearch = async (type: string) => {
    switch (type) {
      case 'general':
        const res = await this.validDocument(type);
        if (res) { this.eSearchDocument(type); }
        break;
      case 'representante':
        this.eSearchDocument(type);
        break;
      default:
        break;
    }
  }
  buildLabel = (name: string) => {
    const esRuc = this.Formulario.get('fm_optiontipo').value === 'ruc';
    switch (name) {
      case 'fm_numerodoc':
        if (esRuc) { return 'Número de RUC*'; }
        return 'Número de documento*';
    }
  }
  buildHolder = (name: string) => {
    const esRuc = this.Formulario.get('fm_optiontipo').value === 'ruc';
    switch (name) {
      case 'fm_numerodoc':
        if (esRuc) { return 'Ingrese el número de RUC'; }
        return 'Ingrese el número de documento';
    }
  }
  buildHide = (name: string) => {
    let esRuc = false;
    if (this.Formulario.get('fm_optiontipo').value === 'ruc' || this.Formulario.get('fm_optiontipo').value === 'pr') {
      esRuc = true;
    }
    switch (name) {
      case 'fm_razon_social':
        if (esRuc) { return true; }
        return false;
      case 'fm_partida_registral':
        if (esRuc) { return true; }
        return false;
      case 'fm_asiento_registral':
        if (esRuc) { return true; }
        return false;
      case 'fm_correo_pj':
        if (esRuc) { return true; }
        return false;
      case 'fm_mobilePhone_pj':
        if (esRuc) { return true; }
        return false;
      case 'fm_phone_pj':
        if (esRuc) { return true; }
        return false;
      case 'fm_departamentoListPJ':
        if (esRuc) { return true; }
        return false;
      case 'fm_provinciaListPJ':
        if (esRuc) { return true; }
        return false;
      case 'fm_distritoListPJ':
        if (esRuc) { return true; }
        return false;
      case 'fm_direccion_PJ':
        if (esRuc) { return true; }
        return false;
      case 'fm_paginawebPJ':
        if (esRuc) { return true; }
        return false;
      case 'fm_tipoDocumentoAdjunto':
        if (esRuc) { return true; }
        return false;
      case 'especifiqueDoc':
        if (esRuc) { return true; }
        return false;
      case 'fm_asiento_registral_rep':
        if (esRuc) { return true; }
        return false;
      case 'filesRep':
        if (esRuc) { return true; }
        return false;
      case 'filesCiu':
        if (esRuc) { return true; }
        return false;
      case 'fm_optiontipo_rep':
        if (esRuc) { return true; }
        return false;
      case 'fm_cargo':
        if (esRuc) { return true; }
        return false;
      case 'fm_numerodoc_rep':
        if (esRuc) { return true; }
        return false;

      case 'files':
        if (esRuc) { return false; }
        return true;

      case 'orgPolitica':
        if (esRuc) { return true; }
        return false;
    }
  }
  private buildError = (message: string) => {
    this.funcionesService.mensajeError(message);
  }
  private buildInfo = (message: string) => {
    this.funcionesService.mensajeInfo(message);
  }
  private validDocument = async (type: string) => {
    const isGeneral = type === 'general';
    const isRepresentante = type === 'representante';
    if (!this.Formulario.controls.fm_optiontipo.valid && isGeneral) {
      this.buildError('Debe seleccionar un tipo de documento');
      return false;
    }
    if (!this.Formulario.controls.fm_numerodoc.valid && isGeneral) {
      this.buildError('Debe ingresar un número correcto');
      return false;
    }
    if (
      !this.Formulario.controls.fm_optiontipo_rep.valid &&
      isRepresentante
    ) {
      this.buildError('Debe seleccionar un tipo de documento Representante');
      return false;
    }
    if (
      !this.Formulario.controls.fm_numerodoc_rep.valid &&
      isRepresentante
    ) {
      this.buildError('Debe ingresar un número correcto Representante');
      return false;
    }
    return true;
  }
  private eSearchDocument = async (type: string) => {
    this.funcionesService.showloading('Procesando...', 'Buscar en sistema');
    let tipo = '';
    let doc = '';
    this.load = true;
    if (type === 'general') {
      tipo = this.Formulario.controls.fm_optiontipo.value;
      doc = this.Formulario.controls.fm_numerodoc.value;

      const userExist = await this.consultaCasilla(doc, tipo);

      if (!userExist) {
        this.funcionesService.closeloading();
        this.buildError('El documento ' + doc + ' ya se encuentra registrado.');
        this.Formulario.get('fm_numerodoc').setValue('');
        this.load = false;
        return;
      }
    }
    if (type === 'representante') {
      tipo = this.Formulario.controls.fm_optiontipo_rep.value;
      doc = this.Formulario.controls.fm_numerodoc_rep.value;
    }
    if (doc !== ''){
      let response = null;
      let message = 'No se encontró los datos del documento.';
      switch (tipo) {
        case 'ruc':
          response = await this.consultaSunat(doc);
          message = 'El nro de RUC ' + doc + ' no existe, Verifique';
          break;
        case 'ce':
          response = await this.consultaExtranjeria(doc, tipo);
          message = 'Por favor ingrese los datos del CE ' + doc;
          break;
        case 'dni':
          response = await this.consultaReniec(doc, type);
          message = !response
            ? 'El DNI ' + doc + ' no ha sido encontrado en el padrón. Verifica si el número ingresado es correcto.'
            : (!this.nombres.value || (!this.apPaterno.value && !this.apMaterno.value))
              ? 'Error al obtener información' : '';
          break;
        case 'pr':
          response = await this.consultaExtranjeria(doc, tipo);
          message = 'Por favor ingrese los datos del PR ' + doc;
          document.getElementById('fm_razon_social').focus();
          break;
        default:
          break;
      }
      this.load = false;
      if (response) {
        this.existData = true;
        this.funcionesService.closeloading();
        if (tipo === 'ce' || tipo === 'dni'){
          if (!(this.nombres.value && (this.apPaterno.value || this.apMaterno.value))) {
            this.buildError(message);
            this.existData = false;
          }
        }
      } else {
        if (tipo === 'ce') {
          this.existData = false;
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
          this.apPaterno.enable();
          this.apMaterno.enable();
          this.nombres.enable();
          this.funcionesService.closeloading();
          this.buildInfo(message);
        } else if (tipo === 'dni') {
          this.personService.findByDni(doc).subscribe(
            (res) => {
              if (res.success) {
                this.funcionesService.closeloading();
                this.nombres.setValue(res.data.nombre);
                this.apPaterno.setValue(res.data.paterno != null ? res.data.paterno : '');
                this.apMaterno.setValue(res.data.materno != null ? res.data.materno : '');
              } else {
                this.funcionesService.closeloading();
                this.buildError(message);
                (type === 'general') ? this.Formulario.get('fm_numerodoc').setValue('') : this.Formulario.get('fm_numerodoc_rep').setValue('');
              }
            }
          );
        } else if (tipo === 'pr') {
          this.existData = false;
          this.funcionesService.closeloading();
          console.log(this.Formulario.get('fm_razon_social').value);
          if (!this.Formulario.get('fm_razon_social').value) {
            this.buildInfo(message);
          }
        } else {
          this.funcionesService.closeloading();
          this.buildError(message);
        }
      }
    } else {
      this.load = false;
    }
  }
  public sDocument = async (campo: string, campo1: string) => {
    this.funcionesService.showloading('Procesando...', 'Buscar en sistema');
    let nombre: string;
    let parteno: string;
    let materno: string;

    if (campo === 'fm_documentoTesorero'){
      parteno = this.datosTesorero[0];
      materno = this.datosTesorero[1];
      nombre = this.datosTesorero[2];
    } else if (campo === 'fm_documentoRepre'){
      parteno = this.datosRepresentante[0];
      materno = this.datosRepresentante[1];
      nombre = this.datosRepresentante[2];
    } else if (campo === 'fm_documentoPresi'){
      parteno = this.datosPresidente[0];
      materno = this.datosPresidente[1];
      nombre = this.datosPresidente[2];
    } else if (campo === 'fm_documentoPresiOEC'){
      parteno = this.datosPresidenteOEC[0];
      materno = this.datosPresidenteOEC[1];
      nombre = this.datosPresidenteOEC[2];
    }
    this.loading = true;
    const numeroDocumento = (this.Formulario.get(campo)?.value ?? '') as string;
    if (numeroDocumento !== ''){
      this.Formulario.get(campo)?.disable();
      const type =  (this.Formulario.get(campo1)?.value ?? '') as string;
      let response = null;
      let message = 'No se encontró los datos del documento.';

      switch (type) {
        case 'ce':
          response = await this.userService.ConsultaCE(numeroDocumento, type).toPromise();
          if (response.success) {
            this.Formulario.get(nombre)?.setValue(response.name);
            this.Formulario.get(parteno)?.setValue(response.lastname != null ? response.lastname : '');
            this.Formulario.get(materno)?.setValue(response.second_lastname != null ? response.second_lastname : '');
            this.funcionesService.closeloading();
          } else {
            message = 'Por favor ingrese los datos del CE ' + numeroDocumento;
            this.existData = false;
            this.Formulario.get(nombre)?.setValue('');
            this.Formulario.get(materno)?.setValue('');
            this.Formulario.get(parteno)?.setValue('');
            this.funcionesService.closeloading();
            this.buildInfo(message);
            this.Formulario.get(campo)?.enable();
          }

          break;
        case 'dni':
          response = await this.userService.ConsultaReniec(numeroDocumento).toPromise();
          if (response.statusCode === 200){
            this.funcionesService.closeloading();
            this.Formulario.get(nombre)?.setValue(response.body.nombres);
            this.Formulario.get(parteno)?.setValue(response.body.appat != null ? response.body.appat : '');
            this.Formulario.get(materno)?.setValue(response.body.apmat != null ? response.body.apmat : '');
          }else {
            this.personService.findByDni(numeroDocumento).subscribe(
              (res) => {
                if (res.success) {
                  this.funcionesService.closeloading();
                  this.Formulario.get(nombre)?.setValue(res.data.nombre);
                  this.Formulario.get(parteno)?.setValue(res.data.paterno != null ? res.data.paterno : '');
                  this.Formulario.get(materno)?.setValue(res.data.materno != null ? res.data.materno : '');
                } else {
                  this.funcionesService.closeloading();
                  message = 'El DNI ' + numeroDocumento + ' no ha sido encontrado en el padrón. Verifica si el número ingresado es correcto.';
                  this.buildError(message);
                  this.Formulario.get(campo)?.enable();
                  this.Formulario.get(campo)?.setValue('');
                }
              }
            );
          }
          break;
      }
    }
  }
  private consultaReniec = (doc: string, type: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaReniec(doc).subscribe(
        (resp: any) => {
          if (resp.statusCode === 200) {
            this.nombres.setValue(resp.body.nombres);
            this.apPaterno.setValue(resp.body.appat != null ? resp.body.appat : '');
            this.apMaterno.setValue(resp.body.apmat != null ? resp.body.apmat : '');
            this.apPaterno.disable();
            this.apMaterno.disable();
            this.nombres.disable();
            this.fm_numerodoc_rep.disable();
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        }
      );
    });
  }
  private consultaSunat = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaSunat(doc).subscribe(
        (resp) => {
          if (!resp.success) {
            resolve(false);
          } else {
            if (resp.data.organizationName !== undefined) {
              const razon = `${resp.data.organizationName}`;
              this.Formulario.get('fm_razon_social').setValue(razon);
              resolve(true);
            } else {
              resolve(false);
            }
          }
        },
        (error) => {
          resolve(false);
        }
      );
    });
  }
  private consultaClaridad = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      resolve(false);
    });
  }
  private consultaExtranjeria = (doc: string, type: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaCE(doc, type).subscribe(
        (resp) => {
          if (resp.success) {
            this.nombres.setValue(resp.name);
            this.apPaterno.setValue(resp.lastname != null ? resp.lastname : '');
            this.apMaterno.setValue(resp.second_lastname != null ? resp.second_lastname : '');
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        }
      );
    });
  }
  private consultaCasilla = (doc: string, type: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaCasilla(doc, type).subscribe(
        (resp) => {
          if (resp.success) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        }
      );
    });
  }

  private consultaCasillaXExpediente = (nro_expediente: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaCasillaXExpediente(nro_expediente).subscribe(
        (resp) => {
          if (resp.success) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        }
      );
    });
  }

  private noWhitespaceValidator(control: FormControl) {
    if (control.value == null) { return null; }
    if (control.value.length === 0) { return null; }

    for (let index = 0; index < control.value.length; index++) {
      const str = control.value[index].name;
      const frags = str.split('.');
      const name = frags.splice(0, frags.length - 1).join('.');
      if (name.length > 100) {
        return { whitespace: true };
      }
    }
    return null;
  }

  getTypeAcreditacion() {
    this.userService.GetTypeAcreditation().subscribe(
      (res) => {
        if (res.success) {
          this.listTypeAcreditation = res.data.acreditationTypes;
        }
      },
      (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }

  changeTypeDocument(event) {
    this.documentTypeSelected = event.value;
    this.box.doc = '';
    this.name = '';
    if (this.documentTypeSelected === 'dni') {
      this.maxlengthNumDoc = 8;
      this.placeHolder = 'Ingrese número de DNI';
    } else if (this.documentTypeSelected === 'ce') {
      this.maxlengthNumDoc = 9;
      this.placeHolder = 'Ingrese número de CE';
    } else if (this.documentTypeSelected === 'ruc') {
      this.maxlengthNumDoc = 11;
      this.placeHolder = 'Ingrese número de RUC';
    }
  }
  formInvalid(control: string) {
    return (
      this.Formulario.get(control).invalid &&
      (this.Formulario.get(control).dirty ||
        this.Formulario.get(control).touched)
    );
  }

  ConsultPerson() {
    this.name = '';
    if (this.documentTypeSelected === '') {
      this.funcionesService.mensajeError(
        'Debe seleccionar un tipo de documento'
      );
      return;
    }
    if (this.Formulario.controls.fm_numerodoc.value === '') {
      this.funcionesService.mensajeError('Debe ingresar un número');
      return;
    }

    const personRequest: any = {
      docType: this.documentTypeSelected,
      doc: this.Formulario.controls.fm_numerodoc.value,
    };
    this.userService.ConsultPerson(personRequest).subscribe(
      (res) => {
        if (res.success) {
          this.name = res.person.name;
          this.inputDisabled = false;
          this.enableForm();
        } else {
          this.funcionesService.mensajeError(
            res.error.message + ' ' + this.box.doc
          );
          this.inputDisabled = true;
        }
      },
      (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }

  enableForm() {
    this.fm_correo.enable();
    this.Formulario.get('fm_celular').enable();
  }

  baseName(str: string) {
    if (typeof str !== 'string') { return; }
    const frags = str.split('.');
    return frags.splice(0, frags.length - 1).join('.');
  }

  fileUploadchange(fileInput: any) {
    this.fileToUpload = (fileInput.target.files[0] as File);
    if (this.baseName(this.fileToUpload.name).length > 100) {
      this.funcionesService.mensajeError(
        'El nombre del archivo debe tener un máximo de 100 caracteres'
      );
      fileInput.target.value = '';
      return;
    }

    if (this.fileToUpload.type !== 'application/pdf') {
      this.funcionesService.mensajeError('El archivo debe ser un PDF');
      fileInput.target.value = '';
      return;
    }

    let fileSizeMb = 0;

    if (this.fileToUpload !== undefined) {
      fileSizeMb = fileInput.target.files[0].size / 1024;
    }

    if (fileSizeMb < 272) {
      if (fileInput.target.id === 'pdf_creation_solicitude') {
        this.box.pdf_creation_solicitude = this.fileToUpload;
      } else if (fileInput.target.id === 'pdf_resolution') {
        this.box.pdf_resolution = this.fileToUpload;
      } else if (fileInput.target.id === 'pdf_agree_tos') {
        this.box.pdf_agree_tos = this.fileToUpload;
      } else if (fileInput.target.id === 'pdf_terminos') {
        this.box.pdf_terminos = this.fileToUpload;
      }
    } else {
      this.funcionesService.mensajeError(
        'El archivo no debe ser mayor a 272 Kb'
      );
      fileInput.target.value = '';
    }
  }

  alert() {
    if (this.cargoActive){
      let messageModal = '';
      // Mensaje dinamico de acuerdo a funcionarios faltantes
      const cargosFaltantes: string[] = [];

      if (!this.representanteLegalOP) { cargosFaltantes.push('Representante Legal OP'); }
      if (!this.presidente) { cargosFaltantes.push('Presidente'); }
      if (!this.presidenteOEC) { cargosFaltantes.push('Presidente del OEC'); }

      if (cargosFaltantes.length > 0) {
        let cargosTexto = cargosFaltantes.join(', ');

        if (cargosFaltantes.length > 1) {
          const lastCommaIndex = cargosTexto.lastIndexOf(', ');
          cargosTexto = cargosTexto.substring(0, lastCommaIndex) + ' y ' + cargosTexto.substring(lastCommaIndex + 2);
        }
        messageModal = `¿Está seguro de crear la casilla electrónica sin registrar al ${cargosTexto}?`;
      }

      if (!this.presidente || !this.representanteLegalOP || !this.presidenteOEC){
        this.funcionesService.mensajeConfirmar(messageModal)
        .then((resp) => {
          this.submit();
        })
        .catch((err) => { });
      }else{
        this.funcionesService.mensajeConfirmar('¿Está seguro de crear la casilla electrónica?')
        .then((resp) => {
          this.submit();
        })
        .catch((err) => { });
      }
    }else{
      this.funcionesService.mensajeConfirmar('¿Está seguro de crear la casilla electrónica?')
        .then((resp) => {
          this.submit();
        })
        .catch((err) => { });
    }
  }

  validarEmail(campo: string){
    // Se removio validacion de DNI repetidos por peticion del usuario
    /*let bError = true;
    const email = this.Formulario.controls[campo].value.toLowerCase();
    if(!(campo == 'fm_correo' || campo == 'fm_correo_pj')){
      const correoPj = this.Formulario.controls['fm_correo_pj'].value.toLowerCase();
      if(email === correoPj && correoPj !== ''){
        bError = false;
      }
    }
    if(!(campo == 'fm_correo' || campo == 'fm_correo_pj')){
      const correo = this.Formulario.controls['fm_correo'].value.toLowerCase();
      if(email === correo && correo !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_emailTesorero'){
      const emailTesorero = this.Formulario.controls['fm_emailTesorero'].value.toLowerCase();
      if(email === emailTesorero && emailTesorero !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_emailRepre'){
      const emailRepre = this.Formulario.controls['fm_emailRepre'].value.toLowerCase();
      if(email === emailRepre && emailRepre !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_emailPresi'){
      const emailPresi = this.Formulario.controls['fm_emailPresi'].value.toLowerCase();
      if(email === emailPresi && emailPresi !== ''){
        bError = false;
      }
    }
    if(!bError){
      let message: string = `El correo electrónico ya se encuentra registrado en otro cargo`;
      this.funcionesService.mensajeError(message.toUpperCase());
      this.Formulario.get(campo)?.setValue('');
    }*/
  }

  validarCelular(campo: string){
    // Se removio validacion de DNI repetidos por peticion del usuario
    /*let bError = true;
    const celular = this.Formulario.controls[campo].value
    if(!(campo == 'fm_mobilePhone_pj' || campo == 'fm_celular')){
      const celularPJ = this.Formulario.controls['fm_mobilePhone_pj'].value;
      if(celular === celularPJ && celularPJ !== ''){
        bError = false;
      }
    }
    if(!(campo == 'fm_mobilePhone_pj' || campo == 'fm_celular')){
      const celularR = this.Formulario.controls['fm_celular'].value;
      if(celular === celularR && celularR !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_celularTesorero'){
      const celularTesorero = this.Formulario.controls['fm_celularTesorero'].value;
      if(celular === celularTesorero && celularTesorero !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_celularRepre'){
      const celulaRepre = this.Formulario.controls['fm_celularRepre'].value;
      if(celular === celulaRepre && celulaRepre !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_celularPresi'){
      const celularPresi = this.Formulario.controls['fm_celularPresi'].value;
      if(celular === celularPresi && celularPresi !== ''){
        bError = false;
      }
    }
    if(!bError){
      let message: string = `El número de celular ya se encuentra registrado en otro cargo`;
      this.funcionesService.mensajeError(message.toUpperCase());
      this.Formulario.get(campo)?.setValue('');
    }*/
  }

  validarDocumento(campo: string){
    // Se removio validacion de DNI repetidos por peticion del usuario
    /*let bError = true;
    const documento = this.Formulario.controls[campo].value;
    if(campo !== 'fm_numerodoc_rep'){
      const docRep = this.Formulario.controls['fm_numerodoc_rep'].value;
      if(documento === docRep && docRep !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_documentoTesorero'){
      const docTes = this.Formulario.controls['fm_documentoTesorero'].value;
      if(documento === docTes && docTes !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_documentoRepre'){
      const docRepre = this.Formulario.controls['fm_documentoRepre'].value;
      if(documento === docRepre && docRepre !== ''){
        bError = false;
      }
    }
    if(campo !== 'fm_documentoPresi'){
      const docPre = this.Formulario.controls['fm_documentoPresi'].value;
      if(documento === docPre && docPre !== ''){
        bError = false;
      }
    }
    if(!bError){
      this.Formulario.get(campo)?.enable();
      this.Formulario.get(campo)?.setValue('');
      let message: string = `El numero de documento ya se encuentra registrado en otro cargo`;
      this.funcionesService.mensajeError(message.toUpperCase());
    }*/
  }

  submit = () => {
    this.deshabilitado = true;
    let esRuc = false;
    if (this.Formulario.get('fm_optiontipo').value === 'ruc' || this.Formulario.get('fm_optiontipo').value === 'pr') {
      esRuc = true;
    }
    if (!this.Formulario.valid) { return; }

    const fd = new FormData();
    if (this.apPaterno.value === '' && this.apMaterno.value === '') {
      const message = `Debe ingresar al menos un apellido`;
      this.funcionesService.mensajeError(message);
      this.deshabilitado = false;
      return;
    }
    if (this.nombres.value === '' && this.apPaterno.value === '' && this.apMaterno.value === '') {
      const message = `Número de documento no válido, se debe registrar nombre(s) y apellido(s)`;
      this.funcionesService.mensajeError(message.toUpperCase());
      this.deshabilitado = false;
      return;
    }

    if (esRuc) {

      fd.append('docType', this.Formulario.controls.fm_optiontipo.value);
      fd.append('doc', this.Formulario.controls.fm_numerodoc.value.toUpperCase().trimEnd());
      fd.append('organizationName', this.Formulario.controls.fm_razon_social.value);
      fd.append('partidaRegistral', this.Formulario.controls.fm_partida_registral.value);
      fd.append('asientoRegistral', this.Formulario.controls.fm_asiento_registral.value);
      fd.append('email', this.fm_correo_pj.value.toLowerCase());
      fd.append('cellphone', this.Formulario.controls.fm_mobilePhone_pj.value);
      fd.append('phone', this.Formulario.controls.fm_phone_pj.value);
      const ubigeo = this.Formulario.controls.fm_departamentoListPJ.value.nodep + ' / ' + this.Formulario.controls.fm_provinciaListPJ.value.noprv + ' / ' + this.Formulario.controls.fm_distritoListPJ.value.nodis;
      fd.append('ubigeo', ubigeo);
      fd.append('address', this.fm_direccion_PJ.value);
      fd.append('webSite', this.fm_paginawebPJ.value.toLowerCase());
      fd.append('orgPol', this.cargoActive ? '1' : '0');

      const cargo = this.Formulario.controls.fm_cargo.value;

      const rep = {
        docType: this.Formulario.controls.fm_optiontipo_rep.value,
        doc: this.Formulario.controls.fm_numerodoc_rep.value,
        asientoRegistralRep: this.Formulario.controls.fm_asiento_registral_rep.value,
        lastname: this.Formulario.controls.apPaterno.value.toUpperCase(),
        second_lastname: this.Formulario.controls.apMaterno.value.toUpperCase(),
        names: this.Formulario.controls.nombres.value.toUpperCase(),
        email: this.Formulario.controls.fm_correo.value.toLowerCase(),
        cellphone: this.Formulario.controls.fm_celular.value,
        phone: this.Formulario.controls.fm_phone.value,
        position: cargo.codigo,
        positionName: cargo.nombre,
        documentTypeAttachment: this.Formulario.controls.fm_tipoDocumentoAdjunto.value,
        documentNameAttachment: this.Formulario.controls.especifiqueDoc.value,
        alterno: this.Formulario.controls.alterno.value
      };
      fd.append('rep', JSON.stringify(rep));

      if (this.Formulario.controls.fm_orgSi.value){
        let tesorero = {};
        const cargoTesorero = this.Formulario.controls.fm_cargoTesorero.value;
        tesorero = {
          position : cargoTesorero.id,
          positionName : cargoTesorero.value,
          docType : this.Formulario.controls.fm_tipoDocumentoTesorero.value,
          doc : this.Formulario.controls.fm_documentoTesorero.value,
          names : this.Formulario.controls.fm_nombresTesorero.value.toUpperCase(),
          lastname : this.Formulario.controls.fm_apellidoPaternoTesorero.value.toUpperCase(),
          second_lastname : this.Formulario.controls.fm_apellidoMaternoTesorero.value.toUpperCase(),
          email : this.Formulario.controls.fm_emailTesorero.value.toLowerCase(),
          cellphone : this.Formulario.controls.fm_celularTesorero.value
        };
        fd.append('tes', JSON.stringify(tesorero));

        let repre = {};
        if (this.representanteLegalOP) {

          const cargoRepre = this.Formulario.controls.fm_cargoRepre.value;
          repre = {
            position : cargoRepre.id,
            positionName : cargoRepre.value,
            docType : this.Formulario.controls.fm_tipoDocumentoRepre.value,
            doc : this.Formulario.controls.fm_documentoRepre.value,
            names : this.Formulario.controls.fm_nombresRepre.value.toUpperCase(),
            lastname : this.Formulario.controls.fm_apellidoPaternoRepre.value.toUpperCase(),
            second_lastname : this.Formulario.controls.fm_apellidoMaternoRepre.value.toUpperCase(),
            email : this.Formulario.controls.fm_emailRepre.value.toLowerCase(),
            cellphone : this.Formulario.controls.fm_celularRepre.value
          };
        }
        fd.append('repre', JSON.stringify(repre));

        let presi = {};
        if (this.presidente){
          const cargoPresidente = this.Formulario.controls.fm_cargoPresi.value;
          presi = {
            position : cargoPresidente.id,
            positionName : cargoPresidente.value,
            docType : this.Formulario.controls.fm_tipoDocumentoPresi.value,
            doc : this.Formulario.controls.fm_documentoPresi.value,
            names : this.Formulario.controls.fm_nombresPresi.value.toUpperCase(),
            lastname : this.Formulario.controls.fm_apellidoPaternoPresi.value.toUpperCase(),
            second_lastname : this.Formulario.controls.fm_apellidoMaternoPresi.value.toUpperCase(),
            email : this.Formulario.controls.fm_emailPresi.value.toLowerCase(),
            cellphone : this.Formulario.controls.fm_celularPresi.value
          };
        }
        fd.append('pres', JSON.stringify(presi));

        let presiOEC = {};
        if (this.presidenteOEC) {

          const cargoPresidenteOEC = this.Formulario.controls.fm_cargoPresiOEC.value;
          presiOEC = {
            position : cargoPresidenteOEC.id,
            positionName : cargoPresidenteOEC.value,
            docType : this.Formulario.controls.fm_tipoDocumentoPresiOEC.value,
            doc : this.Formulario.controls.fm_documentoPresiOEC.value,
            names : this.Formulario.controls.fm_nombresPresiOEC.value.toUpperCase(),
            lastname : this.Formulario.controls.fm_apellidoPaternoPresiOEC.value.toUpperCase(),
            second_lastname : this.Formulario.controls.fm_apellidoMaternoPresiOEC.value.toUpperCase(),
            email : this.Formulario.controls.fm_emailPresiOEC.value.toLowerCase(),
            cellphone : this.Formulario.controls.fm_celularPresiOEC.value
          };
        }
        fd.append('presiOEC', JSON.stringify(presiOEC));
      }

      const filesRep = this.Formulario.controls.filesRep.value;
      for (let i = 0; i < filesRep.length; i++) {
        const str1 = filesRep[i].name;
        const tempFileRep = new File(
          [filesRep[i]],
          str1,
          {
            type: filesRep[i].type.toLowerCase(),
          });
        fd.append('fileRep' + (i + 1), tempFileRep);
      }

      const filesCiu = this.Formulario.controls.filesCiu.value;
      for (let i = 0; i < filesCiu.length; i++) {
        const str1 = filesCiu[i].name;
        const tempFileCiu = new File(
          [filesCiu[i]],
          str1,
          {
            type: filesCiu[i].type.toLowerCase(),
          });
        fd.append('fileBox' + (i + 1), tempFileCiu);
      }

      fd.append('nroExpediente', this.Formulario.controls.fm_nroExpediente.value.toUpperCase());
      fd.append('dateFiling', this.Formulario.controls.fm_txtfechapres.value);
      fd.append('personType', 'pj');
    } else {
      // Persona Natural
      const ubige = this.Formulario.controls.fm_departamentoList.value.nodep + ' / ' +
        this.Formulario.controls.fm_provinciaList.value.noprv + ' / ' + this.Formulario.controls.fm_distritoList.value.nodis;

      fd.append('docType', this.Formulario.controls.fm_optiontipo.value);
      fd.append('doc', this.Formulario.controls.fm_numerodoc.value);
      fd.append('name', this.nombres.value.toUpperCase());
      fd.append('lastname', this.apPaterno.value.toUpperCase());
      fd.append('second_lastname', this.apMaterno.value.toUpperCase());
      fd.append('email', this.fm_correo.value.toLowerCase());
      fd.append('cellphone', this.Formulario.controls.fm_celular.value);
      fd.append('phone', this.Formulario.controls.fm_phone.value);
      fd.append('ubigeo', ubige);
      fd.append('address', this.fm_direccion.value);
      fd.append('recaptcha', 'qweasd');
      fd.append('nroExpediente', this.Formulario.controls.fm_nroExpediente.value.toUpperCase());
      fd.append('dateFiling', this.Formulario.controls.fm_txtfechapres.value);
      fd.append('personType', 'pn');
      fd.append('orgPol', '0');
      fd.append('candidate', this.Formulario.controls.fm_candidate.value);
      if (this.Formulario.controls.fm_candidate.value){
        fd.append('electoralProcess', this.Formulario.controls.fm_electoral_process.value);
      }

      const files = this.Formulario.controls.files.value;

      for (let index = 0; index < files.length; index++) {
        const str1 = files[index].name;
        const tempFile = new File(
          [files[index]],
          str1,
          {
            type: files[index].type.toLowerCase(),
          }
        );
        fd.append('fileBox' + (index + 1), tempFile);
      }
    }

    fd.append('observacion', this.fm_observacion.value);


    this.load = true;
    this.funcionesService.showloading('Procesando...', 'Creando casilla electrónica');
    this.userService.CreateBox(fd).subscribe(
      (res) => {
        this.load = false;
        if (res.success) {
          this.funcionesService.mensajeOk(
            'Los datos de casilla electrónica fueron registrados con éxito'
          );
          this.deshabilitado = true;
          this.refreshUsuarios();
        } else {
          this.funcionesService.mensajeError(res.error.message);
          this.deshabilitado = false;
        }
      },
      (err) => {
        this.load = false;
        this.deshabilitado = false;
        console.log('Problemas del servicio', err);
      }
    );
  }


  linkRedirect(section: any) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigate(['/main/' + section]);
  }
  refreshUsuarios() {
    this.userService.searchListuser({ search: '', filter: '', page: 1, count: 5, estado: '', fechaInicio: '', fechaFin: '', ordenFec: 'desc' });
    this.linkRedirect('/list-boxes');
  }

  validateInputs() {
    let isValid = false;
    if (this.documentTypeSelected === '') {
      return (isValid = false);
    } else if (
      this.Formulario.controls.fm_optiontacreditacion.value === ''
    ) {
      return (isValid = false);
    } else if (this.box.pdf_resolution === undefined) {
      return (isValid = false);
    } else if (this.box.pdf_creation_solicitude === undefined) {
      return (isValid = false);
    } else if (this.box.pdf_agree_tos === undefined) {
      return (isValid = false);
    } else if (this.box.pdf_terminos === undefined) {
      return (isValid = false);
    } else {
      return (isValid = true);
    }
  }

  validar_campo(event, type): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    const posicion = event.target.selectionStart;

    if (type === 'fm_numerodoc' && this.Formulario.get('fm_optiontipo').value === 'pr') {
      return true;
    } else if (posicion === 0 && (type === 'fm_celular' || type === 'fm_mobilePhone_pj')) {
      return charCode === 57;
    } else if (posicion === 0 && type === 'fm_numerodoc' && this.Formulario.get('fm_optiontipo').value === 'ruc') {
      if (charCode === 50) {
        return true;
      } else {
        return false;
      }
    } else if (posicion === 1 && type === 'fm_numerodoc' && this.Formulario.get('fm_optiontipo').value === 'ruc') {
      if (charCode === 48) {
        return true;
      } else {
        return false;
      }
    } else if (posicion === (this.maxlengthNumDoc - 1) && type === 'fm_numerodoc' && this.Formulario.get('fm_optiontipo').value === 'ruc') {
      const numeroDocumento = this.Formulario.get('fm_numerodoc')?.value;
      if (!numeroDocumento.toString().startsWith('20')){
        this.Formulario.get('fm_numerodoc')?.setValue('');
        return false;
      }
    } else {
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      }
      return true;
    }
  }

  validar_campo_phone(event, type): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  cancelar() {
    if (this.esAdministrador) { this.router.navigate(['/main/list-boxes']); }
    else { this.router.navigate(['/main']); }
  }

  private validatorRepeatFijo(control: FormControl) {
    if (control.value) {
      const re = new RegExp(/^(\d)\1{9}$/);
      const matches = re.test(control.value);
      return !matches ? null : { invalidName: true };
    } else {
      return null;
    }
  }

  private validatorRepeatMovil(control: FormControl) {
    if (control.value) {
      const re = new RegExp(/^(\d)\1{8,}$/);
      const matches = re.test(control.value);
      return !matches ? null : { invalidName: true };
    } else {
      return null;
    }
  }

  private validRep(control: FormControl) {
    if (control.value) {
      const re = new RegExp(/^(\d)\1{7,}$/);
      const matches = re.test(control.value);
      return !matches ? null : { invalidName: true };
    } else {
      return null;
    }
  }

  eShowError = (input, error = null) => {
    if (error.required !== undefined) {
      return 'Campo requerido';
    } else if (error.pattern !== undefined) {
      return 'Formato no válido';
    } else if (error.fileSize !== undefined) {
      return 'Archivo(s) con peso excedido';
    } else if (error.minlength !== undefined) {
      return 'Se requiere ' + error.minlength.requiredLength + ' caracteres como mínimo';
    } else {
      return 'Campo inválido';
    }
  }

  onKeydown(event, type) {

  }

  soloExpLetras(idInput: string, inputForm: FormControl, e: any) {
    const inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    const fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    const value: string = inputForm.value === null ? '' : inputForm.value;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if (inicio === 0 && e.key === ' ') { return false; }
    // inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
    return !!/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.\'"-°]+$/.test(e.key);
  }

  quitarDobleEspacio(idInput: string, inputForm: FormControl, e: any) {
    // const inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    // const fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    // const value: string = inputForm.value;
    // if (e.metaKey || e.ctrlKey) {
    //   return true;
    // }
    // if (inicio == 0 && e.key === ' ') { return false; }
    // inputForm.setValue(value.replace(/ {2,}/g, ' '));
    // this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
  }

  async busarExpediente(idInput: string) {
    if (this.Formulario.get(idInput).value.length > 8) {
      this.load = true;
      const nro_expediente = this.Formulario.get(idInput).value.toUpperCase();
      const userExist = await this.consultaCasillaXExpediente(nro_expediente);
      if (!userExist) {
        this.Formulario.get(idInput).setValue('');
        this.buildError('El expediente ingresado ya se encuentra registrado');
        this.load = false;
        return;
      } else {
        this.load = false;
      }
    }

  }

  buscarCE(person: string, evento: string) {
    if (person === 'u') {
      if (this.isPR) {
        if (evento === 'enter') {this.fm_razon_social.setValue(''); }
        this.eSearch('general');
      }
    } else if (person === 'r') {
      if (this.isCERep) { this.eSearch('representante'); }
    }
  }

  listarDepartamento() {
    this.seguridadService.getDepartamentoList().subscribe(resp => {
      this.departamentoList = resp;
    });
  }
  listarProcesos() {
    this.seguridadService.getProcesses().subscribe(resp => {
      this.listProcesses = resp;
    });
  }
  async cambiarProvincia() {
    this.Formulario.get('fm_provinciaList')?.reset('');
    this.Formulario.get('fm_distritoList')?.reset('');
    const value = this.Formulario.get('fm_departamentoList')?.value.ubdep;
    this.seguridadService.getProvinciaList(value).subscribe(resp => {
      this.provinciaList = resp;
    });
    this.distritoList = [];
  }

  async cambiarProvinciaPJ() {
    this.Formulario.get('fm_provinciaListPJ')?.reset('');
    this.Formulario.get('fm_distritoListPJ')?.reset('');
    const value = this.Formulario.get('fm_departamentoListPJ')?.value.ubdep;
    this.seguridadService.getProvinciaList(value).subscribe(resp => {
      this.provinciaListPJ = resp;
    });
    this.distritoList = [];
  }

  async cambiarDistrito() {
    this.Formulario.get('fm_distritoList')?.reset('');
    const valueprovincia = this.Formulario.get('fm_provinciaList')?.value.ubprv;
    const valuedepar = this.Formulario.get('fm_departamentoList')?.value.ubdep;
    this.seguridadService.getDistritoList(valuedepar, valueprovincia).subscribe(resp => {
      this.distritoList = resp;
    });
  }

  async cambiarDistritoPJ() {
    this.Formulario.get('fm_distritoListPJ')?.reset('');
    const valueprovincia = this.Formulario.get('fm_provinciaListPJ')?.value.ubprv;
    const valuedepar = this.Formulario.get('fm_departamentoListPJ')?.value.ubdep;
    this.seguridadService.getDistritoList(valuedepar, valueprovincia).subscribe(resp => {
      this.distritoListPJ = resp;
    });
  }

  onPaste(event: any) {
    event.preventDefault();
  }
  onPaste2(event: any, campo: string , campo2: string) {
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedText = clipboardData.getData('text');
    let tipoDocumento: string;
    ['1', '2'].includes(campo) ? tipoDocumento = campo : tipoDocumento = this.Formulario.get(campo).value;
    // const tipoDocumento = this.Formulario.get(campo).value;
    const currentInput = this.Formulario.get(campo2);
    currentInput.setValue('');
    const cleanedText = this.cleanTextByDocumentType(pastedText, tipoDocumento);
    currentInput.setValue(cleanedText);
    event.preventDefault();
  }
  cleanTextByDocumentType(text: string, documentType: string): string {
    const newtext = text.replace(/[^0-9]/g, '');
    if (['dni', 'ruc', 'ce'].includes(documentType)) {
      if (documentType === 'dni'){
        return newtext.slice(0, 8);
      } else if (documentType === 'ce') {
        return newtext.slice(0, 9);
      } else if (documentType === 'ruc') {
        if (newtext.startsWith('20')) {
          return newtext.slice(0, 11);
        } else {
          this.buildError('El RUC debe comenzar con "20"');
          return '';
        }
      }} else if (documentType === 'pr') {
      return text.replace(/[^a-zA-Z0-9]/g, '');
    }else if (documentType === '1'){
      if (newtext.startsWith('9')) {
        newtext.replace(/[^0-9]/g, '');
        return newtext.slice(0, 9);
      } else {
        this.buildError('El número debe comenzar con 9');
        return '';
      }
    }else if (documentType === '2'){
      newtext.replace(/[^0-9]/g, '');
      return newtext.slice(0, 10);
    }
    return text;
  }
  validarEntrada(idInput: string, inputForm: FormControl, event?: KeyboardEvent): boolean | void {
    const permitido = /^[A-Za-zÀ-ÖØ-öø-ÿ]$/;
    const value: string = inputForm.value || '';

    if (event) {
      const inputElement = event.target as HTMLInputElement;
      if (inputElement.selectionStart === 0 && !permitido.test(event.key)) {
        event.preventDefault();
        return false;
      }
    } else {
      if (value.length > 0 && !permitido.test(value.charAt(0))) {
        const nuevoValor = value.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]+/, '');
        inputForm.setValue(nuevoValor);
        this.renderer.selectRootElement(`#${idInput}`).focus();
      }
    }
  }
  onInputFormat(event: Event, caseType: 'uppercase' | 'lowercase' | 'none', formControlNameValue: string): void {
    const inputElement = event.target as HTMLInputElement;
    const originalValue = inputElement.value;
    const selectionStart = inputElement.selectionStart;
    const selectionEnd = inputElement.selectionEnd;

    const { newText, newSelectionStart, newSelectionEnd } =
      this.funcionesService.formatInputText(
      originalValue,
      caseType,
      selectionStart,
      selectionEnd
    );
    inputElement.value = newText;
    inputElement.setSelectionRange(newSelectionStart, newSelectionEnd);
    const control = this.Formulario.get(formControlNameValue);
    if (control) {
      control.setValue(newText, { emitEvent: false });
    }
  }
}
