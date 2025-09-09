import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActionType } from 'src/app/shared/enums/configuracion.enum';
import {
  listDoc,
  listDocRep,
} from 'src/app/pages/main/operador/edit-box/store/casilla.model';
import { FileUploadValidators } from '@iplab/ngx-file-upload';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { TypeAccreditation } from 'src/app/models/users/user';
import { UserService } from 'src/app/services/user.service';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';

@Component({
  selector: 'app-edit-box',
  templateUrl: './edit-box.component.html',
  styleUrls: ['./edit-box.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EditBoxComponent implements OnInit {
  @ViewChild('fileUpload', { static: false }) fileUpload: ElementRef;

  action: number;
  actionType = ActionType;
  form: FormGroup;
  load: boolean = false;
  isLoading: boolean = false;
  existData = true;
  listTypeAcreditation: TypeAccreditation[];

  uploadedFiles: Array<File> = [];
  formData: any;

  documentos: any;
  documentosRep: any;

  prompt: any;
  promptRep: any;

  constructor(
    private fb: FormBuilder,
    private funcionesService: FuncionesService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.composer(ActionType.BUILD_URL, this.route.snapshot);
  }

  ngOnInit(): void {
    this.composer(ActionType.INIT);
  }

  composer = (action: number, data: any = null) => {
    this.action = action;
    switch (action) {
      case ActionType.BUILD_URL:
        this.onLoadUrlParam(data);
        break;
      case ActionType.INIT:
        this.buildAcreditacion();
        this.buildForm();
        this.buildFormData();
        break;
      case ActionType.LOAD:
        break;
      case ActionType.BUILD:
        break;
      case ActionType.SELECT:
        break;
      case ActionType.SUBMIT:
        this.eSubmit();
        break;
      case ActionType.CLOSE:
        this.router.navigate(['/main/operador/usuarios']);
        break;
      case ActionType.FILE_DELETE:
        break;
    }
  };
  // ===================== LOAD =============================
  private onLoadUrlParam = async (route: ActivatedRouteSnapshot) => {
    let casilla = this.route.snapshot.queryParams.casilla;
    if (casilla != null) {
      const data = await this.userService.getUser(casilla).toPromise();
      // console.log(data);
    }
  };
  //--------------------------BUILD
  private buildForm = () => {
    let r1 = Validators.required;
    let r2 = this.validRep;
    let r3 = Validators.pattern('^(?=.*).{7,}$');
    let r4 = Validators.pattern(
      "^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$"
    );
    this.form = this.fb.group({
      tipoDocumento: new FormControl('', [r1]),
      documento: new FormControl('', [r1]),
      tipoDocumentoRep: new FormControl('', [r1]),
      documentoRep: new FormControl('', [r1]),
      nombres: new FormControl('', [r1, r4]),
      apPaterno: new FormControl('', [r1, r4]),
      apMaterno: new FormControl('', [r1, r4]),
      correo: new FormControl('', [r1]),
      telefono: new FormControl('', [r2, r3]),
      celular: new FormControl('', [r1, r2]),
      direccion: new FormControl('', [r1]),
      acreditacion: new FormControl('', [r1]),
      razonSocial: new FormControl('', [r1]),
      organizacion: new FormControl('', [r1]),
      files: this.filesControl,
    });
  };
  private buildFormData = () => {
    this.formData = new FormData();
    this.documentos = listDoc;
    this.documentosRep = listDocRep;
    this.prompt = { min: null, max: null };
    this.promptRep = { min: null, max: null };
  };
  public filesControl = new FormControl(null, [
    Validators.required,
    FileUploadValidators.accept(['.pdf']),
    FileUploadValidators.filesLimit(5),
    FileUploadValidators.fileSize(1048576 * 10),
    this.noWhitespaceValidator,
  ]);
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
  private buildResetForm = (level: number) => {
    this.form.get('nombres').setValue('');
    this.form.get('apPaterno').setValue('');
    this.form.get('apMaterno').setValue('');
    this.form.get('correo').setValue('');
    this.form.get('celular').setValue('');
    this.form.get('telefono').setValue('');
    this.form.get('direccion').setValue('');
    this.form.get('acreditacion').setValue(null);
    if (level == 1) return;
    this.form.get('documentoRep').setValue('');
    if (level == 2) return;
    this.form.get('razonSocial').setValue('');
    this.form.get('tipoDocumentoRep').setValue(null);
    this.form.get('organizacion').setValue('');
    this.form.get('files').setValue(null);
    this.uploadedFiles = [];
    if (level == 3) return;
    this.form.get('documento').setValue('');
    if (level == 4) return;
  };
  private buildError = (message: string) => {
    this.funcionesService.mensajeError(message);
  };
  private buildValidate = (status) => {
    var required = status ? [Validators.required] : null;
    const a1 = this.form.get('tipoDocumentoRep');
    const a2 = this.form.get('documentoRep');
    const a3 = this.form.get('razonSocial');
    a1.setErrors(null);
    a2.setErrors(null);
    a3.setErrors(null);
    a1.setValidators(required);
    a2.setValidators(required);
    a3.setValidators(required);
    a1.reset();
    a2.reset();
    a3.reset();
  };
  private buildAcreditacion() {
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
  //--------------------------EVENTS HTML
  eChangeDocumento(event) {
    this.buildResetForm(4);
    this.existData = true;
    if (event.value === 'dni') {
      this.prompt.min = 8;
      this.prompt.max = 8;
      this.buildValidate(false);
    } else if (event.value === 'ce') {
      this.prompt.min = 9;
      this.prompt.max = 9;
      this.buildValidate(false);
    } else if (event.value === 'ruc') {
      this.prompt.min = 11;
      this.prompt.max = 11;
      this.buildValidate(true);
    }
  }
  eChangeDocumentoRep(event) {
    this.buildResetForm(2);
    if (event.value === 'dni') {
      this.promptRep.min = 8;
      this.promptRep.max = 8;
    } else if (event.value === 'ce') {
      this.promptRep.min = 9;
      this.promptRep.max = 9;
    }
  }
  eChangeLabel = (name: string) => {
    const esRuc = this.form.get('documento').value == 'ruc';
    switch (name) {
      case 'documento':
        if (esRuc) return 'Número de RUC';
        return 'Número de Documento';
    }
  };
  eChangeHolder = (name: string) => {
    const esRuc = this.form.get('tipoDocumento').value == 'ruc';
    switch (name) {
      case 'documento':
        if (esRuc) return 'Ingrese el número de RUC';
        return 'Ingrese el número de Documento';
    }
  };
  eChangekeydown(event, type) {
    if (event.keyCode == 9) return;

    if (type == 'documento_rep') {
      this.buildResetForm(1);
    }
    if (type == 'documento') {
      this.buildResetForm(3);
    }
  }
  eSearch = async (type: string) => {
    switch (type) {
      case 'general':
        var res = await this.validDocument(type);
        if (res) this.eSearchDocument(type);
        break;
      case 'representante':
        var res = await this.validDocument(type);
        if (res) this.eSearchDocument(type);
        break;
      default:
        break;
    }
  };
  eShowError = (input) => {
    switch (input) {
      case 'tipoDocumento':
        return 'Debe ingresar un tipo de documento';
      case 'documento':
        return 'Debe ingresar un número de documento';
      case 'tipoDocumentoRep':
        return 'Debe ingresar un tipo de documento';
      case 'documentoRep':
        return 'Debe ingresar un número de documento';
      default:
        return 'Campo requerido';
    }
  };
  eHide = (name: string) => {
    const esRuc = this.form.get('tipoDocumento').value == 'ruc';
    switch (name) {
      case 'razonSocial':
        if (esRuc) return true;
        return false;
      case 'tipoDocumentoRep':
        if (esRuc) return true;
        return false;
      case 'documentoRep':
        if (esRuc) return true;
        return false;
      case 'organizacion':
        if (esRuc) return false;
        return true;
    }
  };
  //--------------------------EVENTS
  private eSubmit = () => {
    this.load = true;
    if (!this.form.valid) return;
    const esRuc = this.form.get('tipoDocumento').value == 'ruc';
    const fd = new FormData();
    fd.append('email', this.form.controls['correo'].value);
    fd.append('cellphone', this.form.controls['celular'].value);
    fd.append('phone', this.form.controls['telefono'].value);
    fd.append('address', this.form.controls['direccion'].value);
    fd.append('name', this.form.controls['nombres'].value);
    fd.append('lastname', this.form.controls['apPaterno'].value);
    fd.append('second_lastname', this.form.controls['apMaterno'].value);
    fd.append('acreditation_type', this.form.controls['acreditacion'].value);

    if (esRuc) {
      fd.append('docType', this.form.controls['tipoDocumentoRep'].value);
      fd.append('doc', this.form.controls['documentoRep'].value);
      fd.append('ruc', this.form.controls['documento'].value);
      fd.append('razonsocial', this.form.controls['razonSocial'].value);
      fd.append('organization', this.form.controls['razonSocial'].value);
    } else {
      fd.append('docType', this.form.controls['tipoDocumento'].value);
      fd.append('doc', this.form.controls['documento'].value);
      fd.append('organization', this.form.controls['organizacion'].value);
    }

    var files = this.form.controls['files'].value;
    for (let index = 0; index < files.length; index++) {
      var str1 = files[index].name.replace(/.([^.]*)$/, '.pdf');
      const tempFile = new File(
        [files[index]],
        str1.replace(/[^a-zA-Z0-9\\.\\-]/g, '-'),
        {
          type: files[index].type.toLowerCase(),
        }
      );
      fd.append('file' + (index + 1), tempFile);
    }

    this.isLoading = true;
    this.funcionesService.showloading('Procesando...','Creando casilla electrónica');
    this.userService.CreateBox(fd).subscribe(
      (res) => {
        this.isLoading = false;
        this.funcionesService.closeloading();
        this.load = false;
        if (res.success) {
          this.funcionesService.mensajeOk(
            'Los datos de casilla electrónica fueron registrados con éxito',
            '/login'
          );
        } else {
          this.funcionesService.mensajeError(res.error.message);
        }
      },
      (err) => {
        this.isLoading = false;
        this.funcionesService.closeloading();
        this.load = false;
        console.log('Problemas del servicio', err);
      }
    );
  };
  private eSearchDocument = async (type: string) => {
    var tipo = '';
    var doc = '';
    this.load = true;
    if (type == 'general') {
      tipo = this.form.controls['tipoDocumento'].value;
      doc = this.form.controls['documento'].value;
    } else if (type == 'representante') {
      tipo = this.form.controls['tipoDocumentoRep'].value;
      doc = this.form.controls['documentoRep'].value;
    }
    var response = null;
    var message = 'No se encontró los datos del documento.';
    switch (tipo) {
      case 'ruc':
        response = await this.consultaSunat(doc);
        message = 'El RUC ' + doc + ' solicitado no está registrado';
        break;
      case 'ce':
        response = await this.consultaExtranjeria(doc);
        message =
          'El CE ' +
          doc +
          ' solicitado no está registrado, por favor ingrese los datos';
        this.existData = false;
        break;
      case 'dni':
        response = await this.consultaReniec(doc);
        message =
          'El DNI ' + doc + ' solicitado no está registrado en el padrón';
        break;
      default:
        break;
    }
    this.load = false;
    if (response) {
      this.existData = true;
    } else {
      this.buildError(message);
    }
  };
  private consultaReniec = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaReniec(doc).subscribe(
        (resp: any) => {
          if (resp.statusCode === 200) {
            var nombres = `${resp.body.nombres} ${resp.body.appat} ${resp.body.apmat}`;
            this.form.get('nombres').setValue(resp.body.nombres);
            this.form.get('apPaterno').setValue(resp.body.appat);
            this.form.get('apMaterno').setValue(resp.body.apmat);
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
  };
  private consultaSunat = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaSunat(doc).subscribe(
        (resp) => {
          if (resp) {
            if (resp.list.multiRef.ddp_nombre.$ != undefined) {
              var razon = `${resp.list.multiRef.ddp_nombre.$}`;
              this.form.get('razonSocial').setValue(razon);
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
  private consultaClaridad = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      resolve(false);
    });
  };
  private consultaExtranjeria = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      resolve(false);
    });
  };
  //--------------------------VALIDS
  private validRep(control: FormControl) {
    if (control.value) {
      var re = new RegExp(/^(\d)\1{8,}$/);
      var matches = re.test(control.value);
      return !matches ? null : { invalidName: true };
    } else {
      return null;
    }
  }
  private validDocument = async (type: string) => {
    var isGeneral = type == 'general';
    var isRepresentante = type == 'representante';
    if (!this.form.controls['tipoDocumento'].valid && isGeneral) {
      this.buildError('Debe seleccionar un tipo de documento');
      return false;
    }
    if (!this.form.controls['documento'].valid && isGeneral) {
      this.buildError('Debe ingresar un número correcto');
      return false;
    }
    if (!this.form.controls['tipoDocumentoRep'].valid && isRepresentante) {
      this.buildError('Debe seleccionar un tipo de documento Representante');
      return false;
    }
    if (!this.form.controls['documentoRep'].valid && isRepresentante) {
      this.buildError('Debe ingresar un número correcto Representante');
      return false;
    }
    return true;
  };
}
