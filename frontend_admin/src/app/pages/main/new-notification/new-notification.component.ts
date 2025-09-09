import { FuncionesService } from '../../../utils/funciones.service';
import {
  Component,
  OnInit,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import {
  Procedure,
  TypeDocument,
  ModeloResponse,
} from '../../../models/notifications/notification';
import { SendNotification } from 'src/app/models/notifications/notification';
import { SendNotificationRequest } from 'src/app/models/notifications/notification-request';
import { NotificationService } from 'src/app/services/notification.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  FileUploadValidators,
} from '@iplab/ngx-file-upload';
import {  } from 'src/app/shared/constantes';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { MAX_TAM_FILES_10, LBL_ADD_FILES, LBL_ERROR_ONLY_FILE, LBL_ERROR_MAX_LENGTH_NAME, LBL_ERROR_MAX_SIZE_FILE,
  MAXFILES, MAX_LENGTH_NAME_FILES, MIN_TAM_FILES, ResultSignature, LBL_FEATURES_FILE, LBL_FEATURES_FILES, LBL_ERROR_MAX_FILES } from '../../../shared/constantes';

declare var initInvoker: any;
declare var dispatchEventClient: any;
@Component({
  selector: 'app-nueva-notificacion',
  templateUrl: './new-notification.component.html',
  styleUrls: ['./new-notification.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NewNotificationComponent implements OnInit {

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    private notificationService: NotificationService,
    private router: Router,
    private funcionesService: FuncionesService
  ) {
  }

  sendNotification: SendNotificationRequest = new SendNotificationRequest();
  notification: SendNotification = new SendNotification();
  Formulario: FormGroup;
  addressee: string = '';
  documentTypeSelected: string = '';
  maxlengthNumDoc: number;
  getMin: number;
  uploadedFilesValid: Array<File> = [];
  revision: Array<File> = [];
  sectionOne: boolean = true;
  sectionTree: boolean = false;
  buttonNext: boolean = true;
  buttonSend: boolean = false;
  listProcedure: Procedure[];
  procedureSelected: string = '';
  procedureSelectedValue: string;
  inputDisabled: boolean = true;
  loading: boolean = false;
  disabledVal: boolean = false;
  selectedStates: Procedure[];
  ext: string = "pdf jpg jpeg png bmp mp4 mov wmv avi avchd flv f4v swf mp3 zip rar 7z PDF JPG JPEG PNG BMP MP4 MOV WMV AVI AVCHD FLV F4V SWF MP3 ZIP RAR 7Z";

  patt = new RegExp(/^(?!\s)(?!.*\s$)(?!.*\s{2,})([a-zA-Z0-9-_. \/]+\s?)*$/);
  fm_n_expediente: FormControl = new FormControl('', [
    Validators.pattern(this.patt),
    Validators.maxLength(100)
  ]);
  fm_expediente: FormControl = new FormControl('', [
    Validators.required,
    Validators.pattern(this.patt),
    Validators.maxLength(100)
  ]);

  fm_message: FormControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(1000)
  ]);

  fm_numerodoc: FormControl = new FormControl('', [
    Validators.required,
    this.validRep,
  ]);

  fm_otros: FormControl = new FormControl('', [
    Validators.pattern('^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$'),
    Validators.maxLength(100)
  ]);

  placeHolder = 'Ingrese número de documento';

  parametro: string;

  multiple: boolean = false;
  animation: boolean = true;

  maxSizeFile_ = 1100 * 1024 * 1024;
  uploadedFiles: Array<File> = [];
  errmaxLengthName: boolean = false;
  errmaxSizeFile: boolean = false;
  errminSizeFile: boolean = false;
  errorOnlyFile: boolean = false;
  errmaxFiles: boolean = false;
  errduplicate: boolean = false;
  maxFiles: number = MAXFILES;
  maxSizeFile: number = MAX_TAM_FILES_10;
  minSizeFile: number = MIN_TAM_FILES;
  maxLengthName: number = MAX_LENGTH_NAME_FILES;
  lblAddFiles: string = LBL_ADD_FILES;
  lblFeaturesFile: string = LBL_FEATURES_FILE;
  lblFeaturesFiles: string = LBL_FEATURES_FILES;
  lblErrorOnlyFile: string = LBL_ERROR_ONLY_FILE;
  lblErrorMaxLengthName: string = LBL_ERROR_MAX_LENGTH_NAME;
  lblErrorMaxSizeFile: string = LBL_ERROR_MAX_SIZE_FILE;
  lblErrorMaxFiles: string = LBL_ERROR_MAX_FILES;

  err_max_files: boolean = false;
  err_format: boolean = false;
  err_size: boolean = false;
  err_size_name: boolean = false;
  err_duplicados: boolean = false;

  modeloResponse: ModeloResponse;

  filesControl = new FormControl(null, [
    Validators.required,
    FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp', '.mp4', '.mov', '.wmv', '.avi', '.avchd', '.flv', '.f4v', '.swf', '.mp3', '.zip', '.rar', '.7z']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({minSize: this.minSizeFile, maxSize: this.maxSizeFile_}),
    this.noWhitespaceValidator,
  ]);
  typeDocument: TypeDocument[] = [
    {id: '', value: 'Seleccione'},
    {id: 'dni', value: 'DNI'},
    {id: 'ce', value: 'Carnet de Extranjería'},
    {id: 'ruc', value: 'RUC'},
    {id: 'pr', value: 'Partida Registral'},
  ];

  private noWhitespaceValidator(control: FormControl) {
    if (control.value == null) return null;
    if (control.value.length == 0) return null;
    var str = control.value[0].name;
    var frags = str.split('.');
    var name = frags.splice(0, frags.length - 1).join('.');
    if (name.length > 100) {
      return {whitespace: true};
    }
    return null;
  }

  ngOnInit(): void {
    this.getProcedure();
    if (this.notificationService.openWindow.isStopped) this.notificationService.openWindow = new Subject<boolean>();
    if (this.notificationService.saveNotification.isStopped) this.notificationService.saveNotification = new Subject<boolean>();
    this.notificationService.saveNotification.subscribe(save => {
      if (save) {
        this.saveNotification();
      }
    });

    this.notificationService.openWindow.subscribe(open => {
      if (open) {
        dispatchEventClient('sendArguments', this.parametro);
      }
    });

    this.buildForm();
  }

  buildForm() {
    this.Formulario = this.fb.group({
      fm_n_expediente: this.fm_n_expediente,
      fm_optiontipo: this.fb.control('', [Validators.required]),
      fm_numerodoc: this.fm_numerodoc,
      fm_destinatario: this.fb.control('', [Validators.required]),
      fm_expediente: this.fm_expediente,
      fm_optionproc: this.fb.control('', [Validators.required]),
      input_fm_optionproc: this.fb.control(''),
      fm_message: this.fm_message,
      files: this.filesControl,
      fm_otros: this.fm_otros
    });

    this.Formulario.controls.fm_numerodoc.disable();
    this.Formulario.controls.fm_destinatario.disable();
    this.Formulario.controls.fm_n_expediente.disable();
    this.Formulario.controls.fm_expediente.disable();
    this.Formulario.controls.fm_optionproc.disable();
    this.Formulario.controls.fm_message.disable();
    // this.Formulario.controls.files.disable();
    this.Formulario.controls.fm_otros.disable();

    this.getNumeroDocumento();
  }

  getNumeroDocumento() {
    this.fm_numerodoc.valueChanges.subscribe((documento) => {
      this.Formulario.controls.fm_destinatario.setValue('');
    });
  }

  private validRep(control: FormControl) {
    if (control.value) {
      const re = new RegExp(/^(\d)\1{7,}$/);
      const matches = re.test(control.value);
      return !matches ? null : {invalidName: true};
    } else {
      return null;
    }
  }

  getProcedure() {
    this.notificationService.GetProcedure().subscribe(
      (res) => {
        if (res.success) {
          this.listProcedure = res.data.procedures;
          this.selectedStates = this.listProcedure;
        }
      },
      (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }

  onKey(value) {
    // console.log("ingreso a onKey");
    this.selectedStates = this.search(value);
  }

  // Filter the states list and send back to populate the selectedStates**
  search(value: string) {
    const filter = value.toLowerCase();
    return this.listProcedure.filter(option => option.value.toLowerCase().startsWith(filter));
  }

  baseName1 = (str) => {
    if (typeof str !== 'string') return;
    var frags = str.split('.');
    return frags.splice(0, frags.length - 1).join('.');
  };

  ConsultPerson() {
    this.Formulario.controls.fm_destinatario.setValue('');
    if (this.Formulario.controls.fm_optiontipo.value !== '' && this.Formulario.controls.fm_numerodoc.value !== '') {
      const personRequest: any = {
        docType: this.Formulario.controls.fm_optiontipo.value,
        doc: this.fm_numerodoc.value,
      };
      this.notificationService.ConsultPerson(personRequest).subscribe(
        (res) => {
          if (res.success) {
            if (res.pending_migration) {
              this.funcionesService.mensajeInfo('Esta casilla se encuentra pendiente de migración');
            }
            this.Formulario.controls.fm_destinatario.setValue(res.person);
            this.inputDisabled = this.Formulario.controls.fm_destinatario.value === '';
            if (!this.inputDisabled) {
              this.Formulario.controls.fm_expediente.enable();
              this.Formulario.controls.fm_n_expediente.enable();
              this.Formulario.controls.fm_optionproc.enable();
              this.Formulario.controls.fm_message.enable();
              this.Formulario.controls.files.enable();
              this.Formulario.controls.fm_otros.enable();
            }
          } else {
            this.Formulario.controls.fm_numerodoc.setValue('');
            this.funcionesService.mensajeError(
              res.error.message + ' ' + this.fm_numerodoc.value
            );
            this.inputDisabled = true;
            this.deshabilitarCampos();
          }
        },
        (err) => {
          console.log('Problemas del servicio', err);
        }
      );
    } else {
      this.funcionesService.mensajeError(
        'Ingresar número de documento'
      );
    }
  }

  changeTypeDocument() {
    this.fm_numerodoc.setValue('');
    this.Formulario.controls.fm_destinatario.setValue('');
    this.Formulario.get('fm_numerodoc').clearValidators();
    this.Formulario.updateValueAndValidity();
    if (this.Formulario.controls.fm_optiontipo.value === 'dni') {
      this.maxlengthNumDoc = 8;
      this.getMin = 8;
      this.Formulario.get('fm_numerodoc').setValidators([Validators.required, Validators.minLength(this.getMin)]);
      this.placeHolder = 'Ingrese número de DNI';
      this.Formulario.controls.fm_numerodoc.enable();
    } else if (this.Formulario.controls.fm_optiontipo.value === 'ce') {
      this.maxlengthNumDoc = 9;
      this.getMin = 9;
      this.Formulario.get('fm_numerodoc').setValidators([Validators.required, Validators.minLength(this.getMin)]);
      this.placeHolder = 'Ingrese número de CE';
      this.Formulario.controls.fm_numerodoc.enable();
    } else if (this.Formulario.controls.fm_optiontipo.value === 'ruc') {
      this.maxlengthNumDoc = 11;
      this.getMin = 11;
      this.Formulario.get('fm_numerodoc').setValidators([Validators.required, Validators.minLength(this.getMin)]);
      this.placeHolder = 'Ingrese número de RUC';
      this.Formulario.controls.fm_numerodoc.enable();
    } else if (this.Formulario.controls.fm_optiontipo.value === 'pr') {
      this.maxlengthNumDoc = 50;
      this.getMin = 3;
      this.Formulario.get('fm_numerodoc').setValidators([Validators.required, Validators.minLength(this.getMin)]);
      this.placeHolder = 'Ingrese número de partida registral';
      this.Formulario.controls.fm_numerodoc.enable();
    } else if (this.Formulario.controls.fm_optiontipo.value === '') {
      this.placeHolder = 'Ingrese número de documento';
      this.Formulario.controls.fm_numerodoc.disable();
      this.deshabilitarCampos();
    }
    this.Formulario.updateValueAndValidity;
  }

  changeProcedure(event) {
    this.procedureSelectedValue = event.source.triggerValue;
    this.selectedStates = this.listProcedure;
    this.Formulario.controls.input_fm_optionproc.setValue('');
  }

  validatorFile(name) {
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
        if (this.ext.indexOf(type) === -1) {
          delete (this.uploadedFilesValid[index]);
          this.err_format = true;
        }

        if (doc.size >= this.maxSizeFile_) {
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
      if (this.revision.length !== this.uploadedFilesValid.length) {
        this.err_duplicados = true;
      }

      if (this.revision.length > this.maxFiles) {
        this.err_max_files = true;
        this.revision.splice(this.maxFiles);
      }
    }

    let msj = '';
    if (this.err_max_files) {
      msj = msj.concat('<li>Has alcanzado el límite de archivos permitidos</li>');
    }
    if (this.err_format) {
      msj = msj.concat('<li>Contiene archivos con formato no válidos</li>');
    }
    if (this.err_size) {
      msj = msj.concat('<li>Contiene archivos con tamaño mayor a 1 GB</li>');
    }
    if (this.err_size_name) {
      msj = msj.concat('<li>Contiene archivos con nombre mayor de 100 caracteres</li>');
    }
    if (this.err_duplicados) {
      msj = msj.concat('<li>Contiene archivos duplicados</li>');
    }
    if (this.err_format || this.err_size || this.err_size_name || this.err_duplicados || this.err_max_files) {
      this.funcionesService.mensajeErrorHtml('Error en la subida de algunos documentos:<ul>' + msj + '</ul>');
    }
    this.Formulario.controls[name].setValue(this.revision);
  }

  NotificationSign() {
    this.disabledVal = true;
    const formDataNotification = new FormData();
    formDataNotification.append('docType', this.Formulario.controls.fm_optiontipo.value);
    formDataNotification.append('doc', this.fm_numerodoc.value);
    formDataNotification.append('name', this.Formulario.controls.fm_destinatario.value);
    formDataNotification.append('n_expedient', this.Formulario.controls.fm_n_expediente.value);
    formDataNotification.append('expedient', this.Formulario.controls.fm_expediente.value);
    formDataNotification.append('message', this.Formulario.controls.fm_message.value.trim());
    formDataNotification.append('procedure', this.Formulario.controls.fm_optionproc.value);

    for (let index = 0; index < this.uploadedFiles.length; index++) {
      //var str1 = this.uploadedFiles[index].name.replace(/.([^.]*)$/, '.pdf');
      const tempFile = new File(
        [this.uploadedFiles[index]],
        this.uploadedFiles[index].name, //str1.replace(/[^a-zA-Z0-9\\.\\-]/g, '-'),
        {
          type: this.uploadedFiles[index].type.toLowerCase(),
        }
      );
      formDataNotification.append('file' + (index + 1), tempFile);
    }
    this.notificationService.GetNotificationSign(formDataNotification).subscribe((res) => {
        this.loading = false;
        if (res.success) {
          this.parametro = res.param;
          if (this.parametro.length > 0) {
            //initInvoker(ResultSignature.TypeEvenReniec);
            this.saveNotification();
          } else {
            this.funcionesService.mensajeError(
              'No hay data para envío invoker'
            );
            this.disabledVal = false;
          }
        } else {
          this.funcionesService.mensajeError(res.error.message);
          this.disabledVal = false;
        }
      },
      (err) => {
        this.loading = false;
        console.log('Problemas del servicio', err);
        this.disabledVal = false;
      }
    );
  }

  saveNotification() {
    const formDataNotification = new FormData();
    formDataNotification.append('docType', this.Formulario.controls.fm_optiontipo.value);
    formDataNotification.append('doc', this.fm_numerodoc.value);
    formDataNotification.append('name', this.Formulario.controls.fm_destinatario.value);
    formDataNotification.append('expedient', this.Formulario.controls.fm_expediente.value);
    formDataNotification.append('n_expedient', this.Formulario.controls.fm_n_expediente.value);
    formDataNotification.append('message', this.Formulario.controls.fm_message.value.trim());
    formDataNotification.append('procedure', this.Formulario.controls.fm_optionproc.value);
    for (let index = 0; index < this.uploadedFiles.length; index++) {
      //var str1 = this.uploadedFiles[index].name.replace(/.([^.]*)$/, '.pdf');
      const tempFile = new File(
        [this.uploadedFiles[index]],
        this.uploadedFiles[index].name, //str1.replace(/[^a-zA-Z0-9\\.\\-]/g, '-'),
        {
          type: this.uploadedFiles[index].type.toLowerCase(),
        }
      );
      formDataNotification.append('file' + (index + 1), tempFile);
    }
    this.notificationService.SendNotification(formDataNotification).subscribe(
      (res) => {
        if (res.success) {
          this.clearData();
          this.funcionesService.mensajeOk(
            'Los datos de notificación fueron registrados con éxito',
            '/main/notificaciones',
            {textSearch: '', pageIndex: 1, pageSize: 5}
          );
        } else {
          this.funcionesService.mensajeError(res.error.message).then(r => {
            this.router.navigate(['/main']);
          });
        }
      },
      (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }

  baseName(str) {
    if (typeof str !== 'string') return;
    var frags = str.split('.');
    return frags.splice(0, frags.length - 1).join('.');
  }

  validations(): ModeloResponse {
    var sizeAll = 0;
    var maxfilesize = 1048576 * 10;
    for (let i = 0; i < this.uploadedFiles.length; i++) {
      let fileSizeMb = this.uploadedFiles[i].size;
      sizeAll += fileSizeMb;
    }
    if (sizeAll > maxfilesize) {
      this.modeloResponse.success = false;
      this.modeloResponse.message = 'Los archivos pesan más de 10Mb';
      return this.modeloResponse;
    }

    this.modeloResponse.success = true;
    this.modeloResponse.message = '';
    return this.modeloResponse;
  }

  clearData() {
    this.notification = new SendNotification();
    this.Formulario.controls.fm_destinatario.setValue('');
    this.uploadedFiles = undefined;
  }

  cancel() {
    if (this.buttonSend) {
      this.sectionOne = true;
      this.sectionTree = false;
      this.buttonNext = true;
      this.buttonSend = false;
    } else {
      this.router.navigate(['/main/notificaciones']);
    }
  }

  next() {
    const mensaje = 'La nomenclatura del documento ya ha sido notificada al administrado. ¿Está seguro de continuar con la emisión de la notitifación?';
    const docType = this.Formulario.controls.fm_optiontipo.value;
    const doc = this.fm_numerodoc.value;
    const expedient = this.Formulario.controls.fm_expediente.value;

    const actualizarEstadoSecciones = () => {
      this.sectionOne = false;
      this.sectionTree = true;
      this.buttonNext = false;
      this.buttonSend = true;
    };

    this.notificationService.getExistNotificationByExpedient(docType, doc, expedient).subscribe((res) => {
        if (res.success) {
          actualizarEstadoSecciones();
        } else {
          this.funcionesService.mensajeConfirmar(mensaje)
            .then(() => actualizarEstadoSecciones());
        }
      }, (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }

  validar_campo(event): boolean {
    if (this.Formulario.controls.fm_optiontipo.value !== 'pr') {
      const charCode = event.which ? event.which : event.keyCode;
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      }
      return true;
    }
    return true;
  }

  activar_campos() {
    if (this.Formulario.controls.fm_numerodoc.value.length > this.getMin - 2) {
      this.Formulario.controls.fm_expediente.enable();
      this.Formulario.controls.fm_optionproc.enable();
      this.Formulario.controls.fm_message.enable();
      this.Formulario.controls.files.enable();
    }
  }

  onKeydown(event) {
    if (event.keyCode === 13) {
      return false;
    }
  }

  eShowError = (input, error = null) => {
    if (error.required !== undefined) {
      return 'Campo requerido';
    } else if (error.pattern !== undefined) {
      return 'Formato inválido. Caracteres no permitidos: tildes, ñ ¨ ° ¬ ` | # $ % & = * [ ] ; { } \' @';
    } else if (error.fileSize !== undefined) {
      return 'Archivo(s) con peso excedido';
    } else if (error.minlength !== undefined) {
      return 'Se requiere ' + error.minlength.requiredLength + ' caracteres como mínimo';
    } else {
      return 'Campo inválido';
    }
  }

  soloExpReg(idInput: string, inputForm: FormControl, e: any) {

    const inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    const fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;

    const value: string = inputForm.value != null ? inputForm.value : '';
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if (inicio === 0 && e.key === ' ') {
      return false;
    }
    if (e.key === 'Enter') {
      return false;
    }

    inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
    if (idInput === 'expediente') {
      return !!this.patt.test(e.key);
    }
  }

  verificarSiVacio() {
    if (this.selectedStates.length === 0) {
      this.selectedStates = this.listProcedure;
      this.Formulario.controls.input_fm_optionproc.setValue('');
    }
  }

  ngOnDestroy(): void {
    this.notificationService.openWindow.unsubscribe();
    this.notificationService.saveNotification.unsubscribe();
  }

  deshabilitarCampos() {
    this.Formulario.controls.fm_expediente.disable();
    this.Formulario.controls.fm_n_expediente.disable();
    this.Formulario.controls.fm_optionproc.disable();
    this.Formulario.controls.fm_message.disable();
    this.Formulario.controls.files.disable();
    this.Formulario.controls.fm_otros.disable();
    this.Formulario.controls.fm_expediente.setValue('');
    this.Formulario.controls.fm_n_expediente.setValue('');
    this.Formulario.controls.fm_optionproc.setValue('');
    this.Formulario.controls.fm_message.setValue('');
    this.Formulario.controls.fm_otros.setValue('');
    this.uploadedFiles = [];
  }

  previewPDF(file: File, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const fileURL = URL.createObjectURL(file);

    window.open(fileURL, '_blank');

    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 10000);

  }

}
