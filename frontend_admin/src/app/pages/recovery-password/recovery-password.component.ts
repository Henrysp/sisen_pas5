import { Component, OnInit } from '@angular/core';
import { recoverypass, UserLogin } from '../../models/UserLogin';
import { Router } from '@angular/router';
import { MatRadioChange } from '@angular/material/radio';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SeguridadService } from 'src/app/services/seguridad.service';
import { Subscription } from 'rxjs';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { environment } from 'src/environments/environment';
import { ERROR_SERVER } from 'src/app/shared/constantes';
@Component({
  selector: 'app-recuperar-contrasena',
  templateUrl: './recovery-password.component.html',
  styleUrls: ['./recovery-password.component.scss'],
})
export class RecoveryPasswordComponent implements OnInit {
  usuario: UserLogin = new UserLogin();
  mensaje: string;

  TOkenCaptcha: string = '';
  RequerdCaptcha: boolean = true;
  sitekey = '';
  ModelRequestRecover: recoverypass = new recoverypass();
  Formulario: FormGroup;
  getMaxLengthNumeroDocumento: number = 8;
  getMin: number = 8;
  doctype: string = 'dni';
  placeHolder: string = 'Número de DNI';
  load = false;

  notView: boolean = false;
  notView2: boolean = false;
  validarTexto: boolean = true;
  msgCorrect =
    'En caso te encuentres registrado en SISEN, te hemos enviado un correo con los pasos a seguir para recuperar tu contraseña. Por favor, verifica tu bandeja de entrada y correo de no deseados.';
  msgIncorrect = "";

  fm_usuario: FormControl = new FormControl(null, [Validators.pattern('^[0-9]+$')]);

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private securityService: SeguridadService,
    private reCaptchaV3Service: ReCaptchaV3Service
  ) {
    this.sitekey = environment.KeycodeCaptcha;
  }

  ngOnInit(): void {
    this.Formulario = this.fb.group({
      fm_option: this.fb.control('1'),
      fm_usuario: this.fm_usuario,
      recaptchaReactive: this.fb.control(''),
    });
    this.validarCampoTexto();
  }
  onSumit = async () => {
    var validate = await this.executeAction('homeLogin');
    if (!validate) return;

    this.ModelRequestRecover.docType = this.doctype;
    this.ModelRequestRecover.doc = this.fm_usuario.value;
    this.ModelRequestRecover.recaptcha = this.TOkenCaptcha;
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
          this.fm_usuario.setValue(null);
        },
        (error) => {
          this.load = false;
          this.mensaje = ERROR_SERVER;
          this.fm_usuario.setValue(null);
        }
      );
  };

  radioChange($event: MatRadioChange) {
    this.fm_usuario.setValue(null);
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
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
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
            this.TOkenCaptcha = token;
            resolve(true);
          },
          (error) => {
            this.TOkenCaptcha = '';
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
      return 'Se requiere '+ error.minlength.requiredLength + ' caracteres como mínimo' ;
    } else {
      return 'Campo inválido';
    }
  };
}
