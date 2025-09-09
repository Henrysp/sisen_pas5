import { Component, OnInit } from '@angular/core';
import { UserLogin } from '../../models/user/UserLogin';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeguridadService } from 'src/app/services/seguridad.service';
import { ERROR_SERVER, MAXINTENT, VERSION_SISEN } from 'src/app/shared/constantes';
import {
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaV3Module,
  ReCaptchaV3Service,
} from 'ng-recaptcha';
import { Subscription } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  version: string = VERSION_SISEN;
  sitekey = '';
  intent: number = 0;
  RequerdCaptcha: boolean = true;
  bCargo : boolean = false;
  bPerJud : boolean = false;
  mensaje: string = '';
  doctype = 'dni';
  getMaxLengthNumeroDocumento: number = 8;
  getMin: number = 8;
  TOkenCaptcha: string = '';
  placeHolder: string = 'Número de DNI';

  Formulario: FormGroup;
  RequestUser: UserLogin = new UserLogin();
  load: boolean = false;
  public formModel: any = {};
  hide = true;
  tipoDocGlobal: number = 1;

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
    private fb: FormBuilder,
    private securityService: SeguridadService,
    private router: Router,
    private reCaptchaV3Service: ReCaptchaV3Service
  ) {
    this.sitekey = environment.KeycodeCaptcha;
  }

  ngOnInit(): void {
    this.Formulario = this.fb.group({
      fm_condicion : this.fb.control('n'),
      fm_option: this.fb.control('1'),
      fm_organizacion: [false],
      fm_cargo: this.fb.control('2'),
      // fm_usuario: ['', [Validators.pattern('^[A-Za-z0-9ñÑáéíóúÁÉÍÓÚ ]+$')]],
      fm_usuario: ['', [Validators.pattern('^[0-9a-zA-Z][0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð,.\'\" °\\-:/;()]{1,254}$')]],
      fm_pass: this.fb.control('', [Validators.required])
    });
    if (this.securityService.isAuthenticatedTemp()) {
      //sessionStorage.removeItem('accessTemp');
      localStorage.removeItem('accessTemp');
    }
    if (this.securityService.isAuthenticated()) {
      this.setMenuOption();
    }
    this.Formulario.get('fm_condicion').setValue('n')
    this.Formulario.get('fm_option').setValue('1')
  }

  radioChange($event: any) {
    // console.log("value "+$event.value);
    this.Formulario.get('fm_usuario').setValue('');
    this.Formulario.get('fm_pass').setValue('');
    const tipodoc = this.Formulario.get('fm_option')?.value
    this.tipoDocGlobal = tipodoc;

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

  cargo(e: any){
    this.bCargo = e.checked;
    if(this.bCargo){
      this.Formulario.get('fm_cargo')?.setValidators(Validators.required);
      this.Formulario.get('fm_cargo')?.updateValueAndValidity();
    }else{
      this.Formulario.get('fm_cargo')?.clearValidators();
      this.Formulario.get('fm_cargo')?.updateValueAndValidity();
    }
  }

  loginInit = async () => {
    this.load = true;
    var validate = await this.executeAction('homeLogin');
    this.RequestUser = new UserLogin();
    if (validate) {
      this.mensaje = '';
      this.RequestUser.docType = CryptoJS.AES.encrypt(this.doctype, environment.SECRET_KEY_CITIZEN).toString();
      this.RequestUser.doc = CryptoJS.AES.encrypt(this.Formulario.controls['fm_usuario'].value.toUpperCase(), environment.SECRET_KEY_CITIZEN).toString();
      this.RequestUser.password = CryptoJS.AES.encrypt(this.Formulario.controls['fm_pass'].value, environment.SECRET_KEY_CITIZEN).toString();
      this.RequestUser.recaptcha = this.TOkenCaptcha;
      if(this.Formulario.controls['fm_organizacion'].value){
        this.RequestUser.cargo = this.Formulario.controls['fm_cargo'].value;
      }

      this.securityService.GetLogin<any>(this.RequestUser).subscribe(
        (data) => {
          this.load = false;
          if (data.success) {
            if (data.updated_password) {
              localStorage.setItem('accessToken', data.token);
              const exp = this.securityService.getEXP();
              localStorage.setItem('token_expiration', (exp * 1000).toString());
              this.setMenuOption();
            } else {
              localStorage.setItem('accessTemp', data.token);
              this.router.navigate(['/nueva-contrasena']);
            }
          } else {
            this.formModel.captcha = '';
            this.intent++;
            if (this.intent >= MAXINTENT) {
              this.RequerdCaptcha = true;
            }
            this.mensaje = data.error.message;
          }
        },
        (error) => {
          this.load = false;
          this.mensaje = ERROR_SERVER;
        }
      );
    }
  };

  setMenuOption() {
    if (localStorage.getItem("id") !== null) {
      var id = localStorage.getItem("id");
      this.router.navigate(['/main/notificaciones-electronicas-detalle/'+ id]);
    } else {
      this.router.navigate(['/','main']);
    }
  }

  forgetpass() {
    this.router.navigate(['/recuperar-contrasena']);
  }

  validar_campo(event): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    const posicion = event.target.selectionStart;
    const fmOption = this.Formulario.get('fm_option').value;

    if (fmOption === '4') {
      return !!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]+$/
        .test(event.key);
    }

    if (fmOption === '3') {
      if (posicion === 0) {
        return charCode === 50;
      }

      if (posicion === 1) {
        return charCode === 48;
      }

      if (posicion === (this.getMaxLengthNumeroDocumento - 1)) {
        const numeroDocumento = this.Formulario.get('fm_usuario')?.value;
        if (!numeroDocumento.toString().startsWith('20')) {
          this.Formulario.get('fm_usuario')?.setValue('');
          return false;
        }
      }
    }
    return !(charCode > 31 && (charCode < 48 || charCode > 57));
  }
  resolved(captchaResponse: string) {
    this.TOkenCaptcha = captchaResponse;
  }

  onloadGuia = async () => {
    let link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = 'assets/documentos/Guia_para_solicitar_Casilla_Electronica_de_la_ONPE_2023.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  onloadReglamento = async () => {
    let link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = 'assets/documentos/ReglamentoSISEN.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
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
      return 'Campo requerido';
    } else if (error.pattern != undefined) {
      return 'Formato no válido';
    } else if (error.minlength != undefined) {
      return 'Se requiere '+error.minlength.requiredLength+ ' caracteres como mínimo' ;
    } else {
      return 'Campo inválido';
    }
  };

  cambiarCondicion() {
    this.Formulario.get('fm_usuario').setValue('');
    this.Formulario.get('fm_pass').setValue('');
    if( this.Formulario.get('fm_condicion')?.value === 'n') {
      this.lstPersona = this.lstn;
      this.Formulario.get('fm_option').setValue('1')
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
      this.Formulario.get('fm_option').setValue('3')
      this.doctype = 'ruc';
      this.placeHolder = 'Número de RUC';
      this.getMaxLengthNumeroDocumento = 11;
      this.getMin = 11;
      this.bPerJud = true;
      this.Formulario.get('fm_organizacion')?.setValue(false);
      this.Formulario.get('fm_organizacion')?.updateValueAndValidity();
    }
  }
}
