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
import {
  listDoc,
  listDocRep,
} from 'src/app/pages/main/admin/user/edit-org/store/casilla-org.model';
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
  selector: 'app-edit-org',
  templateUrl: './edit-org.component.html',
  styleUrls: ['./edit-org.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EditOrgComponent implements OnInit {
  @ViewChild('fileUpload', { static: false }) fileUpload: ElementRef;

  action: number;
  actionType = ActionType;
  form: FormGroup;
  load: boolean = false;
  existData = true;
  existUser = false;
  listTypeAcreditation: TypeAccreditation[];
  user: any = null;

  uploadedFiles: Array<File> = [];
  formData: any;

  perfiles: any;
  documentos: any;
  documentosRep: any;

  prompt: any;
  promptRep: any;

  r5: string = '[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}';
  org_correo: FormControl = new FormControl('', [Validators.required, Validators.pattern(this.r5)]);
  correo: FormControl = new FormControl('', [Validators.required, Validators.pattern(this.r5)]);
  org_direccion: FormControl = new FormControl('', [Validators.required, Validators.minLength(9)]);
  nombres: FormControl = new FormControl({ value: '', disabled: true });
  apPaterno: FormControl = new FormControl({ value: '', disabled: true });
  apMaterno: FormControl = new FormControl({ value: '', disabled: true });

  documentTypeSelected: string = '';
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
        this.loadUrlParam(data);
        break;
      case ActionType.INIT:
        this.buildAcreditacion();
        this.buildForm();
        this.buildFormData();
        break;
      case ActionType.SUBMIT:
        this.loadSubmit();
        break;
      case ActionType.CLOSE:
        this.router.navigate(['/main/list-boxes']);
        break;
    }
  };
  // ===================== BUILD ============================
  private buildEditForm = (data, id) => {
    this.user = data;
    this.user.id = id;
    this.existUser = true;
    this.form.patchValue({
      //org
      tipoDocumento: data.doc_type,
      documento: data.doc,
      razonSocial: data.organization_name,
      org_correo: data.inbox_email,
      org_direccion: data.inbox_address,

      // rep
      tipoDocumentoRep: data.rep_doc_type,
      documentoRep: data.rep_doc,
      nombres: data.name,
      apPaterno: data.lastname,
      apMaterno: data.second_lastname,
      correo: data.email,
      acreditacion: data.accreditation,
      celular: data.cellphone,
      telefono: data.phone,
      direccion: data.address,
    });

    if(data.rep_doc_type === "ce") {
      this.nombres.enable();
      this.apMaterno.enable();
      this.apPaterno.enable();
      this.changeLabelRequired(true);
      this.eChangeType(true);
    } else if(data.rep_doc_type === "dni") {
      this.nombres.disable();
      this.apMaterno.disable();
      this.apPaterno.disable();
      this.changeLabelRequired(false);
      this.eChangeType(false);
    }
  };
  private buildAcreditacion() {
    this.userService.GetTypeAcreditation().subscribe(
      (res) => {
        if (res.success) {this.listTypeAcreditation = res.data.acreditationTypes;}
      },
      (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }
  private buildForm = () => {
    let r1 = Validators.required;
    let r2 = this.validRep;
    let r3 = Validators.pattern('^(?=.*).{7,}$');
    this.form = this.fb.group({
      tipoDocumento: new FormControl('', [r1]),
      documento: new FormControl('', [r1]),
      razonSocial: new FormControl('', [r1]),
      org_correo: this.org_correo, //new FormControl('', [r1, r5]),
      org_direccion: this.org_direccion,

      tipoDocumentoRep: new FormControl('', [r1]),
      documentoRep: new FormControl('', [r1]),
      nombres: this.nombres,
      apPaterno: this.apPaterno,
      apMaterno: this.apMaterno,
      correo: this.correo,
      telefono: new FormControl('', [r2, r3]),
      celular: new FormControl('', [r1, r2]),
      direccion: new FormControl('', [r1]),
      acreditacion: new FormControl('', [r1]),
      //organizacion: new FormControl('', [r1]),
      //files: this.validFiles,
    });
  };
  private buildError = (message: string) => {
    this.funcionesService.mensajeError(message);
  };
  private buildFormData = () => {
    this.formData = new FormData();
    this.documentos = listDoc;
    this.documentosRep = listDocRep;
    this.prompt = { min: null, max: null };
    this.promptRep = { min: null, max: null };
  };
  private buildResetForm = (level: number) => {
    this.nombres.setValue('');
    this.apPaterno.setValue('');
    this.apMaterno.setValue('');
    this.correo.setValue('');
    this.form.get('celular').setValue('');
    this.form.get('telefono').setValue('');
    this.form.get('direccion').setValue('');
    this.form.get('acreditacion').setValue(null);
    if (level == 1) return;
    //this.form.get('documentoRep').setValue('');
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
  // ===================== LOAD =============================
  private loadUrlParam = async (route: ActivatedRouteSnapshot) => {
    let casilla = this.route.snapshot.queryParams.casilla;
    if (casilla != null) {
      const response = await this.userService.getUser(casilla).toPromise();
      if (response.success) this.buildEditForm(response.data, casilla);
    }
  };

  private loadSubmit = () => {
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
      // request = {
      //   doc: this.form.controls['documento'].value,
      //   docType: this.form.controls['tipoDocumento'].value,
      //   email: this.form.controls['correo'].value,
      //   name: this.form.controls['nombres'].value,
      //   lastname: this.form.controls['apPaterno'].value,
      //   second_lastname: this.form.controls['apMaterno'].value,
      //   profile: this.form.controls['perfil'].value,
      //   phone: this.form.controls['telefono'].value,
      //   cellphone: this.form.controls['celular'].value,
      // };
      // promise = this.userService.crearteUser(request);
    } else {
      request = {
        //usuario
        user_id: this.user.id,
        user_doc_type: this.user.doc_type,
        user_doc: this.user.doc,
        user_rep_doc_type: this.form.controls['tipoDocumentoRep'].value,
        user_rep_doc: this.form.controls['documentoRep'].value,
        user_name: this.nombres.value,
        user_lastname: this.apPaterno.value,
        user_second_lastname: this.apMaterno.value,
        user_email: this.correo.value,
        user_cellphone: this.form.controls['celular'].value,
        user_phone: this.form.controls['telefono'].value,
        user_address: this.form.controls['direccion'].value,
        user_acreditation_type: this.form.controls['acreditacion'].value,
        user_organization_name: this.form.controls['razonSocial'].value,
        //casilla
        box_doc_type: this.user.doc_type,
        box_doc: this.user.doc,
        box_organization_name: this.form.controls['razonSocial'].value,
        box_email: this.org_correo.value,
        box_address: this.org_direccion.value,
        box_acreditation_type: this.form.controls['acreditacion'].value,
      };
      promise = this.userService.EditUserCitizen(request);
    }
    promise.subscribe(
      (res) => {
        this.load = false;
        if (res.success) {
          this.funcionesService.mensajeOk(
            'Los datos del usuario fueron registrados con éxito',
            '/main/list-boxes'
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
  private validFiles = new FormControl(null, [
    Validators.required,
    FileUploadValidators.accept(['.pdf']),
    FileUploadValidators.filesLimit(5),
    FileUploadValidators.fileSize(1048576 * 10),
    this.validWhitespaceValidator,
  ]);
  private validWhitespaceValidator(control: FormControl) {
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
  //--------------------------EVENTS HTML
  eChangeDocumento(event) {
    this.buildResetForm(4);
    this.existData = true;
    if (event.value === 'dni') {
      this.prompt.min = 8;
      this.prompt.max = 8;
    } else if (event.value === 'ce') {
      this.prompt.min = 9;
      this.prompt.max = 12;
    } else if (event.value === 'ruc') {
      this.prompt.min = 11;
      this.prompt.max = 11;
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
  eShowError = (input, error = null) => {
    // console.log(error);
    if (error.required != undefined) {
      return 'Campo requerido';
    } else if (error.pattern != undefined) {
      return 'Formato no válido';
    } else if (error.minlength != undefined) {
      return `Ingrese mínimo ${error.minlength.requiredLength} caracteres`;
    } else {
      return 'Campo inválido';
    }
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
}
