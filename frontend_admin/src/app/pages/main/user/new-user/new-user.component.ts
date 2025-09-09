import {Component, Inject, OnInit, NgZone, ChangeDetectorRef} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {TypeDocument} from 'src/app/models/notifications/notification';
import {Profiles} from 'src/app/models/users/user';
import { UserService } from 'src/app/services/user.service';
import { Profile } from 'src/app/transversal/enums/global.enum';
import { FuncionesService } from 'src/app/utils/funciones.service';
import {PersonService} from '../../../../services/person.service';
import {isDate} from 'moment';
import {DateAdapter, MAT_DATE_LOCALE} from '@angular/material/core';

@Component({
  selector: 'app-new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss']
})
export class NewUserComponent implements OnInit {
  Formulario: FormGroup;
  inputDisabled = true;
  buttonDisabled = true;
  documentTypeSelected = '';
  minlengthNumDoc: number;
  maxlengthNumDoc: number;
  placeHolder = 'Ingrese número de documento';
  fm_UUOO_name: string;
  nombres: FormControl ;
  apPaterno: FormControl ;
  apMaterno: FormControl ;
  email: FormControl ;
  existData = true;
  minDatefi = new Date();
  hasValidProfile: boolean ;
  allDatesValid: boolean ;
  typeDocument: TypeDocument[] = [
    { id: 'dni', value: 'DNI' },
    { id: 'ce', value: 'Carnet de Extranjería' },
  ];
  profiles: Profiles[] = [
    { value: Profile.Administrador, name: 'Administrador', estado: false, fechaIni: '', fechaFin: '', indeterminate: false},
    { value: Profile.Notifier, name: 'Notificador', estado: false, fechaIni: '', fechaFin: '', indeterminate: false},
    { value: Profile.RegistryOperator, name: 'Operador de registro', estado: false, fechaIni: '', fechaFin: '', indeterminate: false },
    { value: Profile.QueryOperator, name: 'Operador de consulta', estado: false, fechaIni: '', fechaFin: '', indeterminate: false },
  ];
  lstUUOO = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<NewUserComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private funcionesService: FuncionesService,
    private personService: PersonService,
    private ngZone: NgZone,
    private adapter: DateAdapter<any>,
    private cd: ChangeDetectorRef,
    @Inject(MAT_DATE_LOCALE) private readonly locale: string,
  ) {
    this.locale = 'es';
    this.adapter.setLocale(this.locale);
  }
  ngOnInit(): void {
    this.initForm();
    this.nombres = this.Formulario.get('fm_nombres') as FormControl;
    this.apPaterno = this.Formulario.get('fm_apellidoPaterno') as FormControl;
    this.apMaterno = this.Formulario.get('fm_apellidoMaterno') as FormControl;
    this.minDatefi.setDate(this.minDatefi.getDate());
    if (this.data) {
      this.userService.getUU_OO().subscribe(resp => {
        this.lstUUOO = resp;
        this.setData();
      });
    } else {
      this.getUUOO();
    }
  }
  sortUUOOList(): void {
    this.lstUUOO.sort((a, b) => a.name.localeCompare(b.name));
  }
  eShowError = (input: string, error = null) => {
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
  formInvalid(control: any) {
    return (
      this.Formulario.get(control).invalid &&
      (this.Formulario.get(control).dirty ||
        this.Formulario.get(control).touched)
    );
  }
  initForm() {
    this.Formulario = this.fb.group({
      fm_optiontipo: this.fb.control({value: ''}, [Validators.required]),
      fm_numerodoc: this.fb.control({value: '', disabled: true}, [Validators.required, Validators.pattern('^[0-9]+$')]),
      fm_nombres: this.fb.control({value: '', disabled: true}, [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]),
      fm_apellidoPaterno: this.fb.control({value: '', disabled: true}, [Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]),
      fm_apellidoMaterno: this.fb.control({value: '', disabled: true}, [Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]),
      fm_correo: this.fb.control({value: '', disabled: true}, [Validators.required, Validators.pattern('[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}')]),
      fm_UUOO: this.fb.control({value: '', disabled: true}, [Validators.required]),
      startDate: this.fb.control({value: '', disabled: false}),
      finishDate: this.fb.control({value: '', disabled: false}),
      LDAP: this.fb.control({value: '', disabled: true}, [Validators.required]),
    }, { validators: this.apellidoRequerido.bind(this) });
    this.getNumeroDocumento();
  }
  apellidoRequerido(formGroup: FormGroup) {
    const grupos: [string, string][] = [
      ['fm_apellidoPaterno' , 'fm_apellidoMaterno'],
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
      }
      else if (this.documentTypeSelected === 'ce') {
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
  changeTypeDocument(event: any) {
    this.documentTypeSelected = event.value;
    this.inputDisabled = false;
    this.buttonDisabled = false;
    this.Formulario.get('fm_correo')?.enable();
    this.Formulario.get('fm_UUOO')?.enable();
    this.Formulario.get('LDAP')?.enable();
    if (this.documentTypeSelected === 'dni') {
      this.minlengthNumDoc = 8;
      this.maxlengthNumDoc = 8;
      this.placeHolder = 'Ingrese número de DNI';
      this.Formulario.get('fm_nombres')?.disable();
      this.Formulario.get('fm_nombres')?.setValue('');
      this.Formulario.get('fm_apellidoPaterno')?.disable();
      this.Formulario.get('fm_apellidoPaterno')?.setValue('');
      this.Formulario.get('fm_apellidoPaterno')?.setValidators([Validators.required]);
      this.Formulario.get('fm_apellidoMaterno')?.disable();
      this.Formulario.get('fm_apellidoMaterno')?.setValue('');
      this.Formulario.get('fm_apellidoMaterno')?.setValidators([Validators.required]);
    } else {
      this.minlengthNumDoc = 9;
      this.maxlengthNumDoc = 9;
      this.placeHolder = 'Ingrese número de CE';
      this.Formulario.get('fm_nombres')?.enable();
      this.Formulario.get('fm_nombres')?.setValue('');
      this.Formulario.get('fm_apellidoPaterno')?.enable();
      this.Formulario.get('fm_apellidoPaterno')?.setValue('');
      this.Formulario.get('fm_apellidoPaterno')?.setValidators([Validators.minLength(2), Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);
      this.Formulario.get('fm_apellidoMaterno')?.enable();
      this.Formulario.get('fm_apellidoMaterno')?.setValue('');
      this.Formulario.get('fm_apellidoMaterno')?.setValidators([Validators.minLength(2), Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);
    }
    this.Formulario.get('fm_numerodoc')?.enable();
    this.Formulario.get('fm_numerodoc')?.setValue('');
  }
  validar_campo(event): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
  submit = () => {
    if (this.apPaterno.value === '' && this.apMaterno.value === '') {
      const mensaje = 'Debe ingresar al menos un apellido.';
      this.funcionesService.mensajeError(mensaje);
      return;
    }
    if (!this.Formulario.valid) { return; }
    if (!this.isValidProfiles()) {
      if (!this.hasValidProfile) {
        this.funcionesService.mensajeError('Debe seleccionar al menos un perfil.');
      } else if (!this.allDatesValid) {
        this.funcionesService.mensajeError('Debe completar las fechas.');
      }
      return;
    }
    const formValue = this.Formulario.getRawValue();
    const request = {
      id: this.data?.id,
      docType: formValue.fm_optiontipo,
      doc: formValue.fm_numerodoc,
      email: formValue.fm_correo,
      lastname: formValue.fm_apellidoPaterno,
      second_lastname: formValue.fm_apellidoMaterno,
      name: formValue.fm_nombres,
      profiles: this.getSelectedProfiles(),
      LDAP: formValue.LDAP,
      UUOO: formValue.fm_UUOO,
      UUOO_name: this.fm_UUOO_name,
    };
    const message = this.data ? 'Los datos del usuario fueron actualizados con éxito' : 'Los datos del usuario fueron registrados con éxito';
    const promise = this.data
      ? this.userService.EditUser(request)
      : this.userService.crearteUser(request);
    promise.subscribe(
      (res) => {
        this.inputDisabled = false;
        if (res.success) {
          this.funcionesService.mensajeOk(
            message).then(() => {
            this.dialogRef.close(true);
          });
        } else {
          this.funcionesService.mensajeError(res.error);
        }
      },
      (err) => {
        this.inputDisabled = false;
        console.log('Problemas del servicio', err);
      }
    );
  }
  cancelar() {
    this.dialogRef.close(false);
  }
  toggleEstado(profileValue: string) {
    const profile = this.profiles.find(p => p.value === profileValue);
    if (profile) {
      profile.estado = !profile.estado;
      profile.fechaIni = '';
      profile.fechaFin = '';
      profile.indeterminate = false;
    }
    this.ngZone.run(() => {
      this.cd.detectChanges();
    });
  }
  onSelectionChange(selectedId: number) {
    const selectedItem = this.lstUUOO.find(item => item.id === selectedId);
    this.fm_UUOO_name = selectedItem ? selectedItem.name : '';
  }
  onValueChange(profileValue: string, selectedId: string, event: any) {
    const dateValue = (event.target as HTMLInputElement).value;
    const selectedProfile = this.profiles.find(p => p.value === profileValue);
    if (selectedProfile) {
      if (selectedId === 'startDatePicker') {
        selectedProfile.fechaIni = dateValue;
        selectedProfile.fechaFin = selectedProfile.indeterminate ? selectedProfile.fechaFin : '';
      } else if (selectedId === 'finishDatePicker') {
        selectedProfile.fechaFin = dateValue;
      }
    }
    this.ngZone.run(() => {
      this.cd.detectChanges();
    });
  }
  eSearch = async (type: string) => {
    switch (type) {
      case 'general':
        await this.eSearchDocument(type);
        break;
      case 'ldap':
        const usuario = this.Formulario.controls.LDAP.value;
        await this.consultaLDAP(usuario);
        break;
      default:
        break;
    }
  }
  setData(){
    this.inputDisabled = false;
    this.Formulario.get('fm_optiontipo').setValue(this.data.doc_type);
    this.Formulario.get('fm_optiontipo').disable();
    this.Formulario.get('fm_numerodoc').setValue(this.data.doc);
    this.Formulario.get('fm_nombres').setValue(this.data.name);
    this.Formulario.get('fm_apellidoPaterno').setValue(this.data.lastname);
    this.Formulario.get('fm_apellidoMaterno').setValue(this.data.second_lastname);
    this.Formulario.get('fm_correo').setValue(this.data.email);
    this.Formulario.get('fm_correo').enable();
    this.Formulario.get('fm_UUOO').setValue(this.data.job_area_code);
    this.Formulario.get('fm_UUOO').enable();
    this.onSelectionChange(this.data.job_area_code);
    this.Formulario.get('LDAP').setValue(this.data.LDAP);
    this.mapDataToProfiles();
  }
  toggleIndeterminate(profileValue: string) {
    const profile = this.profiles.find(p => p.value === profileValue);
    if (profile) {
      profile.indeterminate = !profile.indeterminate;
      (profile.indeterminate) ? profile.fechaFin = 'Indeterminado' : profile.fechaFin = '';
    }
    this.ngZone.run(() => {
      this.cd.detectChanges();
    });
  }
  getUUOO() {
    this.userService.getUU_OO().subscribe(resp => {
      this.lstUUOO = resp;
    });
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
  private getSelectedProfiles() {
    return this.profiles.reduce((acc, profile) => {
      acc[profile.value] = {
        estado: profile.estado,
        fechaIni: profile.fechaIni,
        fechaFin: profile.fechaFin
      };
      return acc;
    }, {} as { [key: string]: { estado: boolean, fechaIni: Date, fechaFin: Date | string } });
  }
  private mapDataToProfiles() {
    const profileMap = this.data.profiles;
    this.profiles = this.profiles.map(profile => {
      const profileData = profileMap[profile.value];
      if (profileData) {
        return {
          ...profile,
          estado: profileData.estado,
          fechaIni: profileData.estado ? new Date(profileData.fechaIni) : profile.fechaIni,
          fechaFin: profileData.estado && profileData.fechaFin === 'Indeterminado' ? 'Indeterminado'
            : profileData.fechaFin === null ? profile.fechaFin : new Date(profileData.fechaFin),
          indeterminate: profileData.estado && profileData.fechaFin === 'Indeterminado',
        };
      } else {
        return profile;
      }
    });
  }
  private isValidProfiles(): boolean {
    this.hasValidProfile = this.profiles.some(profile => profile.estado);
    this.allDatesValid = this.profiles
      .filter(profile => profile.estado)
      .every(profile => isDate(profile.fechaIni) && (isDate(profile.fechaFin) || profile.fechaFin === 'Indeterminado'));
    return this.hasValidProfile && this.allDatesValid;
  }
  private eSearchDocument = async (type: string) => {
    this.funcionesService.showloading('Procesando...', 'Buscar en sistema');
    let tipo = '';
    let doc = '';
    if (type === 'general') {
      tipo = this.Formulario.controls.fm_optiontipo.value;
      doc = this.Formulario.controls.fm_numerodoc.value;
      const userExist = await this.consultaUsuario(doc, tipo);
      if (!userExist) {
        this.funcionesService.closeloading();
        this.buildError('El documento ingresado ' + doc + ' ya se encuentra registrado');
        this.Formulario.get('fm_numerodoc').setValue('');
        return;
      }
    }
    if (doc !== ''){
      let response = null;
      let message = 'No se encontró los datos del documento.';
      switch (tipo) {
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
        default:
          break;
      }
      if (response) {
        this.existData = true;
        this.funcionesService.closeloading();
        if (!(this.nombres.value && (this.apPaterno.value || this.apMaterno.value))) {
          this.buildError(message);
          this.existData = false;
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
                this.Formulario.get('fm_numerodoc').setValue('');
              }
            }
          );
        } else {
          this.funcionesService.closeloading();
          this.buildError(message);
        }
      }
    }else {
      this.buildError('Ingrese un número de documento válido');
    }
  }
  private buildError = (message: string) => {
    this.funcionesService.mensajeError(message);
  }
  private buildInfo = (message: string) => {
    this.funcionesService.mensajeInfo(message);
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
  private consultaUsuario = (doc: string, type: string) => {
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
  private async consultaLDAP(usuario: string): Promise<boolean> {
    this.funcionesService.showloading('Procesando...', 'Buscando usuario');
    if (!usuario) {
      this.funcionesService.closeloading();
      this.buildError('Ingrese un usuario LDAP válido');
      return false;
    }
    try {
      const respLDAP = await this.userService.consultaLDAP(usuario).toPromise();

      if (!respLDAP.success) {
        this.Formulario.get('LDAP').setValue('');
        this.funcionesService.closeloading();
        this.buildError(respLDAP.message);
        return false;
      }

      const respMongo = await this.userService.consultaLDAPMongo(usuario).toPromise();

      if (respMongo.success) {
        this.funcionesService.closeloading();
        this.Formulario.get('LDAP').disable();
        this.buttonDisabled = true;
        return true;
      } else {
        this.funcionesService.closeloading();
        this.Formulario.get('LDAP').setValue('');
        this.buildError(respMongo.error);
        return false;
      }

    } catch (error) {
      this.Formulario.get('LDAP').setValue('');
      this.buildError('Error inesperado al consultar LDAP.');
      return false;
    }
  }
}
