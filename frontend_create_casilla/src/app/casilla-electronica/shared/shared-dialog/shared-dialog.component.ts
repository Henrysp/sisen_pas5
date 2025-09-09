import {Component, Inject, OnInit, ElementRef, ViewChild, AfterViewInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ReCaptchaV3Service} from 'ng-recaptcha';
import {Subscription} from 'rxjs';
import {ValidarCorreoService} from 'src/app/core/services/validar-correo.service';
import {AlertDialogComponent} from '../../alert-dialog/alert-dialog.component';
import {ValidarCelularService} from "../../../core/services/validar-celular.service";

@Component({
  selector: 'app-shared-dialog',
  templateUrl: './shared-dialog.component.html',
  styleUrls: ['./shared-dialog.component.css']
})
export class SharedDialogComponent implements OnInit {
  @ViewChild('input1') input1 !: ElementRef;
  formGroup!: FormGroup;
  titleForm = "Validación de correo electrónico"
  info = "Ingresa a tu bandeja principal o bandeja de no deseados, ya que te hemos enviado un correo electrónico con un código de verificación, el cual debes ingresarlo aquí:"
  loading = false;
  typeSevice: string = "EMAIL";

  respuesta: boolean = false;
  blockbtnTimmer: boolean = false;
  idEnvio !: number;
  tipoDocumento !: string;
  numeroDocumento !: string;
  email !: string;
  interval: any;
  timeLeft: number = 120;
  timeLeftSeconds = this.timeLeft*1000;
  TOkenCaptcha: string = '';
  bloquearValidarCorreoPopUp: boolean = false;
  personType = "";
  celular !: string;

