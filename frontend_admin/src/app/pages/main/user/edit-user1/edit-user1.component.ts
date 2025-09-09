import {DOCUMENT} from '@angular/common';
import {Component, Inject, OnInit, Renderer2} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import codePhone from 'src/app/constants/codePhone';
import {attachment, TypeDocument} from 'src/app/models/notifications/notification';
import {Departamento, Distrito, Provincia} from 'src/app/models/ubigeo';
import {IResendEmailAndSms, UserDetailUpdate, UserDetailUpdatePn} from 'src/app/models/users/user';
import {NotificationService} from 'src/app/services/notification.service';
import {UbigeoService} from 'src/app/services/ubigeo.service';
import {UserService} from 'src/app/services/user.service';
import {Profile} from 'src/app/transversal/enums/global.enum';
import {FuncionesService} from 'src/app/utils/funciones.service';
import {LBL_ADD_FILES, LBL_FEATURES_FILE_1, MAX_TAM_FILES_10, MIN_TAM_FILES} from '../../../../shared/constantes';
import {FileUploadValidators} from '@iplab/ngx-file-upload';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user1.component-v2.html',
  styleUrls: ['./edit-user1.component.scss']
})
export class EditUser1Component implements OnInit {

  Formulario: FormGroup;
  departamentoList: Array<Departamento> = [];
  provinciaList: Array<Provincia> = [];
  distritoList: Array<Distrito> = [];
  departamentoList_rep: Array<Departamento> = [];
  provinciaList_rep: Array<Provincia> = [];
  distritoList_rep: Array<Distrito> = [];
  load = false;
  data2: any = {};
  officials: any = {};
  displayedColumns: string[] = ['dni', 'nombre', 'fec_reg', 'fec_eval', 'evaluador', 'fec_ini', 'fec_fin', 'foto', 'sustento', 'accion'];
  displayedColumnsHistory: string[] = ['contact', 'updated_at', 'doc', 'updated_user', 'attachments'];
  displayedColumnsHistoryRepresentative: string[] = ['doc', 'names', 'evaluator_user_names', 'date_begin', 'date_end', 'sustento'];
  displayedColumnsHistoryRepresentativeOP: string[] = ['doc', 'names', 'evaluator_user_names', 'date_begin', 'date_end'];
  adjuntos: attachment[];
  adjuntosRep: attachment[];
  loading = true;

  cargos = [
    {id: '1', value: 'Representante Legal'},
    {id: '2', value: 'Personero Legal Titular'},
  ];

  cargosOP = [
    {id: '1', value: 'Representante Legal', status: true, dataKey: 'Rep_Legal', op: false},
    {id: '2', value: 'Personero Legal Titular', status: true, dataKey: 'Pers_Legal_OP', op: true},
    {id: '3', value: 'Tesorero', status: true, dataKey: 'Tesorero_OP', op: true},
    {id: '4', value: 'Representante Legal OP', status: true, dataKey: 'Rep_Legal_OP', op: true},
    {id: '5', value: 'Presidente', status: true, dataKey: 'Presidente_OP', op: true},
    {id: '6', value: 'Presidente del OEC', status: true, dataKey: 'PresidenteOEC_OP', op: true},
  ];

  tipoDocumentoAdjunto = [
    {id: '1', value: 'Documento que acredita su representación en la Organización Pública'},
    {id: '2', value: 'Documento que acredita su representación en la Institución Pública/Privada'},
    // {id: '3', value: 'Certificado de vigencia de poder en la Empresa privada'},
    // {id: '4', value : 'Otros'}
  ];

  isRepresentative = false;
  inputDisabled = false;
  documentTypeSelected = '';
  maxlengthNumDoc: number;
  placeHolder = 'Ingrese número de documento';
  user: any;
  esInterno = false;
  id;
  public data: any;
  codePhone = codePhone;
  codePhoneSelected: string;
  type: string;
  action ?: boolean;

  typeDocument: TypeDocument[] = [
    {id: 'dni', value: 'DNI'},
    {id: 'ruc', value: 'RUC'},
    {id: 'ce', value: 'Carnet de Extranjería'},
    {id: 'pr', value: 'Partida registral'},
  ];

  profiles: TypeDocument[] = [
    {id: Profile.RegistryOperator, value: 'Registrador'},
    {id: Profile.Notifier, value: 'Notificador'},
    {id: Profile.Administrador, value: 'Administrador'},
  ];
  cargoDisplayData: any[] = [];
  // Para carga de archivos
  maxFiles: number = MIN_TAM_FILES;
  maxSizeFile: number = MAX_TAM_FILES_10;
  minSizeFile: number = MIN_TAM_FILES;
  filesControlEdit = new FormControl(null, [
    FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({minSize: this.minSizeFile, maxSize: this.maxSizeFile}),
  ]);
  uploadedFiles: Array<File> = [];
  err_max_files = false;
  err_format = false;
  err_size = false;
  err_size_name = false;
  maxsize_ = 10485760;
  ext = 'pdf jpg jpeg png bmp PDF JPG JPEG PNG BMP';
  lblAddFiles: string = LBL_ADD_FILES;
  lblFeaturesFile: string = LBL_FEATURES_FILE_1;
  edit = false;
  protected readonly JSON = JSON;

  constructor(
    private route: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private funcionesService: FuncionesService,
    private ubigeoService: UbigeoService,
    private renderer: Renderer2,
    private router: ActivatedRoute,
    private usuarioService: UserService,
    private notificationService: NotificationService,
    @Inject(DOCUMENT) document: any
  ) {
    this.id = this.router.snapshot.paramMap.get('id');
    this.type = this.router.snapshot.paramMap.get('type');

    const action = this.route.url.split('/')[3];
    if (action === 'edit') {
      this.action = false;
    } else {
      this.action = true;
    }
  }

