import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
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
import { FileUploadValidators } from '@iplab/ngx-file-upload';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { TypeAccreditation, TypeCatalog } from 'src/app/models/users/user';
import { UserService } from 'src/app/services/user.service';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';
import { listDoc, listDocRep, listProfile } from './store/casilla.model';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
})
export class EditUserComponent implements OnInit {
  @ViewChild('fileUpload', { static: false }) fileUpload: ElementRef;

  action: number;
  actionType = ActionType;
  form: FormGroup;
  load: boolean = false;
  existData: boolean = true;
  existUser: boolean  = false;
  listTypeAcreditation: TypeAccreditation[];
  listJobArea: TypeCatalog[];
  user: any = null;

  uploadedFiles: Array<File> = [];
  formData: any;

  perfiles: any;
  documentos: any;
  documentosRep: any;

  prompt: any;
  promptRep: any;

  nombres: FormControl = new FormControl({ value: '', disabled: true });
  apPaterno: FormControl = new FormControl({ value: '', disabled: true });
  apMaterno: FormControl = new FormControl({ value: '', disabled: true });
  correo: FormControl = new FormControl('', [Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]);
  documentTypeSelected: string = '';
  isCE: boolean = false;
  lblNombre: string = 'Nombres';
  lblApPat: string = 'Apellido paterno';
  lblApMat: string = 'Apellido materno';

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
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
      const response = await this.userService.getUser(casilla).toPromise();
      if (response.success) this.buildEditForm(response.data, casilla);
    }
  };
  private buildEditForm = (data, id) => {
    this.user = data;
    this.user.id = id;
    this.existUser = true;
    this.form.patchValue({
      tipoDocumento: data.doc_type,
      documento: data.doc,
      nombres: data.name,
      apPaterno: data.lastname,
      apMaterno: data.second_lastname,
      correo: data.email,
      //acreditacion: data.accreditation,
      jobArea: data.job_area,
      celular: data.cellphone,
      telefono: data.phone,
      perfil: data.profile,
      //direccion: data.address,
      //organizacion: data.organization_name,
    });

    if(data.doc_type === "ce") {
      this.nombres.enable();
      this.apMaterno.enable();
      this.apPaterno.enable();
      this.changeLabelRequired(true);
      this.eChangeType(true);
    } else if(data.doc_type === "dni") {
      this.nombres.disable();
      this.apMaterno.disable();
      this.apPaterno.disable();
      this.changeLabelRequired(false);
      this.eChangeType(false);
    }
  };

  //--------------------------BUILD
  private buildForm = () => {
    let r1 = Validators.required;
    let r2 = this.validRep;
    let r3 = Validators.pattern('^(?=.*).{7,}$');
    this.form = this.fb.group({
      tipoDocumento: new FormControl('', [r1]),
      documento: new FormControl('', [r1]),
      //tipoDocumentoRep: new FormControl('', [r1]),
      //documentoRep: new FormControl('', [r1]),
      nombres: this.nombres,
      apPaterno: this.apPaterno,
      apMaterno: this.apMaterno,
      correo: this.correo,
      telefono: new FormControl('', [r2, r3]),
      celular: new FormControl('', [r1, r2]),
      perfil: new FormControl('', [r1]),
      //direccion: new FormControl('', [r1]),
      jobArea: new FormControl('', [r1]),
      //razonSocial: new FormControl('', [r1]),
      //organizacion: new FormControl('', [r1]),
      //files: this.filesControl,
    });
    this.getNumeroDocumento();
  };
  private buildFormData = () => {
    this.formData = new FormData();
    this.documentos = listDoc;
    this.perfiles = listProfile;
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
    this.form.get('documento').setValue('');
    this.nombres.setValue('');
    this.apPaterno.setValue('');
    this.apMaterno.setValue('');
    if (level == 1) return;
    this.correo.setValue('');
    this.form.get('celular').setValue('');
    this.form.get('telefono').setValue('');
    //this.form.get('direccion').setValue('');
    //this.form.get('acreditacion').setValue(null);
    //this.form.get('documentoRep').setValue('');
    if (level == 2) return;
    //this.form.get('razonSocial').setValue('');
    //this.form.get('tipoDocumentoRep').setValue(null);
    //this.form.get('organizacion').setValue('');
    //this.form.get('files').setValue(null);
    //this.uploadedFiles = [];
    if (level == 3) return;
    if (level == 4) return;
  };
  private buildError = (message: string) => {
    this.funcionesService.mensajeError(message);
  };
  private buildInfo = (message: string) => {
    this.funcionesService.mensajeInfo(message);
  }
  private buildValidate = (status) => {
    var required = status ? [Validators.required] : null;
    //const a1 = this.form.get('tipoDocumentoRep');
    const a2 = this.form.get('documento');
    //const a3 = this.form.get('razonSocial');
    //a1.setErrors(null);
    a2.setErrors(null);
    //a3.setErrors(null);
    //a1.setValidators(required);
    //a2.setValidators(required);
    //a3.setValidators(required);
    //a1.reset();
    //a2.reset();
    //a3.reset();
  };
  private buildAcreditacion() {
    this.userService.GetTypeAcreditation().subscribe(
      (res) => {
        if (res.success) {
          this.listTypeAcreditation = res.data.acreditationTypes;
          this.listJobArea = res.data.jobAreaTypes;
        }
      },
      (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }
  //--------------------------EVENTS HTML
  eChangeDocumento(event) {
    this.buildResetForm(1);
    this.documentTypeSelected = event.value;
    this.isCE = this.documentTypeSelected === 'ce';
    if (this.documentTypeSelected === 'dni') {
      this.prompt.min = 8;
      this.prompt.max = 8;
      this.changeLabelRequired(false);
      this.eChangeType(false);
    } else if (this.documentTypeSelected === 'ce') {
      this.prompt.min = 9;
      this.prompt.max = 12;
      this.changeLabelRequired(true);
      this.eChangeType(true);
    }
  }

  changeLabelRequired(required: boolean) {
    if(required) {
      this.lblNombre = "Nombres*";
      //this.lblApPat = "Apellido paterno*";
      //this.lblApMat = "Apellido materno*";
    } else {
      this.lblNombre = "Nombres";
      //this.lblApPat = "Apellido paterno";
      //this.lblApMat = "Apellido materno";
    }
  }

  private eChangeType = (status) => {
    let required = status ? [
          Validators.required,
          Validators.pattern(
            "^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$"
          ),
        ] : null;
    let required2 = status ? [
          Validators.pattern(
            "^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$"
          ),
        ] : null;

    this.nombres.setErrors(null);
    this.apPaterno.setErrors(null);
    this.apMaterno.setErrors(null);

    this.nombres.setValidators(required);
    this.apPaterno.setValidators(required2);
    this.apMaterno.setValidators(required2);

    if(status){
      this.nombres.enable();
      this.apMaterno.enable();
      this.apPaterno.enable();
    }

    this.nombres.updateValueAndValidity();
    this.apPaterno.updateValueAndValidity();
    this.apMaterno.updateValueAndValidity();

    this.existData = !status;
  }

  eChangeDocumentoRep(event) {
    this.buildResetForm(2);
    if (event.value === 'dni') {
      this.promptRep.min = 8;
      this.promptRep.max = 8;
    } else if (event.value === 'ce') {
      this.promptRep.min = 9;
      this.promptRep.max = 12;
    }
  }
  eChangeLabel = (name: string) => {
    const esRuc = this.form.get('documento').value == 'ruc';
    switch (name) {
      case 'documento':
        if (esRuc) return 'Número de RUC*';
        return 'Número de documento*';
    }
  };
  eChangeHolder = (name: string) => {
    const esRuc = this.form.get('tipoDocumento').value == 'ruc';
    switch (name) {
      case 'documento':
        if (esRuc) return 'Ingrese el número de RUC';
        return 'Ingrese el número de documento';
    }
  };
  eChangekeydown(event, type) {
    if (this.existUser) return;
    if (event.keyCode == 9) return;
    if (event.keyCode > 31 && (event.keyCode < 48 || event.keyCode > 57)) return;
    if (type == 'documento_rep') {
      this.buildResetForm(1);
    }
    if (type == 'documento') {
      this.buildResetForm(3);
    }
  }
  eSearch = async (type: string) => {
    if (this.existUser) return;
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
  eShowError = (input, error = null) => {
    if (error.required != undefined) {
      return 'Campo requerido';
    } else if (error.pattern != undefined) {
      return 'Formato no válido';
    } else if (error.minlength != undefined) {
      return `Ingrese minimo ${error.minlength.requiredLength} caracteres`;
    } else {
      return 'Campo inválido';
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
    if (!this.form.valid) return;
    this.load = true;
    let request, promise;
    if(this.apPaterno.value == '' && this.apMaterno.value == '') {
      this.load = false;
      let message: string = `Debe ingresar al menos un apellido`;
      this.funcionesService.mensajeError(message);
      return;
    }
    if (!this.user) {
      request = {
        doc: this.form.controls['documento'].value,
        docType: this.form.controls['tipoDocumento'].value,
        email: this.correo.value,
        name: this.nombres.value,
        lastname: this.apPaterno.value,
        second_lastname: this.apMaterno.value,
        profile: this.form.controls['perfil'].value,
        phone: this.form.controls['telefono'].value,
        cellphone: this.form.controls['celular'].value,
        job_area: this.form.controls['jobArea'].value,
      };
      promise = this.userService.crearteUser(request);
    } else {
      request = {
        id: this.user.id,
        doc: this.user.doc,
        email: this.correo.value,
        name: this.nombres.value,
        lastname: this.apPaterno.value,
        second_lastname: this.apMaterno.value,
        profile: this.form.controls['perfil'].value,
        phone: this.form.controls['telefono'].value,
        cellphone: this.form.controls['celular'].value,
        job_area: this.form.controls['jobArea'].value,
      };
      promise = this.userService.EditUser(request);
    }
    promise.subscribe(
      (res) => {
        this.load = false;
        if (res.success) {
          this.funcionesService.mensajeOk(
            'Los datos del usuario fueron registrados con éxito',
            '/main/admin/usuarios'
          );
        } else {
          this.funcionesService.mensajeError(res.error);
        }
      },
      (err) => {
        this.load = false;
        console.log('Problemas del servicio', err);
      }
    );
  };

  getNumeroDocumento() {
    this.form.get('documento').valueChanges.subscribe((documento) => {
      if(this.documentTypeSelected == 'dni') {
        if(documento.length == this.prompt.min){
          this.eSearch('general');
        }
        else {
          this.nombres.setValue('');
          this.apPaterno.setValue('');
          this.apMaterno.setValue('');
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

    var userExist = await this.consultaUsuario(doc, tipo);

    if(!userExist){
      this.buildError('El documento ingresado ya se encuentra registrado');
      this.load = false;
      return;
    }

    var response = null;
    var message = 'No se encontró los datos del documento.';
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
        response = await this.consultaReniec(doc);
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
      }
      else this.buildError(message);
    }
  };

  private consultaUsuario = (doc: string, type:string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaUsuario(doc, type).subscribe(
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
  private consultaReniec = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaReniec(doc).subscribe(
        (resp: any) => {
          if (resp.statusCode === 200) {
            /*if(resp.body.nombres == null && resp.body.appat == null && resp.body.apmat == null) resolve(false);
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
  //--------------------------VALIDS
  private validRep(control: FormControl) {
    if (control.value) {
      var re = new RegExp(/^(\d)\1{7,}$/);
      var matches = re.test(control.value);
      return !matches ? null : { invalidName: true };
    } else {
      return null;
    }
  }
  private validDocument = async (type: string) => {
    var isGeneral = type == 'general';
    if (this.form.controls['tipoDocumento'].invalid && isGeneral) {
      this.buildError('Debe seleccionar un tipo de documento');
      return false;
    }else if (this.form.controls['documento'].invalid && isGeneral) {
      this.buildError('Debe ingresar un número correcto');
      return false;
    }
    return true;
  };

  validar_campo(event, type): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  soloExpLetras(idInput: string, inputForm: FormControl, e: any) {
    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    let value : string = inputForm.value;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;
    inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
    return !!/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/.test(e.key);
  }

  quitarDobleEspacio(idInput: string, inputForm: FormControl, e: any) {
    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    let value : string = inputForm.value;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;
    inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
  }

  buscarCE() {
    if(this.isCE) this.eSearch('general');
  }
}
