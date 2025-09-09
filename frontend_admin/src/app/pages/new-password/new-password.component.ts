import { Component, OnInit } from '@angular/core';

import { UserLogin, userChangePass } from '../../models/UserLogin';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeguridadService } from 'src/app/services/seguridad.service';
import { FuncionesService } from 'src/app/utils/funciones.service';

@Component({
  selector: 'app-nueva-constrasena',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss'],
})
export class NewPasswordComponent implements OnInit {
  usuario: UserLogin = new UserLogin();
  mensaje: string;
  hideOldPass: boolean = true;
  hideNewPass: boolean = true;
  hideRepeatNewPass: boolean = true;
  Formulario: FormGroup;
  userchangepass: userChangePass = new userChangePass();
  hide = true;
  
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private securityService: SeguridadService,
    private funcionesService: FuncionesService
  ) {
    this.mensaje = '';
  }

  ngOnInit(): void {
    this.Formulario = this.fb.group({
      fm_oldpass: this.fb.control('', [Validators.required]),
      fm_newpass: this.fb.control('', [
        Validators.required,
        Validators.pattern(
          /^(?=(?:.*\d){1})(?=(?:.*[A-Z]){1})(?=(?:.*[a-z]){1})\S{8,}$/
        ),
      ]),
      fm_repeatnewpass: this.fb.control('', [
        Validators.required,
        Validators.pattern(
          /^(?=(?:.*\d){1})(?=(?:.*[A-Z]){1})(?=(?:.*[a-z]){1})\S{8,}$/
        ),
      ]),
    });
  }
  onSumit() {
    if (
      this.Formulario.controls['fm_newpass'].value !==
      this.Formulario.controls['fm_repeatnewpass'].value
    ) {
      return (this.mensaje = 'Contraseña repetida incorrecta');
    } else {
      this.changePass();
    }
  }

  changePass() {
    this.userchangepass.oldPassword = this.Formulario.controls[
      'fm_oldpass'
    ].value;
    this.userchangepass.newPassword = this.Formulario.controls[
      'fm_newpass'
    ].value;
    this.userchangepass.repeatNewPassword = this.Formulario.controls[
      'fm_repeatnewpass'
    ].value;

    this.securityService.changepassword<any>(this.userchangepass).subscribe(
      (data) => {
        if (data.success) {
          this.funcionesService.mensajeOk('Contraseña actualizada');
          this.securityService.cerrarSesion();
        } else {
          this.mensaje = data.error.message;
        }
      },
      (error) => {
        this.mensaje = 'Error de servicio, intente de nuevo o mas tarde.';
      }
    );
  }

  formInvalid(control: string) {
    return (
      this.Formulario.get(control).invalid &&
      (this.Formulario.get(control).dirty ||
        this.Formulario.get(control).touched)
    );
  }
}
