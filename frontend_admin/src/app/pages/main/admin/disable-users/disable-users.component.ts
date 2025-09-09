import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FileUploadValidators } from '@iplab/ngx-file-upload';
import {
  LBL_ADD_FILES,
  LBL_ERROR_MAX_FILES,
  LBL_ERROR_MAX_LENGTH_NAME,
  LBL_ERROR_MAX_SIZE_FILE,
  LBL_ERROR_ONLY_FILE,
  LBL_FEATURES_FILE,
  LBL_FEATURES_FILE_1,
  MAXFILES,
  MAX_TAM_FILES_10,
  MIN_TAM_FILES,
  MAX_MB_FILES, MAX_LENGTH_NAME_FILES, LBL_FEATURES_FILE_DISABLE
} from 'src/app/shared/constantes';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-disable-users',
  styleUrls: ['./disable-users.component.scss'],
  templateUrl: './disable-users.component.html',
  encapsulation: ViewEncapsulation.None
})
export class DisableUsersComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private funcionesService: FuncionesService,
    private usuarioService: UserService,
  ) {
  }
  calendar: any;
  document: any = {};
  chkDate = false;
  inputDisabled = false;
  filesDisabled = true;
  centered = false;
  load = false;
  id = '';
  dateMin = '';
  dateMax = '';
  dateMin1 = '';
  dateMax1 = '';
  Formulario!: FormGroup;
  uploadedFilesValid: Array<File> = [];
  revision: Array<File> = [];

  uploadedFiles: Array<File> = [];

  errmaxLengthName = false;
  errmaxSizeFile = false;
  errminSizeFile = false;
  errorOnlyFile = false;
  errmaxFiles = false;
  errduplicate = false;

  lblAddFiles: string = LBL_ADD_FILES;
  lblFeaturesFile: string = LBL_FEATURES_FILE_DISABLE;
  lblErrorOnlyFile: string = LBL_ERROR_ONLY_FILE;
  lblErrorMaxLengthName: string = LBL_ERROR_MAX_LENGTH_NAME;
  lblErrorMaxSizeFile: string = LBL_ERROR_MAX_SIZE_FILE;
  lblErrorMaxFiles: string = LBL_ERROR_MAX_FILES;

  maxFiles: number = MIN_TAM_FILES;
  maxSizeFile: number = MAX_TAM_FILES_10;
  minSizeFile: number = MIN_TAM_FILES;

  maxsize_ = 10485760;
  ext = 'xlsx XLSX';
  err_max_files = false;
  err_format = false;
  err_size = false;
  err_size_name = false;
  err_duplicados = false;


  msj_conf_sub = '¿Está seguro de cargar este excel?';

  filesControl = new FormControl(null, [
    FileUploadValidators.accept(['.xlsx', '.XLSX']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({minSize: this.minSizeFile, maxSize: this.maxSizeFile}),
    this.noWhitespaceValidator,
  ]);

  ngOnInit() {
    this.buildForm();
  }

  private buildForm = () => {
    this.Formulario = this.fb.group({
      files: this.filesControl,
    });
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
      for (let index = 0; index < size; index++) {
        const doc = this.Formulario.controls[name].value[index];
        let type = doc.name.split('.');
        type = type[type.length - 1];
        if (this.ext.indexOf(type) === -1) {
          // delete (this.uploadedFilesValid[index]);
          this.uploadedFilesValid = [];
          this.err_format = true;
        }

        if (doc.size >= this.maxsize_) {
          // delete (this.uploadedFilesValid[index]);
          this.uploadedFilesValid = [];
          this.err_size = true;
        }

        if (doc.name.length > 104) {
          // delete (this.uploadedFilesValid[index]);
          this.uploadedFilesValid = [];
          this.err_size_name = true;
        }
      }
      // console.log(this.uploadedFilesValid);

      // this.Formulario.controls[name].setValue(this.uploadedFilesValid);
      // this.uploadedFilesValid = this.Formulario.controls[name].value;
      this.revision = this.uploadedFilesValid;
      // var hash = {};

      // this.revision = this.uploadedFilesValid.filter(o => hash[o.name] ? false : hash[o.name] = true);
      // if (this.revision.length !== this.uploadedFilesValid.length){
      //   this.err_duplicados = true;
      // }
      //
      // if (this.revision.length > this.maxFiles) {
      //   this.err_max_files = true;
      //   this.revision.splice(this.maxFiles);
      // }
    }

    let msj = '';
    if (this.err_max_files){
      msj = msj.concat('Has alcanzado el límite de archivos permitidos.<br>');
    }
    if (this.err_format){
      msj = msj.concat('Contiene archivo con formato inválido.<br>');
    }
    if (this.err_size){
      msj = msj.concat('Contiene archivo con tamaño mayor a 10 MB.<br>');
    }
    if (this.err_size_name){
      msj = msj.concat('Contiene archivo con nombre mayor a 100 caracteres.<br>');
    }
    if (this.err_duplicados){
      msj = msj.concat('Contiene archivos duplicados.<br>');
    }
    if (this.err_format || this.err_size || this.err_size_name || this.err_duplicados || this.err_max_files){
      this.funcionesService.mensajeErrorHtml('Error en la subida del documento:<ul>' + msj + '</ul>') ;
    }
    this.Formulario.controls[name].setValue(this.uploadedFilesValid);
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
  alert(){
    this.funcionesService.mensajeConfirmar(this.msj_conf_sub).then((resp) => {
        this.submit();
    }).catch((err) => {});
  }
  cancelar(){
    this.uploadedFiles = [];
  }

  submit = () => {
    const formData = new FormData();
    for (const file of this.uploadedFiles) {
      formData.append('file', file, file.name);
    }
    this.funcionesService.showloading('Procesando...');
    this.usuarioService.BulkDisableUsers(formData).subscribe(
      (res) => {
        if (res.success) {
          this.funcionesService.closeloading();
          const byteArray = new Uint8Array(res.file.data);
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ReporteDeshabilitación.xlsx';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.funcionesService.mensajeOk(res.message).then(r => this.uploadedFiles = []);
        } else {
          this.funcionesService.closeloading();
          this.funcionesService.mensajeError(res.message).then(r => this.uploadedFiles = []);
        }
      },
      (err) => {
        console.log(err);
        if (err && err.error) {
          this.funcionesService.closeloading();
          this.funcionesService.mensajeError(err.error);
        } else {
          this.funcionesService.closeloading();
          this.funcionesService.mensajeError('Ocurrió un error desconocido.');
        }
      }
    );

  }

  delete(){
    this.filesDisabled = true;
  }
  formInvalid(control: string) {
    return (
      this.Formulario.get(control).invalid &&
      (this.Formulario.get(control).dirty ||
        this.Formulario.get(control).touched)
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
      return 'Se requiere ' + error.minlength.requiredLength + ' caracteres como mínimo' ;
    } else {
      return 'Campo inválido';
    }
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
  keyoff(e){
    e.preventDefault();
  }

}
