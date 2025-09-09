import {Component, OnInit, Renderer2} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {TypeDocument} from 'src/app/models/notifications/notification';
import {UserService} from 'src/app/services/user.service';
import {FuncionesService} from 'src/app/utils/funciones.service';
import {Location} from '@angular/common';
import {PersonService} from 'src/app/services/person.service';
import {
  LBL_ADD_FILES,
  LBL_ERROR_MAX_FILES,
  LBL_ERROR_MAX_LENGTH_NAME,
  LBL_ERROR_MAX_SIZE_FILE,
  LBL_ERROR_ONLY_FILE,
  LBL_FEATURES_FILE,
  LBL_FEATURES_FILE_1,
  MAX_TAM_FILES_10,
  MAXFILES,
  MIN_TAM_FILES
} from '../../../../shared/constantes';
import {FileUploadValidators} from "@iplab/ngx-file-upload";

@Component({
  selector: 'app-add-official',
  templateUrl: './add-official.component.html',
  styleUrls: ['./add-official.component.scss'],
})
export class AddOfficialComponent implements OnInit {
  constructor(
    private route: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private funcionesService: FuncionesService,
    private renderer: Renderer2,
    private router: ActivatedRoute,
    private readonly location: Location,
    private personService: PersonService
  ) {
    this.id = this.router.snapshot.paramMap.get('id');
    this.type = this.router.snapshot.paramMap.get('type');
  }

