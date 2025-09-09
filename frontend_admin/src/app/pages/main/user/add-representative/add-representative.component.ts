import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators  } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FileUploadValidators } from '@iplab/ngx-file-upload';
import codePhone from 'src/app/constants/codePhone';
import { TypeDocument } from 'src/app/models/notifications/notification';
import { Departamento, Distrito, Provincia } from 'src/app/models/ubigeo';
import { UserDetail } from 'src/app/models/users/user';
import { SeguridadService } from 'src/app/services/seguridad.service';
import { UbigeoService } from 'src/app/services/ubigeo.service';
import { UserService } from 'src/app/services/user.service';
import { LBL_ADD_FILES, LBL_ERROR_MAX_FILES, LBL_ERROR_MAX_LENGTH_NAME, LBL_ERROR_MAX_SIZE_FILE, LBL_ERROR_ONLY_FILE, LBL_FEATURES_FILE, MAXFILES, MAX_LENGTH_NAME_FILES, MAX_TAM_FILES_10, MIN_TAM_FILES } from 'src/app/shared/constantes';
import { Profile } from 'src/app/transversal/enums/global.enum';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { Location } from '@angular/common';
import { PersonService } from 'src/app/services/person.service';
@Component({
  selector: 'app-add-representative',
  templateUrl: './add-representative.component.html',
  styleUrls: ['./add-representative.component.scss'],
})
export class AddRepresentativeComponent implements OnInit {
  constructor(
    //@Inject(MAT_DIALOG_DATA) public data: any,
    //private dialogRef: MatDialogRef<EditUser1Component>,
    private route: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private funcionesService: FuncionesService,
    private ubigeoService: UbigeoService,
    private renderer: Renderer2,
    private seguridadService: SeguridadService,
    private router: ActivatedRoute,
    private readonly location: Location,
    private personService: PersonService
  ) {
    this.id = this.router.snapshot.paramMap.get('id');
    this.type =  this.router.snapshot.paramMap.get('type');
  }
  departamentoList: Array<Departamento> = [];
  provinciaList: Array<Provincia> = [];
  distritoList: Array<Distrito> = [];

  maxlengthNumDoc: number;
  minlengthNumDoc: number;
  maxlengthNumDocRep: number;
  minlengthNumDocRep: number;

  inputDisabled = false;
  documentTypeSelected: string = '';
  placeHolder = 'Ingrese número de documento';
  user: any ;
  esInterno = false;
  id;
  public data: any;
  codePhone = codePhone;
  Formulario: FormGroup = this.fb.group({
    fm_optiontipo: this.fb.control({
      value: '',
      disabled: true,
    }),
    fm_numerodoc: this.fb.control(
      {
        value: '',
        disabled: true,
      },
      [Validators.pattern('^[0-9]+$')]
    ),
    fm_phone_code : this.fb.control({value:''}),
    fm_phone: this.fb.control({
      value: ''
    }),
    fm_paginaweb: this.fb.control({
      value: '',
    }),
    // fm_especifique: this.fb.control({
    //   value:'',
    // }),
    fm_nombres: this.fb.control({
      value: '',
      disabled: this.inputDisabled,
    }),
    fm_organization_name: this.fb.control({
      value: '',
      disabled: true
    }),
    // fm_apellidos: this.fb.control({
    //   value: this.data ? this.data.lastname : '',
    //   disabled: this.inputDisabled,
    // }),
    fm_apellidoPaterno: this.fb.control({
      value: '',
      disabled: this.inputDisabled,
    }),
    fm_apellidoMaterno: this.fb.control({
      value: '',
      disabled: this.inputDisabled,
    }),
    fm_correo: this.fb.control(
      {
        value: '',
        disabled: this.inputDisabled,
      },
      [
        Validators.required,
        Validators.pattern(
          '[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}'
        ),
      ]
    ),
    fm_telefono: this.fb.control(
      {
        value: '',
        disabled: this.inputDisabled,
      },
      [Validators.required]
    ),
    fm_asiento_registral: this.fb.control(
      {
        value: '',
        disabled: this.inputDisabled,
      },
      [Validators.required]
    ),
    fm_direccion: this.fb.control(
      {
        value: '',
        disabled: this.inputDisabled,
      },
      [Validators.required]
    ),
    fm_departamento: this.fb.control(
      {
        value: '',
        disabled: false,
      },
      [Validators.required]
    ),
    fm_provincia: this.fb.control(
      {
        value: '',
        disabled: false,
      },
      [Validators.required]
    ),
    fm_distrito: this.fb.control(
      {
        value: '',
        disabled: false,
      },
      [Validators.required]
    ),
  });
  type: string;