  constructor(@Inject(MAT_DIALOG_DATA) private data: any,
              private dialogRef: MatDialogRef<SharedDialogComponent>,
              private dialogRefmessage: MatDialogRef<AlertDialogComponent>,
              private correoService: ValidarCorreoService,
              private formBuilder: FormBuilder,
              public dialog: MatDialog,
              private reCaptchaV3Service: ReCaptchaV3Service,
              private smsService: ValidarCelularService
  ) {
    this.idEnvio = data.idEnvio;
    this.tipoDocumento = data.requestData.tipoDocumento;
    this.numeroDocumento = data.requestData.numeroDocumento
    this.email = data.email;
    this.personType = data.requestData.personType;
    this.titleForm = data.titleForm || this.titleForm;
    this.info = data.info || this.info;
    this.typeSevice = data.typeSevice || this.typeSevice;
    this.celular = data.celular || null;
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      codigo1: ['', [Validators.required, Validators.pattern('^[0-9a-zA-Z]+$')]],
      codigo2: ['', [Validators.required, Validators.pattern('^[0-9a-zA-Z]+$')]],
      codigo3: ['', [Validators.required, Validators.pattern('^[0-9a-zA-Z]+$')]],
      codigo4: ['', [Validators.required, Validators.pattern('^[0-9a-zA-Z]+$')]],
      codigo5: ['', [Validators.required, Validators.pattern('^[0-9a-zA-Z]+$')]],
      codigo6: ['', [Validators.required, Validators.pattern('^[0-9a-zA-Z]+$')]],
    })
    if (!this.blockbtnTimmer) {
      this.blockbtnTimmer = true;
      setTimeout(() => {
        this.blockbtnTimmer = false;
      }, this.timeLeftSeconds)
      this.startTimer();
    }
    // this.autoFocus();
  }

  // ngAfterViewInit(): void {
  //   this.input1.nativeElement.focus();
  // }

  validarsoloNumeros(event: any): boolean {

    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57 || charCode == 9)) {
      return false;
    }
    return true;

  }

  autoFocus() {
    this.input1.nativeElement.focus();
  }

  cancel(resp: boolean) {
    this.dialogRef.close(resp);
  }

  async valid() {
    this.loading = true;
    this.bloquearValidarCorreoPopUp = true;
    if (this.formGroup.valid) {
      var codigoEnvio = this.formGroup.get('codigo1')?.value + this.formGroup.get('codigo2')?.value + this.formGroup.get('codigo3')?.value + this.formGroup.get('codigo4')?.value + this.formGroup.get('codigo5')?.value + this.formGroup.get('codigo6')?.value
      var validate = await this.executeAction('homeLogin');
      let request = {
        tipoDocumento: this.tipoDocumento,
        numeroDocumento: this.numeroDocumento,
        idEnvio: this.idEnvio,
        codigo: codigoEnvio.toUpperCase(),
        correo: this.email || 'Empty',
        celular: this.celular || 'Empty',
        recaptcha: this.TOkenCaptcha,
        personType: this.personType
      }
      // if(this.personType != 'rep'){
      //   Object.assign(request, {personType :  this.personType})
      // }
      if (this.typeSevice === 'EMAIL') {
        this.correoService.validarCodigoVerificacion(request).subscribe(respuesta => {
          this.loading = false;
          if (respuesta.esValido) {
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera: 'Verificación', messages: ['Código validado correctamente']}
            }).afterClosed().subscribe(result => {
              this.respuesta = true;
              this.cancel(true);
            });
          } else {

            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera: 'Advertencia', messages: [respuesta.mensaje]}
            }).afterClosed().subscribe(result => {
              this.respuesta = false;
              //this.input1.nativeElement.focus();
              this.autoFocus();
              this.formGroup.get('codigo1')?.setValue("")
              this.formGroup.get('codigo2')?.setValue("")
              this.formGroup.get('codigo3')?.setValue("")
              this.formGroup.get('codigo4')?.setValue("")
              this.formGroup.get('codigo5')?.setValue("")
              this.formGroup.get('codigo6')?.setValue("")
            });

            this.bloquearValidarCorreoPopUp = false;
          }

        }, error => {
          this.loading = false;
          if (error.error.statusCode == 401) {
            const mensajeError = {cabecera: 'No autorizado', messages: [error.error.message]};
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: mensajeError
            }).afterClosed().subscribe(() => {
              window.location.reload();
            });
          }
        });
      } else {
        this.smsService.validarCodigoVerificacion(request).subscribe(respuesta => {
          this.loading = false;
          if (respuesta.esValido) {
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera: 'Verificación', messages: ['Código validado correctamente']}
            }).afterClosed().subscribe(result => {
              this.respuesta = true;
              this.cancel(true);
            });
          } else {

            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: {cabecera: 'Advertencia', messages: [respuesta.mensaje]}
            }).afterClosed().subscribe(result => {
              this.respuesta = false;
              //this.input1.nativeElement.focus();
              this.autoFocus();
              this.formGroup.get('codigo1')?.setValue("")
              this.formGroup.get('codigo2')?.setValue("")
              this.formGroup.get('codigo3')?.setValue("")
              this.formGroup.get('codigo4')?.setValue("")
              this.formGroup.get('codigo5')?.setValue("")
              this.formGroup.get('codigo6')?.setValue("")
            });

            this.bloquearValidarCorreoPopUp = false;
          }

        }, error => {
          this.loading = false;
          if (error.error.statusCode == 401) {
            const mensajeError = {cabecera: 'No autorizado', messages: [error.error.message]};
            this.dialog.open(AlertDialogComponent, {
              disableClose: true,
              hasBackdrop: true,
              data: mensajeError
            }).afterClosed().subscribe(() => {
              window.location.reload();
            });
          }
        });
      }
    } else {
      this.loading = false;
    }
  }

  async reenvio() {

    var validate = await this.executeAction('homeLogin');

    let request = {
      tipoDocumento: this.tipoDocumento,
      numeroDocumento: this.numeroDocumento,
      correoElectronico: this.email,
      numeroCelular: this.celular,
      recaptcha: this.TOkenCaptcha
    }

    if (this.typeSevice === 'EMAIL') {
      this.correoService.envioCorreoVerificacion(request).subscribe(res => {
        if (res) {
          this.idEnvio = res.idEnvio;
          if (!this.blockbtnTimmer) {
            this.blockbtnTimmer = true;
            setTimeout(() => {
              this.blockbtnTimmer = false;
            }, this.timeLeftSeconds)
            this.startTimer();
          }
        } else {
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            data: {cabecera : 'Advertencia' ,messages: ['Espere un momento e inténtelo nuevamente']}
          })
        }
      }, error =>{
        if(error.error.statusCode == 401){
          const mensajeError = {cabecera : 'No autorizado', messages: [error.error.message]};
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            data: mensajeError
          }).afterClosed().subscribe(() => {
            window.location.reload();
          });
        }
      });
    } else {
      this.smsService.envioSMSVerificacion(request).subscribe(res => {
        if (res) {
          this.idEnvio = res.idEnvio;
          if (!this.blockbtnTimmer) {
            this.blockbtnTimmer = true;
            setTimeout(() => {
              this.blockbtnTimmer = false;
            }, this.timeLeftSeconds)
            this.startTimer();
          }
        } else {
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            data: {cabecera : 'Advertencia' ,messages: ['Espere un momento e inténtelo nuevamente']}
          })
        }
      }, error =>{
        if(error.error.statusCode == 401){
          const mensajeError = {cabecera : 'No autorizado', messages: [error.error.message]};
          this.dialog.open(AlertDialogComponent, {
            disableClose: true,
            hasBackdrop: true,
            data: mensajeError
          }).afterClosed().subscribe(() => {
            window.location.reload();
          });
        }
      });
    }
  }

  startTimer() {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else if (this.timeLeft == 0) {
        clearInterval(this.interval)
        this.timeLeft = 120;
      }
    }, 1000)
  }
  getFormattedTimeLeft(): string {
    return `${'0'+ Math.floor(this.timeLeft / 60)}:${this.timeLeft % 60 < 10 ? '0' + (this.timeLeft % 60) : this.timeLeft % 60}`;
  }
  get primerDigito() {
    return this.formGroup.get('codigo1')?.value || null;
  }


  public recentToken = '';
  public recentError?: { error: any };
  private singleExecutionSubscription!: Subscription;
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
            // console.log("Tocken shared-dialog: " + this.TOkenCaptcha);
            this.formGroup.get("recaptchaReactive")?.setValue(this.TOkenCaptcha);
            resolve(true);
          },
          (error) => {
            this.recentToken = '';
            this.TOkenCaptcha = '';
            this.recentError = {error};
            resolve(false);
          }
        );
    });
  };

}