  ngOnInit(): void {
    this.initForm();
    if (this.type === 'pj') {
      this.getInfoPj();
    } else {
      this.getInfoPn();
    }
  }
  validatorFile(name: string) {
    this.err_format = false;
    this.err_size = false;
    this.err_size_name = false;
    this.err_max_files = false;
    const file = this.Formulario.controls[name].value;
    this.uploadedFiles = this.Formulario.controls[name].value;

    if (file) {
      const doc = file[0];
      let type = doc.name.split('.');
      type = type[type.length - 1];
      if (this.ext.indexOf(type) === -1) {
        this.uploadedFiles = [];
        this.err_format = true;
      }

      if (doc.size >= this.maxsize_) {
        this.uploadedFiles = [];
        this.err_size = true;
      }

      if (doc.name.length > 100) {
        this.uploadedFiles = [];
        this.err_size_name = true;
      }
    }

    let msj = '';
    if (this.err_format) {
      msj = msj.concat('<li>El archivo tiene un formato no válido</li>');
    }
    if (this.err_size) {
      msj = msj.concat('<li>El archivo tiene un tamaño mayor a 10MB</li>');
    }
    if (this.err_size_name) {
      msj = msj.concat('<li>El nombre del archivo es mayor de 100 caracteres</li>');
    }

    if (this.err_format || this.err_size || this.err_size_name) {
      this.funcionesService.mensajeErrorHtml(
        '<div style="text-align: left;">Error en la subida del documento:<ul style="padding-left: 20px;">' + msj + '</ul></div>'
      );
    }
    this.Formulario.controls[name].setValue(this.uploadedFiles);
  }
  editInbox() {
      const campos = [
      'fm_correo', 'fm_telefono', 'fm_correo_rep', 'fm_celular_rep', 'fm_email_3', 'fm_celular_3',
      'fm_email_4', 'fm_celular_4', 'fm_email_5', 'fm_celular_5', 'fm_email_6', 'fm_celular_6'
    ];

    this.Formulario.valueChanges.subscribe(() => {
      const campoModificado = campos.some(campo =>
        this.Formulario.get(campo)?.dirty
      );

      if (campoModificado) {
        this.edit = true;
        this.filesControlEdit.setValidators([
          Validators.required,
          FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp']),
          FileUploadValidators.filesLimit(this.maxFiles),
          FileUploadValidators.sizeRange({minSize: this.minSizeFile, maxSize: this.maxSizeFile})
        ]);
      }
    });
  }
  formInvalid(control: string) {
    return (
      this.Formulario.get(control).invalid &&
      (this.Formulario.get(control).dirty ||
        this.Formulario.get(control).touched)
    );
  }

