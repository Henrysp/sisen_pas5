import { Component, OnInit } from '@angular/core';
import { UserLogin } from '../../models/UserLogin';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeguridadService } from 'src/app/services/seguridad.service';
import { MatRadioChange } from '@angular/material/radio';
import { ERROR_SERVER, MAXINTENT } from 'src/app/shared/constantes';
import { Profile } from 'src/app/transversal/enums/global.enum';
import {
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaV3Module,
  ReCaptchaV3Service,
} from 'ng-recaptcha';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as CryptoJS from 'crypto-js';
import { VERSION_SISEN } from '../../shared/constantes';
import {TokenExpiration} from 'src/app/utils/token-expiration';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private securityService: SeguridadService,
    private seguridadService: SeguridadService,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private tokenExpiration: TokenExpiration,
  ) {
    this.sitekey = environment.KeycodeCaptcha;
  }

  version: string = VERSION_SISEN;
  sitekey = '';
  intent = 0;
  RequerdCaptcha = true;
  captchaView: boolean;
  mensaje = '';
  doctype = 'dni';
  getMaxLengthNumeroDocumento = 20;
  getMin = 3;
  placeHolder = 'Usuario';
  cont = true;
  TOkenCaptcha = '';
  Formulario: FormGroup;
  RequestUser: UserLogin = new UserLogin();
  load = false;
  public formModel: any = {};
  hide = true;
  typeProfile: string;
  profile = '';
  lstProfile: any = [
    { profile: 'admin', name: 'Administrador' },
    { profile: 'notifier', name: 'Notificador' },
    { profile: 'register', name: 'Operador de registro' },
    { profile: 'consult', name: 'Operador de consulta' },
  ];

  public recentToken = '';
  public recentError?: { error: any };
  private singleExecutionSubscription: Subscription;

  ngOnInit(): void {
    this.Formulario = this.fb.group({
      fm_profile : this.fb.control('', [Validators.required]),
      fm_option: this.fb.control('1'),
      fm_usuario: this.fb.control('', [Validators.required]),
      fm_pass: this.fb.control('', [Validators.required]),
      recaptchaReactive: this.fb.control(''),
    });
    if (this.securityService.isAuthenticatedTemp()) {
      sessionStorage.removeItem('accessTemp');
    }
    if (this.securityService.isAuthenticated) {
      this.setMenuOption();
    }
  }

  radioChange($event: MatRadioChange) {
    this.Formulario.get('fm_usuario').setValue('');
    this.Formulario.get('fm_pass').setValue('');
    const tipodoc = $event.value;

    if (tipodoc === '1') {
      this.doctype = 'dni';
      this.placeHolder = 'Número de DNI';
      this.getMaxLengthNumeroDocumento = 8;
      this.getMin = 8;
    } else if (tipodoc === '2') {
      this.doctype = 'ce';
      this.placeHolder = 'Número de Carnet de Extranjería';
      this.getMaxLengthNumeroDocumento = 9;
      this.getMin = 9;
    }
  }

  formInvalid(control: string) {
    return (
      this.Formulario.get(control).invalid &&
      (this.Formulario.get(control).dirty ||
        this.Formulario.get(control).touched)
    );
  }

  loginInit = async () => {
    this.load = true;
    const validate = await this.executeAction('homeLogin');
    if (validate) {
      this.mensaje = '';
      this.RequestUser.profile = CryptoJS.AES.encrypt(this.profile, environment.SECRET_KEY).toString();
      this.RequestUser.usuario = CryptoJS.AES.encrypt(this.Formulario.controls.fm_usuario.value, environment.SECRET_KEY).toString();
      this.RequestUser.password = CryptoJS.AES.encrypt(this.Formulario.controls.fm_pass.value, environment.SECRET_KEY).toString();
      this.RequestUser.recaptcha = this.TOkenCaptcha;

      this.securityService.GetLogin<any>(this.RequestUser).subscribe(
        (data) => {
          this.load = false;
          if (data.success) {
            sessionStorage.setItem('accessToken', data.token);
            const exp = this.seguridadService.getEXP();
            sessionStorage.setItem('token_expiration', (exp * 1000).toString());
            this.setMenuOption();
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
    }else{
      this.mensaje = 'Captcha inválido. Refresque e intente nuevamente';
      this.load = false;
    }
  }
  setMenuOption() {
    if (this.seguridadService.getUserProfile() !== '') {
      this.typeProfile = this.seguridadService.getUserProfile();
      switch (this.typeProfile) {
        case Profile.Administrador:
        case Profile.RegistryOperator:
        case Profile.QueryOperator:
          this.router.navigate(['/main/list-boxes']);
          break;
        case Profile.Notifier:
          this.router.navigate(['/main/notificaciones']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    }
  }
  forgetpass() {
    this.router.navigate(['/recuperar-contrasena']);
  }

  validar_campo(event){
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode === 91) {
      event.preventDefault();
    }
  }
  resolved(captchaResponse: string) {
    this.TOkenCaptcha = captchaResponse;
  }
  onloadGuia = async () => {
    const link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = 'assets/documentos/ReglamentoSISEN.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
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
  }
  eShowError = (input, error = null) => {
    if (error.required !== undefined) {
      return 'Campo requerido';
    } else if (error.pattern !== undefined) {
      return 'Formato no válido';
    } else if (error.minlength !== undefined) {
      return 'Se requiere '+ error.minlength.requiredLength + ' caracteres como mínimo' ;
    } else {
      return 'Campo inválido';
    }
  }
  profileChange($event: any) {
    this.Formulario.get('fm_usuario').setValue('');
    this.Formulario.get('fm_pass').setValue('');
    this.profile = this.Formulario.get('fm_profile')?.value;
  }
}
