import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';
import { Router } from '@angular/router';
import { SeguridadService } from 'src/app/services/seguridad.service';
import { recoverypass, UserLogin } from 'src/app/models/user/UserLogin';
import { ERROR_SERVER } from 'src/app/shared/constantes';
import { Subscription } from 'rxjs';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-recovery-password',
  templateUrl: './recovery-password.component.html',
  styleUrls: ['./recovery-password.component.scss'],
})
export class RecoveryPasswordComponent implements OnInit {
  usuario: UserLogin = new UserLogin();
  mensaje: string;
  RequerdCaptcha: boolean = true;
  sitekey = '';
  ModelRequestRecover: recoverypass = new recoverypass();
  Formulario: FormGroup;
  getMaxLengthNumeroDocumento: number = 8;
  getMin: number = 8;
  doctype: string = 'dni';
  placeHolder: string = 'Número de DNI';

  TOkenCaptcha: string = '';
  notView: boolean = false;
  notView2: boolean = false;
  validarTexto: boolean = true;
  load = false;
  bCargo : boolean = false;
  bPerJud : boolean = false;

  msgCorrect =
    'En caso te encuentres registrado en SISEN, te hemos enviado un correo con los pasos a seguir para recuperar tu contraseña. Por favor, verifica tu bandeja de entrada y correo de no deseados.';
  msgIncorrect = "";

  fm_usuario: FormControl = new FormControl(null);