  async getInfoPj() {
    this.load = true;
    const info = await this.usuarioService.getUserDetailPJ(this.id, true).toPromise();
    this.load = false;
    if (!info.user) {
      this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r => {
        this.route.navigate(['main/list-boxes']);
      });
    }
    this.data2 = info.user;
    this.setupCargoDisplayData();
    this.action && this.setupTooltips();
    // obtener datos de funcionarios para EDITAR
    if (info.user.officials && info.user.officials.length > 0) {
      const cargos = ['3', '4', '5', '6'];
      this.officials = info.user.officials.filter(o => {
        const isDisabled = o.status === 'DESHABILITADO';
        switch (o.position) {
          case '4': // Personero Legal Titular
            this.Formulario.controls.fm_cargo_4.setValue(o.position);
            this.Formulario.controls.fm_tipoDocumento_4.setValue(o.doc_type.toLowerCase());
            this.Formulario.controls.fm_documento_4.setValue(o.doc);
            this.Formulario.controls.fm_apellidoPaterno_4.setValue(o.lastname);
            this.Formulario.controls.fm_apellidoMaterno_4.setValue(o.second_lastname);
            this.Formulario.controls.fm_nombres_4.setValue(o.names);
            this.Formulario.controls.fm_email_4.setValue(o.email);
            this.Formulario.controls.fm_celular_4.setValue(o.cellphone);
            this.Formulario.controls.fm_email_4.setValidators([Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
            this.Formulario.controls.fm_celular_4.setValidators(
              [Validators.required, Validators.minLength(9), this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')]);
            this.Formulario.controls.fm_email_4[isDisabled ? 'disable' : 'enable']();
            this.Formulario.controls.fm_celular_4[isDisabled ? 'disable' : 'enable']();
            break;
          case '3': // Tesorero
            this.Formulario.controls.fm_cargo_3.setValue(o.position);
            this.Formulario.controls.fm_tipoDocumento_3.setValue(o.doc_type.toLowerCase());
            this.Formulario.controls.fm_documento_3.setValue(o.doc);
            this.Formulario.controls.fm_apellidoPaterno_3.setValue(o.lastname);
            this.Formulario.controls.fm_apellidoMaterno_3.setValue(o.second_lastname);
            this.Formulario.controls.fm_nombres_3.setValue(o.names);
            this.Formulario.controls.fm_email_3.setValue(o.email);
            this.Formulario.controls.fm_celular_3.setValue(o.cellphone);
            this.Formulario.controls.fm_email_3.setValidators([Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
            this.Formulario.controls.fm_celular_3.setValidators(
              [Validators.required, Validators.minLength(9), this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')]);
            this.Formulario.controls.fm_email_3[isDisabled ? 'disable' : 'enable']();
            this.Formulario.controls.fm_celular_3[isDisabled ? 'disable' : 'enable']();
            break;
          case '5': // Presidente
            this.Formulario.controls.fm_cargo_5.setValue(o.position);
            this.Formulario.controls.fm_tipoDocumento_5.setValue(o.doc_type.toLowerCase());
            this.Formulario.controls.fm_documento_5.setValue(o.doc);
            this.Formulario.controls.fm_apellidoPaterno_5.setValue(o.lastname);
            this.Formulario.controls.fm_apellidoMaterno_5.setValue(o.second_lastname);
            this.Formulario.controls.fm_nombres_5.setValue(o.names);
            this.Formulario.controls.fm_email_5.setValue(o.email);
            this.Formulario.controls.fm_celular_5.setValue(o.cellphone);
            this.Formulario.controls.fm_email_5.setValidators([Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
            this.Formulario.controls.fm_celular_5.setValidators(
              [Validators.required, Validators.minLength(9), this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')]);
            this.Formulario.controls.fm_email_5[isDisabled ? 'disable' : 'enable']();
            this.Formulario.controls.fm_celular_5[isDisabled ? 'disable' : 'enable']();
            break;
          case '6': // Presidente del OEC
            this.Formulario.controls.fm_cargo_6.setValue(o.position);
            this.Formulario.controls.fm_tipoDocumento_6.setValue(o.doc_type.toLowerCase());
            this.Formulario.controls.fm_documento_6.setValue(o.doc);
            this.Formulario.controls.fm_apellidoPaterno_6.setValue(o.lastname);
            this.Formulario.controls.fm_apellidoMaterno_6.setValue(o.second_lastname);
            this.Formulario.controls.fm_nombres_6.setValue(o.names);
            this.Formulario.controls.fm_email_6.setValue(o.email);
            this.Formulario.controls.fm_celular_6.setValue(o.cellphone);
            this.Formulario.controls.fm_email_6.setValidators([Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
            this.Formulario.controls.fm_celular_6.setValidators(
              [Validators.required, Validators.minLength(9), this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')]);
            this.Formulario.controls.fm_email_6[isDisabled ? 'disable' : 'enable']();
            this.Formulario.controls.fm_celular_6[isDisabled ? 'disable' : 'enable']();
            break;
        }
        return cargos.includes(o.position) && o.enabled === true;
      });
    }

    this.userService.getUserDetail(this.id, false).subscribe((resp) => {
      if (!resp.success) {
        return;
      }
      this.user = resp.user;
      // console.log(this.user.orgPol);
      this.adjuntosRep = this.user.representative.file_document;
      this.isRepresentative = !(Object.keys(resp.user.representative).length === 0);
      let tmpPhoneCode = '';
      let tmpPhone = '';
      if (this.user.phone !== undefined) {
        const phoneUser = this.user.phone.split('-');
        tmpPhoneCode = phoneUser[0];
        tmpPhone = phoneUser[1];
      }
      this.adjuntos = this.user.attachments;
      this.Formulario.controls.fm_optiontipo.setValue(this.user.doc_type);
      this.Formulario.controls.fm_numerodoc.setValue(this.user.doc);
      this.Formulario.controls.fm_nombres.setValue(this.user.name);
      this.Formulario.controls.fm_apellidoPaterno.setValue(this.user.lastname);
      this.Formulario.controls.fm_apellidoMaterno.setValue(this.user.second_lastname);
      this.Formulario.controls.fm_partida_registral.setValue(this.user.startingNumber);
      this.Formulario.controls.fm_asiento_registral.setValue(this.user.registrySeat);
      this.Formulario.controls.fm_correo.setValue(this.user.email);
      this.Formulario.controls.fm_telefono.setValue(this.user.cellphone);
      this.Formulario.controls.fm_direccion.setValue(this.user.address);
      this.Formulario.controls.fm_observation.setValue(this.user.observacion);
      this.Formulario.controls.fm_observation.disable();
      this.Formulario.controls.fm_organization_name.setValue(this.user.organization_name);
      this.Formulario.controls.fm_phone.setValue(this.user.phone);
      this.Formulario.controls.fm_paginaweb.setValue(this.user.paginaweb);

      this.Formulario.controls.fm_tipoDocumentoAdjunto.setValue(this.user.representative.document_type_attachment);
      this.Formulario.controls.fm_asiento_registral_rep.setValue(this.user.representative.asientoRegistralRep);
      this.Formulario.controls.fm_phone_rep.setValue(this.user.representative.phone);
      this.Formulario.controls.fm_correo_rep.setValue(this.user.representative.email);
      this.Formulario.controls.fm_celular_rep.setValue(this.user.representative.cellphone);
      this.Formulario.controls.fm_cargo.setValue(this.user.representative.position);
      this.Formulario.controls.fm_rep_id.setValue(this.user.representative._id);
      this.Formulario.controls.alterno.setValue(this.user.representative.isAlternate === true ? 'Sí' : 'No');

      if (this.user.ubigeo !== undefined) {
        const cadenaUbigeo = this.user.ubigeo.split('/');
        const dep = cadenaUbigeo[0].trim();
        const prov = cadenaUbigeo[1].trim();
        const dis = cadenaUbigeo[2].trim();

        const foundProv = this.departamentoList.find(departamento => departamento.nodep == dep);
        this.Formulario.controls.fm_departamento.setValue(foundProv);

        this.cambiarProvincia(prov, dis);
      }
      this.loading = false;
      this.editInbox();
    }, (error) => {
      console.error(error);
    });
  }

  getInfoPn() {

    this.userService.getUserDetailPn(this.id, false).subscribe((resp) => {
      if (!resp.user) {
        this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r => {
          this.route.navigate(['main/list-boxes']);
        });
      }
      this.user = resp.user;
      if (this.user.attachments && this.user.attachments.length > 0) {
        this.adjuntos = this.user.attachments;
      } else {
        this.adjuntos = this.user.pdf;
      }
      this.Formulario.controls.fm_optiontipo.setValue(this.user.doc_type);
      this.Formulario.controls.fm_numerodoc.setValue(this.user.doc);
      this.Formulario.controls.fm_nombres.setValue(this.user.name);
      this.Formulario.controls.fm_nombres.disable();
      this.Formulario.controls.fm_apellidoPaterno.setValue(this.user.lastname);
      this.Formulario.controls.fm_apellidoPaterno.disable();
      this.Formulario.controls.fm_apellidoMaterno.setValue(this.user.second_lastname);
      this.Formulario.controls.fm_apellidoMaterno.disable();
      this.Formulario.controls.fm_correo.setValue(this.user.email);
      this.Formulario.controls.fm_telefono.setValue(this.user.cellphone);
      this.Formulario.controls.fm_candidate.setValue(this.user.candidate === true ? 'Sí' : this.user.candidate === false ? 'No' : 'Sin información');
      this.Formulario.controls.fm_electoralProcess.setValue(this.user.electoralProcess);

      let tmpPhoneCode = '';
      let tmpPhone = '';
      if (this.user.phone != undefined) {
        const phoneRep = this.user.phone.split('-');
        tmpPhoneCode = phoneRep[0];
        tmpPhone = phoneRep[1];
      }
      this.Formulario.controls.fm_phone.setValue(this.user.phone);


      this.Formulario.controls.fm_direccion.setValue(this.user.address);
      this.Formulario.controls.fm_observation.setValue(this.user.observacion);
      this.Formulario.controls.fm_observation.disable();
      this.Formulario.controls.fm_organization_name.setValue(this.user.organization_name);

      if (this.user.ubigeo != undefined) {
        const cadenaUbigeo = this.user.ubigeo.split('/');
        const dep = cadenaUbigeo[0].trim();
        const prov = cadenaUbigeo[1].trim();
        const dis = cadenaUbigeo[2].trim();

        const foundProv = this.departamentoList.find(departamento => departamento.nodep == dep);
        this.Formulario.controls.fm_departamento.setValue(foundProv);

        this.cambiarProvincia(prov, dis);
      } else {
        this.Formulario.controls.fm_departamento.setValue(null);
        this.Formulario.controls.fm_provincia.setValue(null);
        this.Formulario.controls.fm_distrito.setValue(null);
      }
      this.loading = false;
      this.editInbox();
    }, (error) => {
      console.error(error);
    });
  }

  getDepartamento() {
    this.ubigeoService.getDepartamentoList().subscribe((resp) => {
      this.departamentoList = resp;
      this.departamentoList_rep = resp;
    });
  }

  newRepresentative(type: string) {
    if (type === 'R') {
      this.route.navigate(['/main/user/edit/pj', this.id, 'representante']);
    } else {
      this.route.navigate(['/main/user/edit/pj', this.id, 'official']);
    }
  }
  cambiarProvincia(prov = '', dis = '') {

    this.Formulario.get('fm_provincia')?.reset();
    this.Formulario.get('fm_distrito')?.reset();
    this.distritoList = [];

    const value = this.Formulario.get('fm_departamento')?.value.ubdep;

    this.ubigeoService.getProvinciaList(value).subscribe((resp) => {

      this.provinciaList = resp;
      if (prov !== '' && dis !== '') {
        const foundProv = this.provinciaList.find(provincia => provincia.noprv == prov);
        this.Formulario.controls.fm_provincia.setValue(foundProv);
        this.cambiarDistrito(dis);
      }

    });
  }

  cambiarProvinciaRep(prov = '', dis = '') {

    this.Formulario.get('fm_provincia_rep')?.reset();
    this.Formulario.get('fm_distrito_rep')?.reset();
    this.distritoList_rep = [];

    const value = this.Formulario.get('fm_departamento_rep')?.value.ubdep;

    this.ubigeoService.getProvinciaList(value).subscribe((resp) => {

      this.provinciaList_rep = resp;
      if (prov != '' && dis != '') {
        const foundProv = this.provinciaList_rep.find(provincia => provincia.noprv == prov);
        this.Formulario.controls.fm_provincia_rep.setValue(foundProv);
        this.cambiarDistritoRep(dis);
      }

    });
  }

  cambiarDistrito(dis = '') {
    this.Formulario.get('fm_distrito')?.reset();
    const valueprovincia = this.Formulario.get('fm_provincia')?.value.ubprv;
    const valuedepar = this.Formulario.get('fm_departamento')?.value.ubdep;

    this.ubigeoService.getDistritoList(valuedepar, valueprovincia).subscribe((resp) => {

      this.distritoList = resp;
      if (dis != '') {
        const foundDist = this.distritoList.find(distrito => distrito.nodis == dis);
        this.Formulario.controls.fm_distrito.setValue(foundDist);
      }
    });
  }

  cambiarDistritoRep(dis = '') {
    this.Formulario.get('fm_distrito_rep')?.reset();
    const valueprovincia = this.Formulario.get('fm_provincia_rep')?.value.ubprv;
    const valuedepar = this.Formulario.get('fm_departamento_rep')?.value.ubdep;

    this.ubigeoService.getDistritoList(valuedepar, valueprovincia).subscribe((resp) => {
      this.distritoList_rep = resp;
      if (dis != '') {
        const foundDist = this.distritoList_rep.find(distrito => distrito.nodis == dis);
        this.Formulario.controls.fm_distrito_rep.setValue(foundDist);
      }
    });
  }


  saveEdit() {
    const formData = new FormData();
    const dept = this.Formulario.controls.fm_departamento.value.nodep;
    const prov = this.Formulario.controls.fm_provincia.value.noprv;
    const dist = this.Formulario.controls.fm_distrito.value.nodis;
    this.funcionesService.showloading('Procesando...', 'Actualizando casilla electrónica');
    // const userDet = new UserDetailUpdate();
    // userDet.userId = this.id; // this.data.inbox_id ;
    // userDet.email = this.Formulario.controls.fm_correo.value.toLowerCase();
    // userDet.cellphone = this.Formulario.controls.fm_telefono.value;
    // userDet.phone = this.Formulario.controls.fm_phone.value;
    // userDet.address = this.Formulario.controls.fm_direccion.value;
    // userDet.ubigeo = dept + ' / ' + prov + ' / ' + dist;
    // userDet.webSite = this.Formulario.controls.fm_paginaweb.value;
    formData.append('userId', this.id);
    formData.append('email', this.Formulario.controls.fm_correo.value.toLowerCase());
    formData.append('cellphone', this.Formulario.controls.fm_telefono.value);
    formData.append('phone', this.Formulario.controls.fm_phone.value);
    formData.append('address', this.Formulario.controls.fm_direccion.value);
    formData.append('ubigeo', dept + ' / ' + prov + ' / ' + dist);
    formData.append('webSite', this.Formulario.controls.fm_paginaweb.value);
    formData.append('personType', this.type);
    // userDet.rep = {
    //   id: undefined,
    //   email: undefined,
    //   cellphone: undefined,
    //   phone: undefined,
    //   ubigeo: undefined,
    //   address: undefined,
    //   position: undefined,
    //   positionName: undefined
    // };
    // userDet.personType = this.type;
    //
    // userDet.rep.id = this.Formulario.controls.fm_rep_id.value;
    // userDet.rep.email = this.Formulario.controls.fm_correo_rep.value.toLowerCase();
    // userDet.rep.cellphone = this.Formulario.controls.fm_celular_rep.value;
    // userDet.rep.phone = this.Formulario.controls.fm_phone_rep.value;
    // userDet.rep.position = this.Formulario.controls.fm_cargo.value;
    // userDet.rep.positionName = userDet.rep.position !== '' ? this.cargos[Number(this.Formulario.controls.fm_cargo.value) - 1].value : '';
    const rep = {
      id: this.Formulario.controls.fm_rep_id.value || undefined,
      email: this.Formulario.controls.fm_correo_rep.value.toLowerCase() || undefined,
      cellphone: this.Formulario.controls.fm_celular_rep.value || undefined,
      phone: this.Formulario.controls.fm_phone_rep.value || undefined,
      position: this.Formulario.controls.fm_cargo.value || undefined,
      positionName: ''
    };

    if (rep.position !== '') {
      rep.positionName = this.cargos[Number(rep.position) - 1].value;
    }
    formData.append('rep', JSON.stringify(rep));

    if (this.officials && this.officials.length > 0) {
      for (let index = 0; index < this.officials.length; index++) {
        switch (this.officials[index].position) {
          case '4':
            this.officials[index].email = this.Formulario.controls.fm_email_4.value.toLowerCase();
            this.officials[index].cellphone = this.Formulario.controls.fm_celular_4.value;
            break;
          case '3':
            this.officials[index].email = this.Formulario.controls.fm_email_3.value.toLowerCase();
            this.officials[index].cellphone = this.Formulario.controls.fm_celular_3.value;
            break;
          case '5':
            this.officials[index].email = this.Formulario.controls.fm_email_5.value.toLowerCase();
            this.officials[index].cellphone = this.Formulario.controls.fm_celular_5.value;
            break;
          case '6':
            this.officials[index].email = this.Formulario.controls.fm_email_6.value.toLowerCase();
            this.officials[index].cellphone = this.Formulario.controls.fm_celular_6.value;
            break;
        }
      }
      // userDet.officials = this.officials;
      formData.append('officials', JSON.stringify(this.officials));
    }
    const files = this.Formulario.controls.filesEdit.value;
    if (files && files.length > 0) {
      formData.append('file1', files[0]);
    }
    this.userService.editUserDetailUpdate(formData).subscribe((resp) => {
      if (!resp.success) {
        this.funcionesService.closeloading();
        this.funcionesService.mensajeError(
          resp.error
        );
      } else {
        this.funcionesService.closeloading();
        this.funcionesService.mensajeOk('Los datos de la casilla fueron actualizados con éxito');
        // this.route.navigateByUrl('main/list-boxes');
        history.back();
      }
    });
  }


  saveEditPN() {
    const dept = this.Formulario.controls.fm_departamento.value.nodep;
    const prov = this.Formulario.controls.fm_provincia.value.noprv;
    const dist = this.Formulario.controls.fm_distrito.value.nodis;
    this.funcionesService.showloading('Procesando...', 'Actualizando casilla electrónica');
    // const userDet = new UserDetailUpdatePn();
    // userDet.userId = this.id;
    // userDet.email = this.Formulario.controls.fm_correo.value;
    // userDet.cellphone = this.Formulario.controls.fm_telefono.value;
    // userDet.address = this.Formulario.controls.fm_direccion.value;
    // userDet.ubigeo = _dept + ' / ' + _prov + ' / ' + _dist;
    // userDet.personType = this.type;
    // userDet.phone = this.Formulario.controls.fm_phone.value;
    const formData = new FormData();
    formData.append('userId', this.id);
    formData.append('email', this.Formulario.controls.fm_correo.value);
    formData.append('cellphone', this.Formulario.controls.fm_telefono.value);
    formData.append('phone', this.Formulario.controls.fm_phone.value);
    formData.append('address', this.Formulario.controls.fm_direccion.value);
    formData.append('ubigeo', dept + ' / ' + prov + ' / ' + dist);
    formData.append('personType', this.type);

    const files = this.Formulario.controls.filesEdit.value;
    if (files && files.length > 0) {
      formData.append('file1', files[0]);
    }
    this.userService.editUserDetailUpdatePn(formData).subscribe((resp) => {
      if (!resp.success) {
        this.funcionesService.closeloading();
        this.funcionesService.mensajeError(
          resp.error
        );
      } else {
        this.funcionesService.closeloading();
        this.funcionesService.mensajeOk('Los datos de la casilla fueron actualizados con éxito');
        // this.route.navigateByUrl('main/list-boxes');
        history.back();
      }
    });
  }

  eShowError = (input, error = null) => {
    if (error.required != undefined) {
      return 'Campo requerido';
    } else if (error.pattern != undefined) {
      return 'Formato no válido';
    } else if (error.fileSize != undefined) {
      return 'Archivo(s) con peso excedido';
    } else if (error.minlength != undefined) {
      return 'Se requiere ' + error.minlength.requiredLength + ' caracteres como mínimo';
    } else {
      return 'Campo inválido';
    }
  }

  cambiarCargo() {
    // console.log(this.Formulario);
  }

  initForm() {
    this.Formulario = this.fb.group({
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
      fm_phone: this.fb.control({value: ''}, [Validators.pattern('^[0-9.-]*$')]),
      fm_paginaweb: this.fb.control({value: ''}, [Validators.pattern('^(https?:\\/\\/)?(www\\.)[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,4}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$|^(https?:\\/\\/)?(www\\.)?(?!ww)[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,4}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$')]),
      fm_nombres: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }),
      fm_organization_name: this.fb.control({
        value: '',
        disabled: true
      }),
      fm_apellidoPaterno: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }),
      fm_apellidoMaterno: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }),
      fm_correo: this.fb.control(
        {
          value: '',
          disabled: this.inputDisabled
        },
        [
          Validators.required,
          Validators.pattern(
            '[a-zA-Z0-9.+-_]{1,}@[a-zA-Z1-9.-]{2,}[.]{1}[a-zA-Z]{2,}'
          ),
        ]
      ),
      fm_correo_rep: this.fb.control(
        {
          value: '',
          disabled: this.inputDisabled
        },
        [
          Validators.required,
          Validators.pattern(
            '[a-zA-Z0-9.+-_]{1,}@[a-zA-Z1-9.-]{2,}[.]{1}[a-zA-Z]{2,}'
          ),
        ]
      ),
      fm_celular_rep: this.fb.control(
        {
          value: '',
          disabled: this.inputDisabled
        },
        [Validators.required, Validators.minLength(9), this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')]
      ),
      fm_telefono: this.fb.control(
        {
          value: '',
          disabled: this.inputDisabled
        },
        [Validators.required, Validators.minLength(9), this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')]
      ),
      fm_direccion: this.fb.control(
        {
          value: '',
          disabled: this.inputDisabled
        },
        [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]
      ),
      fm_observation: this.fb.control(
        {
          value: '',
          disabled: this.inputDisabled
        },
        []
      ),
      fm_candidate: this.fb.control(
        {
          value: '',
          disabled: true
        },
        []
      ),
      fm_electoralProcess: this.fb.control(
        {
          value: '',
          disabled: true
        },
        []
      ),
      /*fm_direccion_rep: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',
          disabled: this.inputDisabled
        },
        [Validators.required]
      ),*/
      fm_departamento: this.fb.control(
        {
          value: '',

        },
        [Validators.required]
      ),
      /*fm_departamento_rep: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',

        },
        [Validators.required]
      ),*/
      fm_provincia: this.fb.control(
        {
          value: '',

        },
        [Validators.required]
      ),
      /*fm_provincia_rep: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',

        },
        [Validators.required]
      ),*/
      fm_distrito: this.fb.control(
        {
          value: '',

        },
        [Validators.required]
      ),
      /*fm_distrito_rep: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',

        },
        [Validators.required]
      ),*/
      fm_cargo: this.fb.control(
        {
          value: '',
          disabled: true
        },
        [Validators.required]
      ),
      fm_tipoDocumentoAdjunto: this.fb.control(
        {
          value: '',
          disabled: this.inputDisabled
        }
      ),
      fm_rep_id: this.fb.control({value: ''}),
      fm_phone_rep: this.fb.control({value: ''}, []),
      fm_partida_registral: this.fb.control({value: '', disabled: true}),
      fm_asiento_registral: this.fb.control({value: '', disabled: true}, [Validators.required]),
      fm_asiento_registral_rep: this.fb.control({value: '', disabled: true}),
      alterno: this.fb.control({value: '', disabled: true}),
      fm_cargo_4: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }, [Validators.required]),
      fm_cargo_3: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }, [Validators.required]),
      fm_cargo_5: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }, [Validators.required]),
      fm_cargo_6: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }, [Validators.required]),
      fm_tipoDocumento_4: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }, [Validators.required]),
      fm_tipoDocumento_3: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }, [Validators.required]),
      fm_tipoDocumento_5: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }, [Validators.required]),
      fm_tipoDocumento_6: this.fb.control({
        value: '',
        disabled: this.inputDisabled
      }, [Validators.required]),
      fm_documento_4: [{value: '', disabled: true}],
      fm_documento_3: [{value: '', disabled: true}],
      fm_documento_5: [{value: '', disabled: true}],
      fm_documento_6: [{value: '', disabled: true}],
      fm_apellidoPaterno_4: [{value: '', disabled: true}],
      fm_apellidoPaterno_3: [{value: '', disabled: true}],
      fm_apellidoPaterno_5: [{value: '', disabled: true}],
      fm_apellidoPaterno_6: [{value: '', disabled: true}],
      fm_apellidoMaterno_4: [{value: '', disabled: true}],
      fm_apellidoMaterno_3: [{value: '', disabled: true}],
      fm_apellidoMaterno_5: [{value: '', disabled: true}],
      fm_apellidoMaterno_6: [{value: '', disabled: true}],
      fm_nombres_4: [{value: '', disabled: true}],
      fm_nombres_3: [{value: '', disabled: true}],
      fm_nombres_5: [{value: '', disabled: true}],
      fm_nombres_6: [{value: '', disabled: true}],
      fm_email_4: ['', [Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      fm_email_3: ['', [Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      fm_email_5: ['', [Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      fm_email_6: ['', [Validators.email, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]],
      fm_celular_4: ['', this.validatorRepeatMovil],
      fm_celular_3: ['', this.validatorRepeatMovil],
      fm_celular_5: ['', this.validatorRepeatMovil],
      fm_celular_6: ['', this.validatorRepeatMovil],
      filesEdit: this.filesControlEdit,
    });
    this.getDepartamento();
    if (this.action) {
      this.Formulario.disable();
    }
    this.activateInactiveInputs();
    this.officials = {};
  }

  private validatorRepeatMovil(control: FormControl) {
    if (control.value) {
      const re = new RegExp(/^(\d)\1{8,}$/);
      const matches = re.test(control.value);
      return !matches ? null : {invalidName: true};
    } else {
      return null;
    }
  }

  activateInactiveInputs() {
    // var required = this.type =='pj' ? [Validators.required] : null;
    // pj-pn
    const a1 = this.Formulario.get('fm_phone');
    const a2 = this.Formulario.get('fm_paginaweb');
    const a3 = this.Formulario.get('fm_correo');
    const a4 = this.Formulario.get('fm_direccion');
    const a5 = this.Formulario.get('fm_departamento');
    const a6 = this.Formulario.get('fm_provincia');
    const a7 = this.Formulario.get('fm_distrito');
    const a8 = this.Formulario.get('fm_telefono');
    const a17 = this.Formulario.get('fm_observation');
    /// rep
    const a9 = this.Formulario.get('fm_celular_rep');
    const a10 = this.Formulario.get('fm_correo_rep');
    // const a11 = this.Formulario.get('fm_direccion_rep');
    // const a12 = this.Formulario.get('fm_departamento_rep');
    // const a13 = this.Formulario.get('fm_provincia_rep');
    // const a14 = this.Formulario.get('fm_distrito_rep');
    // const a15 = this.Formulario.get('fm_tipoDocumentoAdjunto');
    const a16 = this.Formulario.get('fm_cargo');

    // PJ => Oficiales
    const a20 = this.Formulario.get('fm_cargo_3');
    const a21 = this.Formulario.get('fm_tipoDocumento_3');
    const a22 = this.Formulario.get('fm_documento_3');
    const a23 = this.Formulario.get('fm_apellidoPaterno_3');
    const a24 = this.Formulario.get('fm_apellidoMaterno_3');
    const a25 = this.Formulario.get('fm_nombres_3');
    const a26 = this.Formulario.get('fm_email_3');
    const a27 = this.Formulario.get('fm_celular_3');

    const a28 = this.Formulario.get('fm_cargo_4');
    const a29 = this.Formulario.get('fm_tipoDocumento_4');
    const a30 = this.Formulario.get('fm_documento_4');
    const a31 = this.Formulario.get('fm_apellidoPaterno_4');
    const a32 = this.Formulario.get('fm_apellidoMaterno_4');
    const a33 = this.Formulario.get('fm_nombres_4');
    const a34 = this.Formulario.get('fm_email_4');
    const a35 = this.Formulario.get('fm_celular_4');

    const a36 = this.Formulario.get('fm_cargo_5');
    const a37 = this.Formulario.get('fm_tipoDocumento_5');
    const a38 = this.Formulario.get('fm_documento_5');
    const a39 = this.Formulario.get('fm_apellidoPaterno_5');
    const a40 = this.Formulario.get('fm_apellidoMaterno_5');
    const a41 = this.Formulario.get('fm_nombres_5');
    const a42 = this.Formulario.get('fm_email_5');
    const a43 = this.Formulario.get('fm_celular_5');

    const a44 = this.Formulario.get('fm_cargo_6');
    const a45 = this.Formulario.get('fm_tipoDocumento_6');
    const a46 = this.Formulario.get('fm_documento_6');
    const a47 = this.Formulario.get('fm_apellidoPaterno_6');
    const a48 = this.Formulario.get('fm_apellidoMaterno_6');
    const a49 = this.Formulario.get('fm_nombres_6');
    const a50 = this.Formulario.get('fm_email_6');
    const a51 = this.Formulario.get('fm_celular_6');

    //
    a20.setValidators(null);
    a21.setValidators(null);
    a22.setValidators(null);
    a23.setValidators(null);
    a24.setValidators(null);
    a25.setValidators(null);
    a26.setValidators(null);
    a27.setValidators(null);
    a28.setValidators(null);
    a29.setValidators(null);
    a30.setValidators(null);
    a31.setValidators(null);
    a32.setValidators(null);
    a33.setValidators(null);
    a34.setValidators(null);
    a35.setValidators(null);
    a36.setValidators(null);
    a37.setValidators(null);
    a38.setValidators(null);
    a39.setValidators(null);
    a40.setValidators(null);
    a41.setValidators(null);
    a42.setValidators(null);
    a43.setValidators(null);
    a44.setValidators(null);
    a45.setValidators(null);
    a46.setValidators(null);
    a47.setValidators(null);
    a48.setValidators(null);
    a49.setValidators(null);
    a50.setValidators(null);
    a51.setValidators(null);

    //
    a20.updateValueAndValidity();
    a21.updateValueAndValidity();
    a22.updateValueAndValidity();
    a23.updateValueAndValidity();
    a24.updateValueAndValidity();
    a25.updateValueAndValidity();
    a26.updateValueAndValidity();
    a27.updateValueAndValidity();
    a28.updateValueAndValidity();
    a29.updateValueAndValidity();
    a30.updateValueAndValidity();
    a31.updateValueAndValidity();
    a32.updateValueAndValidity();
    a33.updateValueAndValidity();
    a34.updateValueAndValidity();
    a35.updateValueAndValidity();
    a36.updateValueAndValidity();
    a37.updateValueAndValidity();
    a38.updateValueAndValidity();
    a39.updateValueAndValidity();
    a40.updateValueAndValidity();
    a41.updateValueAndValidity();
    a42.updateValueAndValidity();
    a43.updateValueAndValidity();
    a44.updateValueAndValidity();
    a45.updateValueAndValidity();
    a46.updateValueAndValidity();
    a47.updateValueAndValidity();
    a48.updateValueAndValidity();
    a49.updateValueAndValidity();
    a50.updateValueAndValidity();
    a51.updateValueAndValidity();

    if (this.type === 'pn') {
      a1.setValidators(null);
      a2.setValidators(null);
      a9.setValidators(null);
      a10.setValidators(null);
      // a11.setValidators(null);
      // a12.setValidators(null);
      // a13.setValidators(null);
      // a14.setValidators(null);
      // a15.setValidators(null);
      a16.setValidators(null);

      a1.updateValueAndValidity();
      a2.updateValueAndValidity();
      a10.updateValueAndValidity();
      // a11.updateValueAndValidity();
      // a12.updateValueAndValidity();
      // a13.updateValueAndValidity();
      // a14.updateValueAndValidity();
      // a15.updateValueAndValidity();

    } else {
      a9.setValidators([Validators.required, Validators.minLength(9), this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')]);
    }

    a9.updateValueAndValidity();
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

  changeCodePhone(event) {
    this.codePhoneSelected = event.value;
  }

  validar_campo(event): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  cancelar() {
    // this.route.navigate(['main/list-boxes']);
    history.back();
  }

  validarCelular(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    const numCelular = this.Formulario.get('fm_telefono')?.value;
    const primerDigito = event.target.selectionStart;
    const primerdato = numCelular[0];
    if (primerDigito == 0) {
      if (charCode == 57) {
        return true;
      } else {
        return false;
      }
    } else {
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      } else {
        return true;
      }
    }
  }

  validarCelularRep(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    const numCelular = this.Formulario.get('fm_celular_rep')?.value;
    const primerDigito = event.target.selectionStart;
    const primerdato = numCelular[0];
    if (primerDigito == 0) {
      if (charCode == 57) {
        return true;
      } else {
        return false;
      }
    } else {
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      } else {
        return true;
      }
    }
  }

  validardomicilio(e: any, idInput: string) {
    const value = this.Formulario.get('fm_direccion')?.value;

    const inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    const fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if (inicio == 0 && e.key === ' ') {
      return false;
    }

    // this.Formulario.get('fm_direccion')?.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
    return true;
  }

  download = async (path: string, name: string) => {
    try {
      this.load = true;
      const file = await this.usuarioService.download(path).toPromise();
      this.funcionesService.downloadFile(file, name);
      this.load = false;
    } catch (error) {
      this.load = false;

    }

  }

  consolidateDocuments(...documentSets: any[][]): any[] {
    // Array para representative nuevo cuadro
    return documentSets.reduce((consolidated, documentSet) => {
      return consolidated.concat(documentSet || []);
    }, []);
  }

  resendEmailAndSms(type: string, value: string, isRep: boolean) {
    let message = '';
    let messageSuccessful = '';

    const data: IResendEmailAndSms = {
      userId: this.id,
      sendType: type,
      email: '',
      cellphone: '',
      isRep,
      mode: 'inbox'
    };


    if (type === 'email') {
      data.email = value;
      message = '¿Estás seguro de reenviar la comunicación vía correo electrónico al destinatario?';
      messageSuccessful = 'El reenvío del email fue realizado con éxito';
    }

    if (type === 'sms') {
      data.cellphone = value;
      message = '¿Estás seguro de reenviar la comunicación vía mensaje de texto al destinatario?';
      messageSuccessful = 'El reenvío del mensaje de texto fue realizado con éxito';
    }

    this.funcionesService.mensajeConfirmar(message, 'Información')
      .then((resp) => {
        this.userService.resendEmailAndSms(data).subscribe((response) => {
          if (!response.success) {
            this.funcionesService.closeloading();
            this.funcionesService.mensajeError(response.message ? response.message : 'Error al reenviar ' + type.toUpperCase());
          } else {
            this.funcionesService.closeloading();
            this.funcionesService.mensajeOk(messageSuccessful);
            if (this.type === 'pj') {
              this.getInfoPj();
            } else {
              this.getInfoPn();
            }
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  resendEmailAndSmsOP(type: string, value: string, isRep: boolean, Rep_Id: string) {
    let message = '';
    let messageSuccessful = '';

    const data: IResendEmailAndSms = {
      userId: this.id,
      sendType: type,
      email: '',
      cellphone: '',
      mode: 'inbox',
      isRep,
      RepId: Rep_Id,
    };

    if (type === 'email') {
      data.email = value;
      message = '¿Estás seguro de reenviar la comunicación vía correo electrónico al destinatario?';
      messageSuccessful = 'El reenvío del email fue realizado con éxito';
    }

    if (type === 'sms') {
      data.cellphone = value;
      message = '¿Estás seguro de reenviar la comunicación vía mensaje de texto al destinatario?';
      messageSuccessful = 'El reenvío del mensaje de texto fue realizado con éxito';
    }

    this.funcionesService.mensajeConfirmar(message, 'Información')
      .then((resp) => {
        this.usuarioService.resendEmailAndSms(data).subscribe((response) => {
          if (!response.success) {
            this.funcionesService.closeloading();
            this.funcionesService.mensajeError(response.message ? response.message : 'Error al reenviar ' + type.toUpperCase());
          } else {
            this.funcionesService.closeloading();
            this.funcionesService.mensajeOk(messageSuccessful);
            this.getInfoPj();
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  disableUserCitizen(official: any) {
    this.funcionesService
      .mensajeConfirmarInput( 'En caso de ser necesario, ingrese el motivo:', `¿Estás seguro de deshabilitar el funcionario de ${official.position_name}?`, 'Deshabilitar')
      .then((motivo: string) => {
        this.userService.userDisableCitizen(official, motivo).subscribe((res) => {
          if (res.success) {
            this.funcionesService.mensajeOk('Funcionario deshabilitado correctamente').then(() => {
              this.getInfoPj();
            });
          } else {
            this.funcionesService.mensajeError(res.error).then(r => {});
          }
        });
      }).catch((err) => {});
  }
  EnableUserCitizen(official: any) {
    this.funcionesService
      .mensajeConfirmarInput( 'En caso de ser necesario, ingrese el motivo:', `¿Estás seguro de habilitar el funcionario de ${official.position_name}?`, 'Habilitar')
      .then((motivo: string) => {
        this.userService.userEnableCitizen(official, motivo).subscribe((res) => {
          if (res.success) {
            this.funcionesService.mensajeOk('Funcionario habilitado correctamente').then(() => {
              this.getInfoPj();
            });
          } else {
            this.funcionesService.mensajeError(res.error).then(r => {});
          }
        });
      }).catch((err) => {});
  }
  hasData(dataKey: string): boolean {
    return this.data2.representative &&
      this.data2.representative[dataKey] &&
      this.data2.representative[dataKey].length > 0;
  }
  getColumnDefs(dataKey: string): string[] {
    const basicColumns = ['doc', 'names', 'evaluator_user_names', 'date_begin', 'date_end', 'sustento'];
    return this.showAdvancedColumns(dataKey)
      ? [...basicColumns, 'foto']
      : basicColumns;
  }
  showAdvancedColumns(dataKey: string): boolean {
    return ['Rep_Legal', 'Pers_Legal_OP'].includes(dataKey);
  }
  getAvailableRoles() {
    return this.cargosOP.filter(role => role.op === (this.data2.orgPol === '1'));
  }
  get emailPJ() {
    return this.data2?.event_history?.EMAIL_SENT?.PJ[0];
  }
  get smsPJ() {
    return this.data2?.event_history?.SMS_SENT?.PJ[0];
  }
  get emailPersonero() {
    return this.data2?.event_history?.EMAIL_SENT?.Pers_Legal_OP[0];
  }
  get smsPersonero() {
    return this.data2?.event_history?.SMS_SENT?.Pers_Legal_OP[0];
  }
  get emailTesorero() {
    return this.data2?.event_history?.EMAIL_SENT?.Tesorero_OP[0];
  }
  get smsTesorero() {
    return this.data2?.event_history?.SMS_SENT?.Tesorero_OP[0];
  }
  get emailRep_Legal() {
    return this.data2?.event_history?.EMAIL_SENT?.Rep_Legal_OP[0];
  }
  get smsRep_Legal() {
    return this.data2?.event_history?.SMS_SENT?.Rep_Legal_OP[0];
  }
  get emailPresidente() {
    return this.data2?.event_history?.EMAIL_SENT?.Presidente_OP[0];
  }
  get smsPresidente() {
    return this.data2?.event_history?.SMS_SENT?.Presidente_OP[0];
  }
  get emailPresidenteOEC() {
    return this.data2?.event_history?.EMAIL_SENT?.PresidenteOEC_OP[0];
  }
  get smsPresidenteOEC() {
    return this.data2?.event_history?.SMS_SENT?.PresidenteOEC_OP[0];
  }
  setupCargoDisplayData() {
    this.cargoDisplayData = [
      {
        title: 'PERSONA JURÍDICA',
        email: this.emailPJ,
        sms: this.smsPJ,
        positionId: '',
        showButton: true,
        emailHistoryCheck: this.data2.event_history?.EMAIL_SENT.PJ.length > 0,
        smsHistoryCheck: this.data2.event_history?.SMS_SENT.PJ.length > 0,
        isRep: false,
      },
      {
        title: 'PERSONERO LEGAL TITULAR',
        email: this.emailPersonero,
        sms: this.smsPersonero,
        positionId: this.data2.representative?.Pers_Legal_OP[0]?.user_id,
        showButton: this.cargosOP[1].status,
        emailHistoryCheck: this.data2.event_history?.EMAIL_SENT.Pers_Legal_OP.length > 0 && this.cargosOP[1].value,
        smsHistoryCheck: this.data2.event_history?.SMS_SENT.Pers_Legal_OP.length > 0 && this.cargosOP[1].value,
        isRep: true,
      },
      {
        title: 'TESORERO',
        email: this.emailTesorero,
        sms: this.smsTesorero,
        positionId: this.data2.representative?.Tesorero_OP[0]?.user_id,
        showButton: this.cargosOP[2].status,
        emailHistoryCheck: this.data2.event_history?.EMAIL_SENT.Tesorero_OP.length > 0 && this.cargosOP[2].status,
        smsHistoryCheck: this.data2.event_history?.SMS_SENT.Tesorero_OP.length > 0 && this.cargosOP[2].status,
        isRep: true
      },
      {
        title: 'REPRESENTANTE LEGAL OP',
        email: this.emailRep_Legal,
        sms: this.smsRep_Legal,
        positionId: this.data2.representative?.Rep_Legal_OP[0]?.user_id,
        showButton: this.cargosOP[3].status,
        emailHistoryCheck: this.data2.event_history?.EMAIL_SENT.Rep_Legal_OP.length > 0 && this.cargosOP[3].status,
        smsHistoryCheck: this.data2.event_history?.SMS_SENT.Rep_Legal_OP.length > 0 && this.cargosOP[3].status,
        isRep: true
      },
      {
        title: 'PRESIDENTE',
        email: this.emailPresidente,
        sms: this.smsPresidente,
        positionId: this.data2.representative?.Presidente_OP[0]?.user_id,
        showButton: this.cargosOP[4].status,
        emailHistoryCheck: this.data2.event_history?.EMAIL_SENT.Presidente_OP.length > 0 && this.cargosOP[4].status,
        smsHistoryCheck: this.data2.event_history?.SMS_SENT.Presidente_OP.length > 0 && this.cargosOP[4].status,
        isRep: true
      },
      {
        title: 'PRESIDENTE DEL OEC',
        email: this.emailPresidenteOEC,
        sms: this.smsPresidenteOEC,
        positionId: this.data2.representative?.PresidenteOEC_OP[0]?.user_id,
        showButton: this.cargosOP[5].status,
        emailHistoryCheck: this.data2.event_history?.EMAIL_SENT.PresidenteOEC_OP.length > 0 && this.cargosOP[5].status,
        smsHistoryCheck: this.data2.event_history?.SMS_SENT.PresidenteOEC_OP.length > 0 && this.cargosOP[5].status,
        isRep: true
      }
    ];
  }
  buildTooltip(remitente: string, type: string, origen: string) {
    const tipoDato = type === 'email' ? 'correo electrónico' : 'celular';

    if (origen === 'PJ') {
      if (remitente === this.cargoDisplayData[1][type]?.sent_to) {
        return `Enviado a: ${remitente}\nEl ${tipoDato} coincide con el registrado en el representante.`;
      }
    } else {
      if (remitente === this.cargoDisplayData[0][type]?.sent_to) {
        return `Enviado a: ${remitente}\nEl ${tipoDato} coincide con el registrado en la PJ.`;
      }
    }
    return `Enviado a: ${remitente}`;
  }
  setupTooltips() {
    for (let i = 0; i < 2/*this.cargoDisplayData.length*/; i++) {
      if (this.cargoDisplayData[i].email?.sent_to) {
        const origen = i === 0 ? 'PJ' : 'rep';
        this.cargoDisplayData[i].tooltipEMAIL = this.buildTooltip(
          this.cargoDisplayData[i].email.sent_to,
          'email',
          origen
        );
      }

      if (this.cargoDisplayData[i].sms?.sent_to) {
        const origen = i === 0 ? 'PJ' : 'rep';
        this.cargoDisplayData[i].tooltipSMS = this.buildTooltip(
          this.cargoDisplayData[i].sms.sent_to,
          'sms',
          origen
        );
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