  id;
  type: string;
  cargos = [
    {id: '3', value: 'Tesorero'},
    {id: '4', value: 'Representante Legal OP'},
    {id: '5', value: 'Presidente'},
    {id: '6', value: 'Presidente del OEC'}
  ];
  typeDocument: TypeDocument[] = [
    {id: 'dni', value: 'DNI'},
    {id: 'ce', value: 'Carnet de Extranjería'},
  ];
  typeDocument2: TypeDocument[] = [
    { id: 'dni', value: 'DNI' },
    { id: 'ruc', value: 'RUC'},
    { id: 'ce', value: 'Carnet de Extranjería' },
    { id: 'pr', value: 'Partida registral' },
  ];
  inputDisabled = false;
  nombres: FormControl = new FormControl({value: '', disabled: true});
  apPaterno: FormControl = new FormControl({value: '', disabled: true});
  apMaterno: FormControl = new FormControl({value: '', disabled: true});
  fm_correo: FormControl = new FormControl({value: '', disabled: false}, [Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
  maxFiles: number = MIN_TAM_FILES;
  maxSizeFile: number = MAX_TAM_FILES_10;
  minSizeFile: number = MIN_TAM_FILES;
  filesControlRep = new FormControl(null, [
    Validators.required,
    FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({minSize: this.minSizeFile, maxSize: this.maxSizeFile}),
  ]);
  FormRepresentative: FormGroup = this.fb.group({
    fm_cargo: this.fb.control({value: '', disabled: false}, [Validators.required]),
    fm_optiontipo_rep: this.fb.control({value: null, disabled: false}, [Validators.required]),
    fm_numerodoc_rep: this.fb.control({value: '', disabled: true}, [Validators.required]),
    nombres: this.nombres,
    apPaterno: this.apPaterno,
    apMaterno: this.apMaterno,
    fm_correo: this.fm_correo,
    fm_celular: this.fb.control({value: '', disabled: false}, [
      Validators.required,
      Validators.minLength(9),
      this.validatorRepeatMovil, Validators.pattern('^9[0-9]*$')
    ]),
    filesRep: this.filesControlRep,
  }, { validators: this.apellidoRequerido.bind(this) });
  Formulario: FormGroup = this.fb.group({
    fm_optiontipo: this.fb.control({value: '', disabled: true}, [Validators.required]),
    fm_numerodoc: this.fb.control({value: null, disabled: true}, [Validators.required]),
    fm_organization_name: this.fb.control({value: '', disabled: true}, [Validators.required]),
  });
  user: any ;
  isCE = false;
  isCERep = false;
  maxlengthNumDocRep: number;
  minlengthNumDocRep: number;
  load = false;
  existData = true;
  documentTypeSelectedRep = '';
  officials: any = {};
  uploadedFiles: Array<File> = [];
  lblAddFiles: string = LBL_ADD_FILES;
  lblFeaturesFile: string = LBL_FEATURES_FILE_1;

  maxsize_ = 10485760;
  ext = 'pdf jpg jpeg png bmp PDF JPG JPEG PNG BMP';
  err_max_files = false;
  err_format = false;
  err_size = false;
  err_size_name = false;
  loading = true;
  ngOnInit(): void {
    this.userService.getUserOfficials(this.id).subscribe((resp) => {
      if (!resp.success) {
        return;
      }
      this.officials = resp.officials;
    }, (error) => {
      console.error(error);
    });
    this.getInfoPj();
    this.getNumeroDocumento();
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
  getInfoPj(){
    this.userService.getUserDetailPn(this.id, false).subscribe((resp) => {

      if (!resp.success){
        return;
      }
      this.user = resp.user;
      this.Formulario.controls.fm_optiontipo.setValue( this.user.doc_type);
      this.Formulario.controls.fm_numerodoc.setValue( this.user.doc);
      this.Formulario.controls.fm_organization_name.setValue( this.user.organization_name);
      this.loading = false;
      }, (error) => {
      console.error(error);
    });
  }
  getNumeroDocumento() {
    this.FormRepresentative.get('fm_numerodoc_rep').valueChanges.subscribe((documento) => {
      if (this.documentTypeSelectedRep === 'dni') {
        if (documento.length === this.minlengthNumDocRep) {
          this.eSearch('representante');
        }
        else {
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
        }
      } else if (this.documentTypeSelectedRep === 'ce') {
        if (documento.length === 9) {
          this.eSearch('representante');
        }else{
          this.existData = true;
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
        }
      }
    });
  }
  validatorFile(name: string) {
    this.err_format = false;
    this.err_size = false;
    this.err_size_name = false;
    this.err_max_files = false;
    const file = this.FormRepresentative.controls[name].value;
    this.uploadedFiles = this.FormRepresentative.controls[name].value;

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
    this.FormRepresentative.controls[name].setValue(this.uploadedFiles);
  }
  formInvalid(control: string) {
    return (
      this.FormRepresentative.get(control).invalid &&
      (this.FormRepresentative.get(control).dirty ||
        this.FormRepresentative.get(control).touched)
    );
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

  validatorRepeatMovil(control: FormControl) {
    if (control.value) {
      const re = new RegExp(/^(\d)\1{8,}$/);
      const matches = re.test(control.value);
      return !matches ? null : {invalidName: true};
    } else {
      return null;
    }
  }

  saveEdit() {
    if (!this.FormRepresentative.valid) {
      return;
    }
    const fd = new FormData();
    if (this.apPaterno.value === '' && this.apMaterno.value === '') {
      this.funcionesService.mensajeError('Ingrese por lo menos un apellido');
    } else {
      const files = this.FormRepresentative.controls.filesRep.value;
      if (files && files.length > 0) {
        const file = files[0];
        const str1 = file.name;
        const tempFile = new File(
          [file],
          str1,
          {
            type: file.type.toLowerCase(),
          }
        );
        fd.append('file1', tempFile);
      }
      fd.append('docType', this.FormRepresentative.controls['fm_optiontipo_rep'].value);
      fd.append('doc', this.FormRepresentative.controls['fm_numerodoc_rep'].value);
      fd.append('lastname', this.apPaterno.value.trim().toUpperCase());
      fd.append('second_lastname', this.apMaterno.value.trim().toUpperCase());
      fd.append('names', this.nombres.value.trim().toUpperCase());
      fd.append('email', this.fm_correo.value.toLowerCase());
      fd.append('cellphone', this.FormRepresentative.controls['fm_celular'].value);
      fd.append('position', this.FormRepresentative.controls['fm_cargo'].value.id);
      fd.append('positionName', this.FormRepresentative.controls['fm_cargo'].value.value);
      fd.append('userId', this.id);
      new Response(fd).text().then(console.log);
      this.load = true;
      this.userService.SaveRepresentativeOfficial(fd).subscribe(
        (res) => {
          this.load = false;
          if (res.success) {
            this.funcionesService.mensajeOk('Se creó un funcionario con éxito');
            history.back();
          } else {
            this.load = false;
            this.funcionesService.mensajeError(res.error.message);
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

  buildError = (message: string) => {
    this.funcionesService.mensajeError(message);
  }
  buildInfo = (message: string) => {
    this.funcionesService.mensajeInfo(message);
  }
  consultaSunat = (doc: string) => {
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
  }

  consultaExtranjeria = (doc: string, type: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaCE(doc, type).subscribe(
        (resp) => {
          if (resp.success) {
            this.nombres.setValue(resp.name);
            this.apPaterno.setValue(resp.lastname != null ? resp.lastname : '');
            this.apMaterno.setValue(resp.second_lastname != null ? resp.second_lastname : "");
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

  eSearchDocument = async (type: string) => {
    let tipo = '';
    let doc = '';
    this.load = true;
    if (type === 'general') {
      tipo = this.FormRepresentative.controls['fm_optiontipo'].value;
      doc = this.FormRepresentative.controls['fm_numerodoc'].value;
    }
    if (type === 'representante') {
      tipo = this.FormRepresentative.controls['fm_optiontipo_rep'].value;
      doc = this.FormRepresentative.controls['fm_numerodoc_rep'].value;
    }
    let userExist = true;
    if (this.type === 'pn') {
      userExist = await this.consultaCasilla(doc, tipo);
    }

    if (!userExist) {
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
        response = await this.consultaReniec(doc, type);
        message = 'El DNI ' + doc + ' no ha sido encontrado en el padrón. Verifica si el número ingresado es correcto.';
        break;
      default:
        break;
    }
    this.load = false;
    if (response) {
      this.existData = true;
    } else {
      if (tipo === 'ce') {
        this.buildInfo(message);
        this.existData = false;
        this.nombres.setValue('');
        this.apPaterno.setValue('');
        this.apMaterno.setValue('');
        this.funcionesService.closeloading();
        this.buildInfo(message);
      } else if (tipo === 'dni') {
        this.personService.findByDni(doc).subscribe(
          (res) => {
            if (res.success) {
              this.funcionesService.closeloading();
              this.nombres.setValue(res.data.nombre);
              this.apPaterno.setValue(res.data.paterno != null ? res.data.paterno : "");
              this.apMaterno.setValue(res.data.materno != null ? res.data.materno : "");
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
  consultaReniec = (doc: string, type: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaReniec(doc).subscribe(
        (resp: any) => {
          if (resp.statusCode === 200) {
            this.nombres.setValue(resp.body.nombres);
            this.apPaterno.setValue(resp.body.appat != null ? resp.body.appat : "");
            this.apMaterno.setValue(resp.body.apmat != null ? resp.body.apmat : "");
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
  consultaCasilla = (doc: string, type: string) => {
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
  buildHide = (name: string) => {
    const esRuc = true;
    switch (name) {
      case 'fm_razon_social':
        return esRuc;
      case 'fm_optiontipo_rep':
        return esRuc;
      case 'fm_numerodoc_rep':
        return esRuc;
      case 'fm_organizacion':
        return !esRuc;
    }
  }

  eChangeDocumentoRep(event) {
    this.eResetForm(6);
    this.existData = true;
    this.documentTypeSelectedRep = event.value;
    this.isCERep = this.documentTypeSelectedRep === 'ce';
    this.FormRepresentative.get('fm_numerodoc_rep').enable();
    this.FormRepresentative.get('fm_correo').enable();
    this.FormRepresentative.get('fm_celular').enable();
    if (this.documentTypeSelectedRep === 'dni') {
      this.minlengthNumDocRep = 8;
      this.maxlengthNumDocRep = 8;
      this.eChangeType(false);
      this.apPaterno.disable();
      this.apMaterno.disable();
      this.nombres.disable();
    } else if (this.documentTypeSelectedRep === 'ce') {
      this.minlengthNumDocRep = 9;
      this.maxlengthNumDocRep = 9;
      this.eChangeType(true);
      this.apPaterno.enable();
      this.apMaterno.enable();
      this.nombres.enable();
    }
  }

  eResetForm = (level: number) => {
    this.nombres.setValue('');
    this.apPaterno.setValue('');
    this.apMaterno.setValue('');
    this.FormRepresentative.get('fm_numerodoc_rep').setValue('');
    if (level === 6) {
      return;
    }
    this.FormRepresentative.get('fm_razon_social').setValue('');
    this.FormRepresentative.get('fm_optiontipo_rep').setValue(null);
    this.FormRepresentative.get('fm_numerodoc').setValue('');
    if (level === 5) {
      return;
    }
  }
  eChangeType = (status) => {
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

  validar_campo(event, type): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    const posicion = event.target.selectionStart;

    if (posicion === 0 && type === 'fm_celular') {
      if (charCode === 57) {
        return true;
      } else {
        return false;
      }
    } else {
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      }
      return true;
    }
  }

  buscarCE() {
    if (this.isCE) {
      this.eSearch('general');
    }
    if (this.minlengthNumDocRep === this.FormRepresentative.controls['fm_numerodoc_rep'].value.length) {
      this.eSearch('representante');
    }
  }

  eSearch = async (type: string) => {
    if (type === 'general') {
      const res = await this.validDocument(type);
      if (res) {
        this.eSearchDocument(type);
      }
    } else if (type === 'representante') {
      const numDoc = this.FormRepresentative.controls['fm_numerodoc_rep'].value;
      const cargo = this.FormRepresentative.controls['fm_cargo'].value;

      if (cargo && cargo.value) {
        const i = this.officials.findIndex(rep => {
          return rep.position_name.toUpperCase() === cargo.value.toUpperCase() && rep.doc === numDoc;
        });

        if (i >= 0) {
          this.funcionesService.mensajeInfo(`El documento ${numDoc} está actualmente como ${cargo.value}`);
          this.FormRepresentative.get('fm_numerodoc_rep').setValue('');
          this.FormRepresentative.get('apPaterno').setValue('');
          this.FormRepresentative.get('apMaterno').setValue('');
          this.FormRepresentative.get('nombres').setValue('');
        } else {
          const res = await this.validDocument(type);
          if (res) {
            this.eSearchDocument(type);
          }
        }
      } else {
        const res = await this.validDocument(type);
        if (res) {
          this.eSearchDocument(type);
        }
      }
    }
  }

  validDocument = async (type: string) => {
    const isGeneral = type === 'general';
    const isRepresentante = type === 'representante';
    if (!this.FormRepresentative.controls['fm_optiontipo_rep'].valid && isRepresentante) {
      this.buildError('Debe seleccionar un tipo de documento Representante');
      return false;
    }
    if (!this.FormRepresentative.controls['fm_numerodoc_rep'].valid && isRepresentante) {
      this.buildError('Debe ingresar un número correcto Representante');
      return false;
    }
    return true;
  }

  eChangeCargo(event) {
    const cargo = this.FormRepresentative.controls['fm_cargo'].value;
    const numDoc = this.FormRepresentative.controls['fm_numerodoc_rep'].value;

    if (numDoc && numDoc.length > 0) {
      const i = this.officials.findIndex(rep => {
        return rep.position_name.toUpperCase() === cargo.value.toUpperCase() && rep.doc === numDoc;
      });

      if (i >= 0) {
        this.funcionesService.mensajeInfo(`El documento ${numDoc} está actualmente como ${cargo.value}`);
        this.FormRepresentative.get('fm_numerodoc_rep').setValue('');
        this.FormRepresentative.get('apPaterno').setValue('');
        this.FormRepresentative.get('apMaterno').setValue('');
        this.FormRepresentative.get('nombres').setValue('');
      }
    }

    return;
  }

  soloExpLetras(idInput: string, inputForm: FormControl, e: any) {
    const inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    const fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    const value: string = inputForm.value;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if (inicio === 0 && e.key === ' ') {
      return false;
    }
    // inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
    return !!/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.\'"-°]+$/.test(e.key);
  }

  quitarDobleEspacio(idInput: string, inputForm: FormControl, e: any) {
    const inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    const fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    const value: string = inputForm.value;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if (inicio === 0 && e.key === ' ') {
      return false;
    }
    // inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
  }

  cancelar(): void {
    this.location.back();
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