  lstCondicion = [{codigo: 'n', nombre: 'Persona Natural'}, {codigo: 'j', nombre: 'Persona Jurídica'}];
  lstn = [{codigo: '1', nombre: 'DNI'},{codigo: '2', nombre: 'CE'}]
  lstj = [{codigo: '3', nombre: 'RUC'},{codigo: '4', nombre: 'Partida Registral'}]
  lstPersona = this.lstn;
  lstCargo: any = [
    { id: '2', value: 'Personero Legal Titular' },
    { id: '3', value: 'Tesorero' },
    { id: '4', value: 'Representante Legal OP' },
    { id: '5', value: 'Presidente' },
    { id: '6', value: 'Presidente del OEC' }
  ];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private securityService: SeguridadService,
    private reCaptchaV3Service: ReCaptchaV3Service
  ) {
    //this.mensaje = 'Ingrese su documento de identidad';
    this.sitekey = environment.KeycodeCaptcha;
  }

  ngOnInit(): void {
    this.Formulario = this.fb.group({
      fm_condicion : this.fb.control('n'),
      fm_option: this.fb.control('1'),
      fm_usuario: this.fm_usuario,
      recaptchaReactive: this.fb.control(''),
      fm_organizacion: [false],
      fm_cargo: this.fb.control('2'),
    });
    this.validarCampoTexto();
  }
  onSumit = async () => {
    var validate = await this.executeAction('homeLogin');
    if (!validate) return;

    //this.router.navigate(['main']);
    this.ModelRequestRecover.docType = this.doctype;
    this.ModelRequestRecover.doc = this.fm_usuario.value.toUpperCase();
    this.ModelRequestRecover.recaptcha = this.TOkenCaptcha;
    if (this.Formulario.controls['fm_organizacion'].value){
      this.ModelRequestRecover.cargo = this.Formulario.controls['fm_cargo'].value;
    }

    this.load = true;
    this.securityService
      .GetRecoveryPassword<any>(this.ModelRequestRecover)
      .subscribe(
        (data) => {
          this.load = false;
          if (data.success) {
            this.notView = true;
          } else {
            this.msgIncorrect = data.error.message;
            this.notView2 = true;
          }
          this.Formulario.get('fm_usuario').setValue('');
        },
        (error) => {
          this.mensaje = ERROR_SERVER;
          this.load = false;
          this.Formulario.get('fm_usuario').setValue('');
        }
      );
  };

  radioChange($event: MatRadioChange) {
    this.Formulario.get('fm_usuario').setValue('');

    const tipodoc = $event.value;
    this.notView = false;
    this.notView2 = false;
    if (tipodoc === '1') {
      this.doctype = 'dni';
      this.placeHolder = 'Número de DNI';
      this.getMaxLengthNumeroDocumento = 8;
      this.getMin = 8;
    } else if (tipodoc === '2') {
      this.doctype = 'ce';
      this.placeHolder = 'Número de CE';
      this.getMaxLengthNumeroDocumento = 9;
      this.getMin = 9;
    } else if (tipodoc === '3') {
      this.doctype = 'ruc';
      this.placeHolder = 'Número de RUC';
      this.getMaxLengthNumeroDocumento = 11;
      this.getMin = 11;
    } else if (tipodoc === '4') {
      this.doctype = 'pr';
      this.placeHolder = 'Número de PR';
      this.getMaxLengthNumeroDocumento = 50;
      this.getMin = 3;
    }
  }

  formInvalid(control: string) {
    return (
      this.Formulario.get(control).invalid &&
      (this.Formulario.get(control).dirty ||
        this.Formulario.get(control).touched)
    );
  }

  validar_campo(event): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    var posicion = event.target.selectionStart;
    if (this.Formulario.get('fm_option').value == '4') {
      return !!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]+$/.test(event.key);
    } else if(posicion == 0  && this.Formulario.get('fm_option').value == '3' ){
        if(charCode == 50 ){
          return true;
        }else{
          return false;
        }
    } else if(posicion == 1  && this.Formulario.get('fm_option').value == '3' ){
      if(charCode == 48 ){
        return true;
      }else{
        return false;
      }
    } else {
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
      }
    }
    return true;
  }




  resolved(captchaResponse: string) {
    this.TOkenCaptcha = captchaResponse;
  }

  validarCampoTexto() {
    this.fm_usuario.valueChanges.subscribe(documento => {
      this.validarTexto = documento != null ? documento.length < this.getMin : true;
      if(documento != null && documento.length > 0) {
        this.notView = false;
        this.notView2 = false;
        this.mensaje = null;
      }
    });
  }
  public recentToken = '';
  public recentError?: { error: any };
  private singleExecutionSubscription: Subscription;

  private executeAction = async (action: string) => {
    return new Promise((resolve) => {
      if (this.singleExecutionSubscription) {
        this.singleExecutionSubscription.unsubscribe();
      }
      this.singleExecutionSubscription = this.reCaptchaV3Service
        .execute(action)
        .subscribe(
          (token) => {
            this.recentToken = token;
            this.recentError = undefined;
            this.TOkenCaptcha = token;
            resolve(true);
          },
          (error) => {
            this.recentToken = '';
            this.TOkenCaptcha = '';
            this.recentError = { error };
            resolve(false);
          }
        );
    });
  };

  eShowError = (input, error = null) => {
    if (error.required != undefined) {
      return 'Ingrese su documento de identidad';
    } else if (error.pattern != undefined) {
      return 'Formato no válido';
    } else if (error.minlength != undefined) {
      return 'Se requiere ' + error.minlength.requiredLength + ' caracteres como mínimo' ;
    } else {
      return 'Campo inválido';
    }
  };

  cambiarCondicion() {
    if( this.Formulario.get('fm_condicion')?.value === 'n') {
      this.lstPersona = this.lstn;
      this.Formulario.get('fm_option').setValue('1');
      this.Formulario.get('fm_usuario').setValue('');
      this.doctype = 'dni';
      this.placeHolder = 'Número de DNI';
      this.getMaxLengthNumeroDocumento = 8;
      this.getMin = 8;
      this.bPerJud = false;
      this.bCargo = false;
      this.Formulario.get('fm_organizacion')?.setValue(false);
      this.Formulario.get('fm_organizacion')?.updateValueAndValidity();
      this.Formulario.get('fm_cargo')?.clearValidators();
      this.Formulario.get('fm_cargo')?.updateValueAndValidity();
    } else {
      this.lstPersona = this.lstj;
      this.Formulario.get('fm_option').setValue('3');
      this.Formulario.get('fm_usuario').setValue('');
      this.doctype = 'ruc';
      this.placeHolder = 'Número de RUC';
      this.getMaxLengthNumeroDocumento = 11;
      this.getMin = 11;
      this.bPerJud = true;
      this.Formulario.get('fm_organizacion')?.setValue(false);
      this.Formulario.get('fm_organizacion')?.updateValueAndValidity();
    }

  }

  cargo(e: any){
    this.bCargo = e.checked;
    if(this.bCargo){
      this.Formulario.get('fm_cargo')?.setValidators(Validators.required);
      this.Formulario.get('fm_cargo')?.updateValueAndValidity();
    }else{
      this.Formulario.get('fm_cargo')?.clearValidators();
      this.Formulario.get('fm_cargo')?.setValue('');
      this.Formulario.get('fm_cargo')?.updateValueAndValidity();
    }
  }
}
