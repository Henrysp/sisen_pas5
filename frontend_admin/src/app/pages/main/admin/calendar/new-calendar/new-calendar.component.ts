import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  AfterViewInit
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import { FileUploadValidators } from '@iplab/ngx-file-upload';
import { CalendarService } from 'src/app/services/calendar.service';
import { LBL_ADD_FILES, LBL_ERROR_MAX_FILES, LBL_ERROR_MAX_LENGTH_NAME, LBL_ERROR_MAX_SIZE_FILE, LBL_ERROR_ONLY_FILE, LBL_FEATURES_FILE, LBL_FEATURES_FILE_1_NOT_REQUIRED, MAXFILES, MAX_TAM_FILES_10, MIN_TAM_FILES } from 'src/app/shared/constantes';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-new-calendar',
  templateUrl: './new-calendar.component.html',
  styleUrls: ['./new-calendar.component.scss']
})
export class NewCalendarComponent implements OnInit, AfterViewInit  {

  constructor(
    private fb: FormBuilder,
    private funcionesService: FuncionesService,
    private calendarService: CalendarService,
    private usuarioService: UserService,
    private router: Router,
    private datePipe: DatePipe,
    private route: ActivatedRoute
  ) {
    this.loadUrlParam();
  }
  calendar: any;
  document: any = {};
  chkDate = false;
  inputDisabled = false;
  filesDisabled = false;
  centered = false;
  load = false;
  id = '';
  dateMin = '';
  dateMax = '';
  dateMin1 = '';
  dateMax1 = '';
  Formulario!: FormGroup;
  fm_nombres: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);
  fm_descripcion: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);
  fn_chkDate: FormControl = new FormControl();
  fm_txtfechaIni: FormControl = new FormControl({ value: '', disabled: this.inputDisabled }, [Validators.required]);
  fm_txtfechaFin: FormControl = new FormControl({ value: '', disabled: this.inputDisabled });
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
  lblFeaturesFile: string = LBL_FEATURES_FILE_1_NOT_REQUIRED;
  lblErrorOnlyFile: string = LBL_ERROR_ONLY_FILE;
  lblErrorMaxLengthName: string = LBL_ERROR_MAX_LENGTH_NAME;
  lblErrorMaxSizeFile: string = LBL_ERROR_MAX_SIZE_FILE;
  lblErrorMaxFiles: string = LBL_ERROR_MAX_FILES;

  maxFiles: number = MIN_TAM_FILES;
  maxSizeFile: number = MAX_TAM_FILES_10;
  minSizeFile: number = MIN_TAM_FILES;

  maxsize_ = 10485760;
  ext = 'pdf jpg jpeg png bmp PDF JPG JPEG PNG BMP';
  err_max_files = false;
  err_format = false;
  err_size = false;
  err_size_name = false;
  err_duplicados = false;


  msj_conf_new = '¿Está seguro de agregar al calendario?';
  msj_conf_edit = '¿Está seguro de editar el registro de calendario?';
  filesControl = new FormControl(null, [
    FileUploadValidators.accept(['.pdf', '.jpg', '.jpeg', '.png', '.bmp']),
    FileUploadValidators.filesLimit(this.maxFiles),
    FileUploadValidators.sizeRange({minSize: this.minSizeFile, maxSize: this.maxSizeFile}),
    this.noWhitespaceValidator,
  ]);


  protected readonly onclick = onclick;
  protected readonly onblur = onblur;
  ngOnInit() {
    this.buildForm();
    this.visibleInit();
    this.initDate();
    this.fm_txtfechaIni.valueChanges.subscribe(value => {
      if (!value) {
        this.initDate();
        this.Formulario.get('fm_txtfechaFin').setValue('');
      }
    });
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.Formulario.markAsPristine();
    }, 30);
  }
  private buildForm = () => {
    this.Formulario = this.fb.group({
      fm_nombres: this.fm_nombres,
      fm_descripcion: this.fm_descripcion,
      fn_chkDate: this.fn_chkDate,
      fm_txtfechaIni: this.fm_txtfechaIni,
      fm_txtfechaFin: this.fm_txtfechaFin,
      files: this.filesControl,
    });
  }
  initDate(){
    this.dateMin = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const dateFin = new Date();
    dateFin.setDate(dateFin.getDate() + 1);
    this.dateMin1 = this.datePipe.transform(dateFin, 'yyyy-MM-dd');
    this.dateMax = '';
    this.dateMax1 = '';
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

        if (doc.size >= this.maxsize_) {
          delete (this.uploadedFilesValid[index]);
          this.err_size = true;
        }

        if (doc.name.length > 104) {
          delete (this.uploadedFilesValid[index]);
          this.err_size_name = true;
        }
      }
      // console.log(this.uploadedFilesValid);

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


  private noWhitespaceValidator(control: FormControl) {
    if (control.value == null) { return null; }
    if (control.value.length == 0) { return null; }

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

  visibleInit(){
    if (this.chkDate){
      this.Formulario.get('fm_txtfechaFin').setValidators(Validators.required);
      this.Formulario.get('fm_txtfechaFin').setValue('');
      this.Formulario.get('fm_txtfechaIni').setValue('');
    } else{
      this.Formulario.get('fm_txtfechaFin').clearValidators();
    }
  }

  visibleDate(){
    if (!this.chkDate){
      this.chkDate = true;
      this.initDate();
      this.Formulario.get('fm_txtfechaFin').setValidators(Validators.required);
      this.Formulario.get('fm_txtfechaFin').setValue('');
      this.Formulario.get('fm_txtfechaIni').setValue('');
    } else{
      this.chkDate = false;
      this.initDate();
      this.Formulario.get('fm_txtfechaFin').clearValidators();
      this.Formulario.get('fm_txtfechaFin').setValue('');
      this.Formulario.get('fm_txtfechaIni').setValue('');
    }
  }

  private loadUrlParam = async () => {
    this.id = this.route.snapshot.queryParams.calendar;
    if (this.id !== undefined){
      this.calendar = await this.calendarService.getCalendarxId(this.id).toPromise();
      if (!this.calendar) {
        this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r => {
          this.router.navigate(['main/admin/calendar']);
        });
      }
      if (this.calendar.file_document[0] !== undefined){
        this.document = this.calendar.file_document[0];
      }
      this.Formulario.get('fm_nombres').setValue(this.calendar.title);
      this.Formulario.get('fm_descripcion').setValue(this.calendar.description);
      const dIni = this.calendar.date_begin.split('T');
      this.Formulario.get('fm_txtfechaIni').setValue(this.datePipe.transform(new Date(dIni[0] + 'T05:00:00.000Z'), 'yyyy-MM-dd'));

      if (this.calendar.range !== '0'){
        const dFin = new Date(this.calendar.date_end);
        this.Formulario.get('fm_txtfechaFin').setValidators(Validators.required);
        this.Formulario.get('fm_txtfechaFin').setValue(this.datePipe.transform(dFin, 'yyyy-MM-dd'));
        this.Formulario.get('fn_chkDate').setValue(this.calendar.range);
        this.chkDate = true;
        this.validMin();
        this.validMax();
      }
    }else{
      this.router.navigate(['main/admin/new-calendar']);
    }
    this.filesDisabled = (this.document.name === undefined);
  }

  alert(){
    let msj;
    if (this.id === undefined){
      msj = this.msj_conf_new;
    }else {
      msj = this.msj_conf_edit;
    }
    this.funcionesService
    .mensajeConfirmar(msj)
    .then((resp) => {
        this.submit();
    })
    .catch((err) => {});
  }

  submit = () => {
    const fd = new FormData();
    fd.append('title', this.Formulario.controls.fm_nombres.value.trim());
    fd.append('description', this.Formulario.controls.fm_descripcion.value.trim());
    fd.append('dateBegin', this.Formulario.controls.fm_txtfechaIni.value + 'T05:00:00-00:00');
    fd.append('range', this.Formulario.controls.fn_chkDate.value ? '1' : '0');
    if (this.Formulario.controls.fm_txtfechaFin.value !== ''){
      fd.append('dateEnd', this.Formulario.controls.fm_txtfechaFin.value + 'T23:59:59-00:00');
    } else {
      fd.append('dateEnd', this.Formulario.controls.fm_txtfechaIni.value + 'T23:59:59-00:00');
    }

    if (this.id === undefined){
      const files = this.Formulario.controls.files.value;
      if (files.length !== 0){
        const str1 = files[0].name;
        const tempFile = new File(
            [files[0]],
            str1,
            {
              type: files[0].type.toLowerCase(),
        });
        fd.append('file1', tempFile);
        fd.append('filesDisabled', '1');
      }else{
        fd.append('filesDisabled', '0');
      }
    } else if (this.filesDisabled){
      const files = this.Formulario.controls.files.value;
      if (files.length !== 0){
        const str1 = files[0].name;
        const tempFile = new File(
            [files[0]],
            str1,
            {
              type: files[0].type.toLowerCase(),
        });
        fd.append('file1', tempFile);
        fd.append('filesDisabled', '1');
      }else{
        fd.append('filesDisabled', '0');
      }
    } else {
      fd.append('filesDisabled', '0');
    }

    if (this.id === undefined){
      this.calendarService.save(fd).subscribe((res) => {
        this.router.navigate(['/main/admin/calendar']);
      },
      (err) => {
        console.log('Problemas del servicio', err);
      });
    } else {
      fd.append('id', this.id);
      this.calendarService.update(fd).subscribe((res) => {
        this.router.navigate(['/main/admin/calendar']);
      },
      (err) => {
        console.log('Problemas del servicio', err);
      });
    }
  }

  cancelar() {
    this.router.navigate(['/main/admin/calendar']);
  }

  limpiar(){
    this.Formulario.get('fm_nombres').setValue('');
    this.Formulario.get('fm_descripcion').setValue('');
    // this.Formulario.get('fn_chkDate').setValue('');
    this.Formulario.get('fm_txtfechaIni').setValue('');
    this.Formulario.get('fm_txtfechaFin').setValue('');
    this.Formulario.get('files').setValue([]);
    this.dateMin = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.dateMax = '';
    const dateFin = new Date();
    dateFin.setDate(dateFin.getDate() + 1);
    this.dateMin1 = this.datePipe.transform(dateFin, 'yyyy-MM-dd');
    this.dateMax1 = '';
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
    if (error.required !== undefined) {
      return 'Campo requerido';
    } else if (error.pattern !== undefined) {
      return 'Formato no válido';
    } else if (error.fileSize !== undefined) {
      return 'Archivo(s) con peso excedido';
    } else if (error.minlength !== undefined) {
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

  validMin(){
    const date = new Date(this.Formulario.controls.fm_txtfechaIni.value + 'T05:00:00.000Z');
    date.setDate(date.getDate() + 1);
    this.dateMin1 = this.datePipe.transform(date, 'yyyy-MM-dd');
    date.setDate(date.getDate() + 2);
    this.dateMax  = this.datePipe.transform(date, 'yyyy-MM-dd');
  }

  validMax(){
    const max = new Date(this.Formulario.controls.fm_txtfechaFin.value + 'T05:00:00.000Z');
    max.setDate(max.getDate() - 1);
    this.dateMax1 = this.datePipe.transform(max, 'yyyy-MM-dd');
    max.setDate(max.getDate() - 2);
    this.dateMin = this.datePipe.transform(max, 'yyyy-MM-dd');
  }

  keyoff(e){
    e.preventDefault();
  }
}