  tipoDocumentoAdjunto  = [
    {id: '1', value: 'Documento que acredita su representación en la Organización Pública'},
    {id: '2', value: 'Documento que acredita su representación en la Institución Pública/Privada'},
    //{id: '3', value: 'Certificado de vigencia de poder en la Empresa privada'},
    //{id: '4', value : 'Otros'}
  ];
  /*OLD tipoDocumentoAdjunto  = [
    {id: 'r', value: 'Resolución de designación'},
    {id: 'h', value: 'Historial de afiliación - ROP'},
    {id: 'o' , value : 'Otros'}
  ]*/
  uploadedFiles: Array<File> = [];
  uploadedFilesRep: Array<File> = [];
  uploadedFilesValid: Array<File> = [];
  revision: Array<File> = [];
  errmaxLengthName = false;
  errduplicate = false;
  errorOnlyFile = false;
  errminSizeFile = false;
  errmaxSizeFile = false;
  errmaxFiles: boolean = false;
  lblAddFiles: string = LBL_ADD_FILES;
  lblErrorMaxLengthName: string = LBL_ERROR_MAX_LENGTH_NAME;
  lblErrorOnlyFile: string = LBL_ERROR_ONLY_FILE;
  lblErrorMaxSizeFile: string = LBL_ERROR_MAX_SIZE_FILE;
  lblErrorMaxFiles: string = LBL_ERROR_MAX_FILES;
  maxFiles: number = MAXFILES;
  maxSizeFile: number = MAX_TAM_FILES_10;
  minSizeFile: number = MIN_TAM_FILES;
  maxLengthName: number = MAX_LENGTH_NAME_FILES;
  lblFeaturesFile: string = LBL_FEATURES_FILE;
  txtfechapres = '';
  dateMax ="";
  nombres: FormControl = new FormControl({ value: '', disabled: true });
  apPaterno: FormControl = new FormControl({ value: '', disabled: true });
  apMaterno: FormControl = new FormControl({ value: '', disabled: true });
  fm_correo: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
  fm_correo_pj: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
  fm_direccion: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.minLength(5)]);
  fm_especifique : FormControl = new FormControl({ value: '', disabled: true });
  fm_direccion_PJ: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.minLength(5)]);
  existData = true;
  documentTypeSelectedRep: string = '';
  isCE = false;
  isCERep = false;
  lblNombre = 'Nombres';
  lblApPat = 'Apellido paterno';
  lblApMat = 'Apellido materno';
  load = false;
  toDay = new Date();
  maxsize_ = 10485760;
  ext: string = 'pdf jpg jpeg png bmp PDF JPG JPEG PNG BMP';
  err_max_files:boolean = false;
  err_format: boolean = false;
  err_size: boolean = false;
  err_size_name: boolean = false;
  err_duplicados: boolean = false;
  loading = true;

  filesControlRep = new FormControl(null, [
    Validators.required,
    FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({minSize: this.minSizeFile, maxSize: this.maxSizeFile}),
    this.noWhitespaceValidator,
  ]);

  cargos = [
    {id: '1', value: 'Representante Legal'},
    {id: '2', value: 'Personero Legal Titular'},
  ];

  /*OLD cargos = [
    {id: '1', value: 'Tesorero'},
    {id: '2', value: 'Presidente'},
    {id: '3', value: 'Presidente de la OEC'},
    {id: '4', value: 'Fundador'},
    {id: '5', value: 'Representante Legal'},
    {id: '6', value: 'Secretario'},
    {id: '7', value: 'Presidente del Comité Electoral'},
    {id: '8', value: 'Otros'},
  ]*/

  FormRepresentative: FormGroup = this.fb.group({
    fm_tipoDocumentoAdjunto: this.fb.control({value: '',
        disabled: this.inputDisabled,
      }),
    filesRep: this.filesControlRep,
    fm_optiontipo_rep: this.fb.control(
      {
        value: null,
        disabled: this.inputDisabled,
      },
      [Validators.required]
    ),
    fm_numerodoc_rep: this.fb.control({value: null, disabled: true}, [Validators.required]),
    nombres: this.nombres,
    fm_asiento_registral: this.fb.control('' , [Validators.pattern(/^(?!\s)(?!.*\s{2})(?!.*\s$)[a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'\-_]+$/)] ),
    apPaterno: this.apPaterno,
    apMaterno: this.apMaterno,
    fm_correo: this.fm_correo,
    fm_phone_code: this.fb.control({ value: ''}),
    fm_phone: this.fb.control({ value: '', disabled: this.inputDisabled }, [
      Validators.minLength(6),
      this.validatorRepeatFijo,
    ]),
    fm_celular: this.fb.control({ value: '', disabled: this.inputDisabled }, [
      Validators.required,
      Validators.minLength(9),
      this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')
    ]),
    alterno: [null],
    /*fm_departamentoList: this.fb.control(
      {
        value: '',
        disabled: this.inputDisabled,
      },
      [Validators.required]
    ),
    fm_provinciaList: this.fb.control(
      {
        value: '',
        disabled: this.inputDisabled,
      },
      [Validators.required]
    ),
    fm_distritoList: this.fb.control(
      {
        value: '',
        disabled: this.inputDisabled,
      },
      [Validators.required]
    ),
    fm_direccion: this.fm_direccion,*/
    fm_especifique : this.fm_especifique,
    fm_cargo: this.fb.control(
      {
        value: '',
        disabled: this.inputDisabled,
      },
      [Validators.required]
    ),
  }, { validators: this.apellidoRequerido.bind(this) });

  typeDocument: TypeDocument[] = [
    { id: 'dni', value: 'DNI' },
    { id: 'ruc', value: 'RUC'},
    { id: 'ce', value: 'Carnet de Extranjería' },
    { id: 'pr', value: 'Partida registral' },
  ];
  typeDocument2: TypeDocument[] = [
    { id: 'dni', value: 'DNI' },
    { id: 'ce', value: 'Carnet de Extranjería' },
  ];
  profiles: TypeDocument[] = [
    { id: Profile.RegistryOperator, value: 'Registrador' },
    { id: Profile.Notifier, value: 'Notificador' },
    { id: Profile.Administrador, value: 'Administrador' },
  ];

  protected readonly event = event;

  ngOnInit(): void {
   // this.getInfo();
    this.initForm();
    if (this.type === 'pj'){
      this.getInfoPj();
    }else{
      this.getInfoPn();
    }
    this.listarDepartamento();
  }
  apellidoRequerido(formGroup: FormGroup) {
    const grupos: [string, string][] = [
      ['apPaterno' , 'apMaterno'],
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
  validatorFile(name) {
    this.err_max_files = false;
    this.err_format = false;
    this.err_size = false;
    this.err_size_name = false;
    this.err_duplicados = false;
    const size = this.FormRepresentative.controls[name].value.length || 0;
    this.uploadedFilesValid = this.FormRepresentative.controls[name].value;

    if (size !== 0) {
      for (let index = 0; index < this.uploadedFilesValid.length; index++) {
        const doc = this.FormRepresentative.controls[name].value[index];
        let type = doc.name.split('.');
        type = type[type.length - 1];
        if (this.ext.indexOf(type) === -1) {
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
      this.FormRepresentative.controls[name].setValue(this.uploadedFilesValid);
      this.uploadedFilesValid = this.FormRepresentative.controls[name].value;
      var hash = {};

      this.revision = this.uploadedFilesValid.filter(o => hash[o.name] ? false : hash[o.name] = true);
      if(this.revision.length !== this.uploadedFilesValid.length){
        this.err_duplicados = true;
      }

      if (this.revision.length > this.maxFiles) {
        this.err_max_files = true;
        this.revision.splice(this.maxFiles);
      }
    }

    var msj = "";
    if(this.err_max_files){
      var msj = msj.concat("<li>Has alcanzado el límite de archivos permitidos</li>");
    }
    if(this.err_format){
      var msj = msj.concat("<li>Contiene archivos con formato no válidos</li>");
    }
    if(this.err_size){
      var msj = msj.concat("<li>Contiene archivos con tamaño mayor a 10MB</li>");
    }
    if(this.err_size_name){
      var msj = msj.concat("<li>Contiene archivos con nombre mayor de 100 caracteres</li>");
    }
    if(this.err_duplicados){
      var msj = msj.concat("<li>Contiene archivos duplicados</li>");
    }
    if(this.err_format || this.err_size || this.err_size_name || this.err_duplicados || this.err_max_files){
      this.funcionesService.mensajeErrorHtml('<div style="text-align: left;">Error en la subida de algunos documentos:<ul style="padding-left: 20px;">'+ msj + "</ul>") ;
    }
    this.FormRepresentative.controls[name].setValue(this.revision);
  }

  formInvalid(control: string) {
    return (
      this.FormRepresentative.get(control).invalid &&
      (this.FormRepresentative.get(control).dirty ||
        this.FormRepresentative.get(control).touched)
    );
  }
  eShowError = (input, error = null) => {
    if (error.required != undefined) {
      return 'Campo requerido';
    } else if (error.pattern != undefined) {
      return 'Formato no válido';
    } else if (error.fileSize != undefined) {
      return 'Archivo(s) con peso excedido';
    } else if (error.minlength != undefined) {
      return 'Se requiere '+error.minlength.requiredLength+ ' caracteres como mínimo' ;
    } else {
      return 'Campo inválido';
    }
  };

  private noWhitespaceValidator(control: FormControl) {
    if (control.value == null) return null;
    if (control.value.length == 0) return null;

    for (let index = 0; index < control.value.length; index++) {
      const str = control.value[index].name;
      var frags = str.split('.');
      var name = frags.splice(0, frags.length - 1).join('.');
      if (name.length > 100) {
        return { whitespace: true };
      }
    }
    return null;
  }
  private validatorRepeatFijo(control: FormControl) {
    if (control.value) {
      var re = new RegExp(/^(\d)\1{9}$/);
      var matches = re.test(control.value);
      return !matches ? null : { invalidName: true };
    } else {
      return null;
    }
  }
  private validatorRepeatMovil(control: FormControl) {
    if (control.value) {
      var re = new RegExp(/^(\d)\1{8,}$/);
      var matches = re.test(control.value);
      return !matches ? null : { invalidName: true };
    } else {
      return null;
    }
  }

  getInfoPj(){
    this.userService.getUserDetailPn(this.id, false).subscribe((resp)=>{

      if (!resp.success){
        return;
      }
      this.user = resp.user;
      const phoneSplit = this.user.phone.split('-');
      this.Formulario.controls.fm_optiontipo.setValue( this.user.doc_type);
      this.Formulario.controls.fm_numerodoc.setValue( this.user.doc);
      this.Formulario.controls.fm_nombres.setValue( this.user.name);
      this.Formulario.controls.fm_apellidoPaterno.setValue( this.user.lastname);
      this.Formulario.controls.fm_apellidoMaterno.setValue( this.user.second_lastname);
      this.Formulario.controls.fm_correo.setValue( this.user.email);
      this.Formulario.controls.fm_telefono.setValue( this.user.cellphone);
      this.Formulario.controls.fm_direccion.setValue( this.user.address);
      this.Formulario.controls.fm_organization_name.setValue( this.user.organization_name);
      this.Formulario.controls.fm_phone_code.setValue(phoneSplit[0]);
      this.Formulario.controls.fm_phone.setValue(phoneSplit[1]);
      this.Formulario.controls.fm_paginaweb.setValue(this.user.paginaweb);

      if (this.user.ubigeo !== undefined){
        const cadenaUbigeo = this.user.ubigeo.split('/');
        const dep = cadenaUbigeo[0].trim();
        const prov = cadenaUbigeo[1].trim();
        const dis = cadenaUbigeo[2].trim();

        const foundProv = this.departamentoList.find(departamento => departamento.nodep === dep);
        this.Formulario.controls.fm_departamento.setValue(foundProv);
      }
      this.loading = false;
      this.setDefaultCargo();
    }, (error) => {
       console.error(error);
     });
  }
  getInfoPn(){
    this.userService.getUserDetailPn(this.id, false).subscribe((resp) => {

      if (!resp.success){
        return;
      }
      this.user = resp.user;
      this.Formulario.controls.fm_optiontipo.setValue( this.user.doc_type);
      this.Formulario.controls.fm_numerodoc.setValue( this.user.doc);
      this.Formulario.controls.fm_nombres.setValue( this.user.name);
      this.Formulario.controls.fm_apellidoPaterno.setValue( this.user.lastname);
      this.Formulario.controls.fm_apellidoMaterno.setValue( this.user.second_lastname);
      this.Formulario.controls.fm_correo.setValue( this.user.email);
      this.Formulario.controls.fm_telefono.setValue( this.user.cellphone);
      this.Formulario.controls.fm_direccion.setValue( this.user.address);
      this.Formulario.controls.fm_organization_name.setValue( this.user.organization_name );

      if (this.user.ubigeo !== undefined){
        const cadenaUbigeo = this.user.ubigeo.split('/');
        const dep = cadenaUbigeo[0].trim();
        const prov = cadenaUbigeo[1].trim();
        const dis = cadenaUbigeo[2].trim();


        const foundProv = this.departamentoList.find(departamento => departamento.nodep == dep);
        this.Formulario.controls.fm_departamento.setValue(foundProv);

      }

     }, (error)=>{
       console.error(error)
     })
  }

  getDepartamento(){
    this.ubigeoService.getDepartamentoList().subscribe((resp) => {
      this.departamentoList = resp;
    });
  }

  newRepresentative(){
    this.route.navigateByUrl(`/main/user/edit/pj/${this.user.id}/representante`,{ state: this.user});
  }

  listarDepartamento(){
    this.seguridadService.getDepartamentoList().subscribe(resp => {
      this.departamentoList = resp;
    });
  }

  async cambiarProvincia() {
    this.FormRepresentative.get("fm_provinciaList")?.reset("");
    this.FormRepresentative.get("fm_distritoList")?.reset("");
    var value  = this.FormRepresentative.get('fm_departamentoList')?.value.ubdep;
    this.seguridadService.getProvinciaList(value).subscribe(resp=>{
      this.provinciaList=resp;
    })
    this.distritoList = []
  }

  async cambiarDistrito() {
    this.FormRepresentative.get("fm_distritoList")?.reset("");
    var valueprovincia = this.FormRepresentative.get('fm_provinciaList')?.value.ubprv
    var valuedepar = this.FormRepresentative.get('fm_departamentoList')?.value.ubdep
    this.seguridadService.getDistritoList(valuedepar, valueprovincia).subscribe(resp=>{
      this.distritoList=resp;
    })
  }
  saveEdit(){
    if (!this.FormRepresentative.valid) { return; }
    const fd = new FormData();

    const files = this.FormRepresentative.controls.filesRep.value;

    for (let index = 0; index < files.length; index++) {
      const str1 = files[index].name;
      const tempFile = new File(
        [files[index]],
        str1,
        {
          type: files[index].type.toLowerCase(),
        }
      );
      fd.append('file' + (index + 1), tempFile); //comentado: No se envía al endpoint comentado
    }
    if ( this.apPaterno.value === '' && this.apMaterno.value === '' ) {
      this.funcionesService.mensajeError('Ingrese por lo menos un apellido');
    } else {

    fd.append('docType', this.FormRepresentative.controls.fm_optiontipo_rep.value);
    fd.append('doc', this.FormRepresentative.controls.fm_numerodoc_rep.value);
    fd.append('asientoRegistralRep', this.FormRepresentative.controls.fm_asiento_registral.value);
    fd.append('names', this.nombres.value.toUpperCase() );
    fd.append('lastname', this.apPaterno.value.toUpperCase() );
    fd.append('second_lastname', this.apMaterno.value.toUpperCase() );
    fd.append('email', this.fm_correo.value.toLowerCase());
    fd.append('cellphone', this.FormRepresentative.controls.fm_celular.value );
    fd.append('phone', this.FormRepresentative.controls.fm_phone.value );
    fd.append('position', this.FormRepresentative.controls.fm_cargo.value.id);
    fd.append('positionName', this.FormRepresentative.controls.fm_cargo.value.value);
    fd.append('documentTypeAttachment', this.FormRepresentative.controls.fm_tipoDocumentoAdjunto.value.id ?
      this.FormRepresentative.controls.fm_tipoDocumentoAdjunto.value.id : '' );
    fd.append('documentNameAttachment', this.FormRepresentative.controls.fm_tipoDocumentoAdjunto.value.value ?
      this.FormRepresentative.controls.fm_tipoDocumentoAdjunto.value.value : '');
    fd.append('userId', this.id);
    if (this.FormRepresentative.controls.alterno.value !== null) {
        fd.append('alterno', this.FormRepresentative.controls.alterno.value);
    }
    new Response(fd).text().then(console.log);

    this.load = true;
    this.userService.SaveRepresentative(fd).subscribe(
      (res) => {
        this.load = false;
        if (res.success) {
          this.funcionesService.mensajeOk(
            'Se creó un representante con éxito'
          );
          history.back();
        } else {
          this.load = false;
          this.funcionesService.mensajeError(res.error);
        }
      },
      (err) => {
        this.load = false;
      },
      () => {
        this.load = false;
      }
    );
    }
  }

  initForm() {
    // this.FormRepresentative = this.fb.group({
    //   fm_optiontipo: this.fb.control({
    //     value: '',// this.data ? this.data.doc_type : '',
    //     disabled: true,
    //   }),
    //   fm_numerodoc: this.fb.control(
    //     {
    //       value: '',//this.data ? this.data.doc : '',
    //       disabled: true,
    //     },
    //     [Validators.pattern('^[0-9]+$')]
    //   ),
    //   fm_nombres: this.fb.control({
    //     value:'',// this.data ? this.data.name : '',
    //     disabled: this.inputDisabled,
    //   }),
    //   fm_organization_name: this.fb.control({
    //     value:'',
    //     disabled: true
    //   }),
    //   // fm_apellidos: this.fb.control({
    //   //   value: this.data ? this.data.lastname : '',
    //   //   disabled: this.inputDisabled,
    //   // }),
    //   fm_apellidoPaterno: this.fb.control({
    //     value:'',// this.data ? this.data.lastname : '',
    //     disabled: this.inputDisabled,
    //   }),
    //   fm_apellidoMaterno: this.fb.control({
    //     value:'',// this.data ? this.data.second_lastname : '',
    //     disabled: this.inputDisabled,
    //   }),
    //   fm_correo: this.fb.control(
    //     {
    //       value:'',// this.data ? this.data.email : '',
    //       disabled: this.inputDisabled,
    //     },
    //     [
    //       Validators.required,
    //       Validators.pattern(
    //         '[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}'
    //       ),
    //     ]
    //   ),
    //   fm_telefono: this.fb.control(
    //     {
    //       value: '',//this.data ? this.data.profile : '',
    //       disabled: this.inputDisabled,
    //     },
    //     [Validators.required]
    //   ),
    //   fm_direccion: this.fb.control(
    //     {
    //       value: '',//this.data ? this.data.profile : '',
    //       disabled: this.inputDisabled,
    //     },
    //     [Validators.required]
    //   ),
    //   fm_departamento: this.fb.control(
    //     {
    //       value: '',//this.data ? this.data.profile : '',
    //       disabled: false,
    //     },
    //     [Validators.required]
    //   ),
    //   fm_provincia: this.fb.control(
    //     {
    //       value: '',//this.data ? this.data.profile : '',
    //       disabled: false,
    //     },
    //     [Validators.required]
    //   ),
    //   fm_distrito: this.fb.control(
    //     {
    //       value: '',//this.data ? this.data.profile : '',
    //       disabled: false,
    //     },
    //     [Validators.required]
    //   ),
    // });
    // if(this.data.estate_inbox === 'Registro interno'){
    //   this.FormRepresentative.get('fm_departamento').clearValidators();
    //   this.FormRepresentative.get('fm_provincia').clearValidators();
    //   this.FormRepresentative.get('fm_distrito').clearValidators();
    //   this.FormRepresentative.get('fm_departamento').updateValueAndValidity();
    //   this.FormRepresentative.get('fm_provincia').updateValueAndValidity();
    //   this.FormRepresentative.get('fm_distrito').updateValueAndValidity();
    // }
    this.getDepartamento();
  }
  toggleAlterno(event: any, value: boolean) {
    if (event.checked) {
      this.FormRepresentative.get('alterno')?.setValue(value);
    } else {
      event.source.checked = true;
      this.FormRepresentative.get('alterno')?.setValue(value);
    }
  }
  setDefaultCargo() {
    if (this.user) {
      if (this.user.orgPol === '1') {
        this.FormRepresentative.get('fm_cargo').setValue(this.cargos[1]);
        this.FormRepresentative.get('alterno')?.setValidators(Validators.required);
        this.FormRepresentative.get('alterno')?.updateValueAndValidity();
      } else if (!this.user.orgPol || this.user.orgPol === '0') {
        this.FormRepresentative.get('fm_cargo').setValue(this.cargos[0]);
        this.FormRepresentative.get('fm_asiento_registral')?.setValidators(Validators.required);
        this.FormRepresentative.get('fm_asiento_registral')?.updateValueAndValidity();
      }
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
    // if (!this.FormRepresentative.controls['fm_optiontipo'].valid && isGeneral) {
    //   this.buildError('Debe seleccionar un tipo de documento');
    //   return false;
    // }
    // if (!this.FormRepresentative.controls['fm_numerodoc'].valid && isGeneral) {
    //   this.buildError('Debe ingresar un número correcto');
    //   return false;
    // }
    if (
      !this.FormRepresentative.controls.fm_optiontipo_rep.valid &&
      isRepresentante
    ) {
      this.buildError('Debe seleccionar un tipo de documento Representante');
      return false;
    }
    if (
      !this.FormRepresentative.controls.fm_numerodoc_rep.valid &&
      isRepresentante
    ) {
      this.buildError('Debe ingresar un número correcto Representante');
      return false;
    }
    return true;
  };
  private consultaSunat = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaSunat(doc).subscribe(
        (resp) => {
          if (resp) {
            if (resp.list.multiRef.ddp_nombre.$ !== undefined) {
              const razon = `${resp.list.multiRef.ddp_nombre.$}`;
              this.FormRepresentative.get('fm_razon_social').setValue(razon);
              resolve(true);
            } else {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        }
      );
    });
  };
  private consultaExtranjeria = (doc: string, type:string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaCE(doc, type).subscribe(
        (resp) => {
          if (resp.success) {
            this.nombres.setValue(resp.name);
            this.apPaterno.setValue(resp.lastname != null ? resp.lastname: "");
            this.apMaterno.setValue(resp.second_lastname != null ? resp.second_lastname: "");
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        }
      )
    });
  };
  private eSearchDocument = async (type: string) => {
    let tipo = '';
    let doc = '';
    this.load = true;
    if (type === 'general') {
      tipo = this.FormRepresentative.controls.fm_optiontipo.value;
      doc = this.FormRepresentative.controls.fm_numerodoc.value;
    }
    if (type === 'representante') {
      tipo = this.FormRepresentative.controls.fm_optiontipo_rep.value;
      doc = this.FormRepresentative.controls.fm_numerodoc_rep.value;
    }
    let userExist = true;
    if (this.type === 'pn'){
      userExist = await this.consultaCasilla(doc, tipo);
    }

    if(!userExist){
      this.buildError('El documento ingresado ya se encuentra registrado');
      this.load = false;
      return;
    }
    let response = null;
    let message = 'No se encontró los datos del documento.';
    switch (tipo) {
      case 'ruc':
        response = await this.consultaSunat(doc);
        message = 'El RUC ' + doc + ' no ha sido encontrado';
        break;
      case 'ce':
        response = await this.consultaExtranjeria(doc, tipo);
        message =
          'Por favor ingrese los datos del CE ' + doc;
        break;
      case 'dni':
        // this.nombres.setValue('nombres');
        // this.apPaterno.setValue('apellido paterno');
        // this.apMaterno.setValue('apellido materno');
        response = await this.consultaReniec(doc, type);
        message =
          'El DNI ' + doc + ' no ha sido encontrado en el padrón. Verifica si el número ingresado es correcto.';
        break;
      default:
        break;
    }
    this.load = false;
    if (response) {
      this.existData = true;
    } else {
      if(tipo == 'ce') {
        this.buildInfo(message);
        this.existData = false;
        this.nombres.setValue('');
        this.apPaterno.setValue('');
        this.apMaterno.setValue('');
        this.funcionesService.closeloading();
        this.buildInfo(message);
      } else if(tipo === 'dni') {
        this.personService.findByDni(doc).subscribe(
          (res) => {
            if(res.success) {
              this.funcionesService.closeloading();
              this.nombres.setValue(res.data.nombre);
              this.apPaterno.setValue(res.data.paterno != null ? res.data.paterno: "");
              this.apMaterno.setValue(res.data.materno != null ? res.data.materno: "");
            } else {
              this.funcionesService.closeloading();
              this.existData = false;
              this.FormRepresentative.controls['fm_numerodoc_rep'].setValue('');
              this.nombres.setValue('');
              this.apPaterno.setValue('');
              this.apMaterno.setValue('');
              this.buildError(message);
            }
          }
        );
      } else {
        this.funcionesService.closeloading();
        this.buildError(message);
      }
    }
  }
  private consultaReniec = (doc: string, type: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaReniec(doc).subscribe(
        (resp: any) => {
          if (resp.statusCode === 200) {
            /*if(resp.nombres == null && resp.appat == null && resp.apmat == null) resolve(false);
            else {*/
              this.nombres.setValue(resp.body.nombres);
              this.apPaterno.setValue(resp.body.appat != null ? resp.body.appat: "");
              this.apMaterno.setValue(resp.body.apmat != null ? resp.body.apmat: "");
              resolve(true);
            //}
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
  private consultaCasilla = (doc: string, type:string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaCasilla(doc, type).subscribe(
        (resp) => {
          if (resp.success) {
            resolve(true);
          }else{
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        }
      );
    });
  }
  buildHide = (name: string) => {
    const esRuc = true;
    switch (name) {
      case 'fm_razon_social':
        if (esRuc) return true;
        return false;
      case 'fm_optiontipo_rep':
        if (esRuc) return true;
        return false;
      case 'fm_numerodoc_rep':
        if (esRuc) return true;
        return false;
      case 'fm_organizacion':
        if (esRuc) return false;
        return true;
    }
  };
  eSearch = async (type: string) => {
    let res;
    switch (type) {
      case 'general':
        res = await this.validDocument(type);
        if (res) { await this.eSearchDocument(type); }
        break;
      case 'representante':
         res = await this.validDocument(type);
         if (res) { await this.eSearchDocument(type); }
         break;
      default:
        break;
    }
  };
  eChangeDocumentoRep(event) {
    this.eResetForm(6);
    this.existData = true;
    this.documentTypeSelectedRep = event.value;
    // console.log("change docu: ",event);
    this.FormRepresentative.get('fm_numerodoc_rep').enable();
    this.isCERep = this.documentTypeSelectedRep === 'ce';
    if (this.documentTypeSelectedRep === 'dni') {
      this.minlengthNumDocRep = 8;
      this.maxlengthNumDocRep = 8;
      this.changeLabelRequired(false);
      this.eChangeType(false);
      // this.eChangeRequired(false);
      this.apPaterno.disable();
      this.apMaterno.disable();
      this.nombres.disable();
    } else if (this.documentTypeSelectedRep === 'ce') {
      this.minlengthNumDocRep = 9;
      this.maxlengthNumDocRep = 9;
      this.changeLabelRequired(true);
      this.eChangeType(true);
      // this.eChangeRequired(false);
      this.apPaterno.enable();
      this.apMaterno.enable();
      this.nombres.enable();
    }
  }
  private eResetForm = (level: number) => {
    this.nombres.setValue('');
    this.apPaterno.setValue('');
    this.apMaterno.setValue('');
    this.FormRepresentative.get('fm_numerodoc_rep').setValue('');
    if (level == 6) return;
    this.FormRepresentative.get('fm_razon_social').setValue('');
    this.FormRepresentative.get('fm_optiontipo_rep').setValue(null);
    this.FormRepresentative.get('fm_numerodoc').setValue('');
    if (level == 5) return;
  };
  changeLabelRequired(required: boolean) {
    if(required) {
      this.lblNombre = "Nombres*";
    } else {
      this.lblNombre = "Nombres";
    }
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

  getNumeroDocumento() {
    this.FormRepresentative.get('fm_numerodoc_rep').valueChanges.subscribe((documento) => {
      if(this.documentTypeSelected == 'dni') {
        if(documento.length == this.minlengthNumDoc){
          this.eSearch('general');
        } else {
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
        }
      }
      else if(this.documentTypeSelected == 'ruc') {
        if(documento.length == this.minlengthNumDoc){
          this.eSearch('general');
        }
        else {
          this.FormRepresentative.get('fm_razon_social').setValue('');
        }
      }
      else if(this.documentTypeSelected == 'ce') {
        this.existData = true;
        this.nombres.setValue('');
        this.apPaterno.setValue('');
        this.apMaterno.setValue('');
      }
    });
  }

  eChangeDocumentoAttach(event){
    const value = event.value;
    // console.log("valueee =>>>" , value)
    if(value.id === '4'){
      this.FormRepresentative.get('fm_especifique').setValidators([Validators.required]);
      this.FormRepresentative.controls['fm_especifique'].enable();
      this.FormRepresentative.controls['fm_especifique'].markAllAsTouched();
    }else{
      this.FormRepresentative.get('fm_especifique').setValidators(null);

      this.FormRepresentative.controls['fm_especifique'].disable();
    }
    this.FormRepresentative.get('fm_especifique').updateValueAndValidity();

  }

  changeTypeDocument(event) {
    this.documentTypeSelected = event.value;

    if (this.documentTypeSelected === 'dni') {
      this.maxlengthNumDoc = 8;
      this.placeHolder = 'Ingrese número de DNI';
    } else {
      this.maxlengthNumDoc = 12;

      this.placeHolder = 'Ingrese número de CE';
    }
  }
  changeCodePhone(event){

  }
  validar_campo(event, type): boolean {

    const charCode = (event.which) ? event.which : event.keyCode;
    var posicion = event.target.selectionStart;

    if(posicion == 0  && type === 'fm_celular' ){
      if(charCode == 57 ){
        return true;
      }else{
        return false;
      }
    }else{
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      }
      return true;
    }
  }
  buscarCE(event?: any) {
    /*console.log(this.isCE)
    console.log(this.isCERep)*/
    // this.isCE ? this.eSearch('general') : '' ;
    if (this.minlengthNumDocRep === this.FormRepresentative.controls.fm_numerodoc_rep.value.length ) {
      this.eSearch('representante');
    }else {
      this.nombres.setValue('');
      this.apPaterno.setValue('');
      this.apMaterno.setValue('');
    }
  }

  soloExpLetras(idInput: string, inputForm: FormControl, e: any) {
    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    let value : string = inputForm.value;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;
    // inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
    return !!/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.\'"-°]+$/.test(e.key);
  }

  quitarDobleEspacio(idInput: string, inputForm: FormControl, e: any) {
    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    let value : string = inputForm.value;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;
    // inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
  }
  validar_campo_phone(event, type): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode===45) {return true;}
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
  cancelar(): void {
    this.location.back();
  }


  validarCelular(event : any): boolean{
    const charCode = (event.which) ? event.which : event.keyCode;
    const numCelular = this.FormRepresentative.get('fm_telefono')?.value;
    var primerDigito = event.target.selectionStart;
    var primerdato = numCelular[0];
    if(primerDigito == 0   ){
      if(charCode == 57 ){
        return true;
      }else{
        return false;
      }
    }else{
      if( charCode > 31 && (charCode < 48 || charCode > 57)){
        return false;
      }else {
        return true;
      }
    }
  }

  validardomicilio(e : any, idInput: string){
    var value = this.FormRepresentative.get('fm_direccion')?.value;

    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;

    this.FormRepresentative.get('fm_direccion')?.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');


    return true;
  }
  onPaste2(event: any, campo: string , campo2: string) {
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedText = clipboardData.getData('text');
    let tipoDocumento: string;
    ['1', '2'].includes(campo) ? tipoDocumento = campo : tipoDocumento = this.FormRepresentative.get(campo).value;
    // const tipoDocumento = this.Formulario.get(campo).value;
    const currentInput = this.FormRepresentative.get(campo2);
    currentInput.setValue('');
    const cleanedText = this.cleanTextByDocumentType(pastedText, tipoDocumento);
    currentInput.setValue(cleanedText);
    event.preventDefault();
    this.buscarCE();
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
}
