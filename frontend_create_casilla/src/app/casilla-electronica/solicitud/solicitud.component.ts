import { DOCUMENT } from '@angular/common';
import {Component, EventEmitter, HostBinding, Inject, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { MatDialog } from '@angular/material/dialog';
import {  Router } from '@angular/router';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { Subscription } from 'rxjs';
import { Condicion_Persona_Juridica } from 'src/app/core/dto/documento';
import { requestGlobal, RequestRepresentante } from 'src/app/core/dto/request';
import { CasillaService } from 'src/app/core/services/casilla.service';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';

export const EndPontPersonaNatural = '/create-box';
export const EndPontPersonaJuridica = '/legal/inbox/create-box';


@Component({
  selector: 'app-solicitud',
  templateUrl: './solicitud.component.html',
  styleUrls: ['./solicitud.component.css']
})
export class SolicitudComponent implements OnInit {




  @Output() completedStep = new EventEmitter<any>()
  @Output() previousStep = new EventEmitter<any>()
  formGroup!: FormGroup;
  listFiles : File[] = [];
  imageSrc: string="";
  deshabilitado : boolean = false;
  observableRequestSubscription!: Subscription;
  requestSave: requestGlobal = new requestGlobal();
  requestRepresentante : RequestRepresentante = new RequestRepresentante();
  TOkenCaptcha: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private casillaService: CasillaService,
    public dialog: MatDialog,
    private router : Router,
    private reCaptchaV3Service: ReCaptchaV3Service,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.observableRequestSubscription = casillaService.casilla$.subscribe(
      (requestSave: requestGlobal) => {
        this.requestSave = requestSave;
        this.requestRepresentante = this.requestSave!.representante;
        // console.log("data enviar", this.requestSave)

        this.onFileChange(this.requestSave.file);
      }
    );
  }



  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required]
    });


  }

  continuar() {
    this.deshabilitado = true;
    //this.completedStep.emit(true)
    this.dialog.open(AlertDialogComponent, {
      disableClose: true,
      hasBackdrop: true,
      data: {cabecera : 'Notificación' ,messages: ['Recuerde, que te enviaremos el resultado de la evaluación de tu solicitud, deberá mantenerse al pendiente de su correo electrónico y celular.'],btnCancel : true}
      //data: {cabecera : 'Notificación' ,messages: ['Recuerde, que te enviaremos el resultado de la evaluación de tu solicitud, deberá mantenerse al pendiente de su correo electrónico.'],btnCancel : true}
    }).afterClosed().subscribe(result =>{
     if(result){
      this.enviar();
     }else{
      this.deshabilitado = false;
     }

    });

  }

  regresar() {
    this.previousStep.emit()
  }




async  enviar(){

    var validate = await this.executeAction('homeLogin');

   // if(!validate) return;
  var CreateBoxTipoPersona  ="";

    const fd = new FormData();

    if(this.requestSave.TipoPersona === Condicion_Persona_Juridica){
      fd.append('docType',this.requestSave.tipoDocumento)
      fd.append('doc',this.requestSave.numeroDocumento)
      fd.append('organizationName',this.requestSave.razonSocial)
      fd.append('numeroPartida',this.requestSave.numeroPartida)
      fd.append('asientoRegistral',this.requestSave.asientoRegistral)
      fd.append('email',this.requestSave.correoElectronico)
      fd.append('cellphone',this.requestSave.numeroCelular)
      fd.append('phone',this.requestSave.telefono)
      let Ubigeo = this.requestSave.departamento + " / " +this.requestSave.provincia + " / " + this.requestSave.distrito
      fd.append('ubigeo',Ubigeo)
      fd.append('address',this.requestSave.domicilioFisico)
      fd.append('webSite',this.requestSave.paginaWeb)
      fd.append('orgPol', this.requestSave.orgPol);
      fd.append('recaptcha', this.TOkenCaptcha)
      fd.append('rep',JSON.stringify(this.requestSave.representante))
      fd.append('tes',JSON.stringify(this.requestSave.tesorero))
      //fd.append('repre',JSON.stringify(this.requestSave.repre))

      if(this.requestSave.repre){
        fd.append('repre',JSON.stringify(this.requestSave.repre))
      }

      if(this.requestSave.presidente){
        fd.append('pres',JSON.stringify(this.requestSave.presidente))
      }

      if(this.requestSave.perfilOP){
        fd.append('OP',JSON.stringify(this.requestSave.perfilOP))
      }

      // var filesDoc = this.requestSave.fileDocument;
      // for (var i = 0; i < filesDoc.length; i++) {
      //   var str1 = encodeURIComponent(filesDoc[i].name);
      //   const tempFile = new File(
      //     [filesDoc[i]],
      //     str1,
      //     {
      //       type: filesDoc[i].type.toLowerCase(),
      //     });
      //     // console.log(tempFile);
      //   fd.append('fileDocument' + (i + 1), tempFile);
      // }

      var filePhoto = this.requestSave.file;
      var str1 = encodeURIComponent(filePhoto.name);
      const tempFilePhoto = new File(
        [filePhoto],
        str1,
        {
          type: filePhoto.type.toLowerCase(),
        });
      fd.append('filePhoto', tempFilePhoto);
      fd.append('personType','pj')

      var files = this.requestSave.fileDocumentPJ;
      for (var i = 0; i < files.length; i++) {
        var str1 = encodeURIComponent(files[i].name);
        const tempFileCiu = new File(
          [files[i]],
          str1,
          {
            type: files[i].type.toLowerCase(),
          });
          // console.log(tempFileCiu);
        fd.append('fileBox' + (i + 1), tempFileCiu);
      }

      //this.listFiles.push(this.requestSave.fileDocument);
      CreateBoxTipoPersona = EndPontPersonaJuridica;



    }else{
      fd.append('docType',this.requestSave.tipoDocumento)
      fd.append('doc',this.requestSave.numeroDocumento)
      fd.append('name',this.requestSave.nombres)
      fd.append('lastname',this.requestSave.apePaterno)
      fd.append('second_lastname',this.requestSave.apeMaterno)
      fd.append('email',this.requestSave.correoElectronico)
      fd.append('cellphone',this.requestSave.numeroCelular)
      fd.append('phone',this.requestSave.telefono)
      let Ubigeo = this.requestSave.departamento + " / " +this.requestSave.provincia + " / " + this.requestSave.distrito
      fd.append('ubigeo',Ubigeo)
      fd.append('address',this.requestSave.domicilioFisico)
      fd.append('recaptcha', this.TOkenCaptcha)
      fd.append('filePhoto',this.requestSave.file)
      fd.append('personType','pn')
      fd.append('statusCandidateElectoralProcess', this.requestSave.statusCandidateElectoralProcess)
      fd.append('electoralProcessId',this.requestSave.electoralProcess._id)
      fd.append('orgPol', this.requestSave.orgPol);
      CreateBoxTipoPersona = EndPontPersonaNatural;

    }

    this.casillaService.enviarDatos(fd,CreateBoxTipoPersona).subscribe(res =>{
      if(res.success){
        /*this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera : '' ,messages: ['Recuerde, que en los proximos días le responderemos el resultado de su solicitud, deberá mantenerse al pendiente de su correo electrónico.']}
        }).afterClosed().subscribe(result =>{
          this.document.location.href = 'https://casillaelectronica.onpe.gob.pe/#/login';
        });*/
        this.completedStep.emit();

      }else{
        this.dialog.open(AlertDialogComponent, {
          disableClose: true,
          hasBackdrop: true,
          data: {cabecera : '¡Advertencia!' ,messages: [res.message]}
        })

      }

      //this.deshabilitado = false;

    },error =>{
      this.dialog.open(AlertDialogComponent, {
        disableClose: true,
        hasBackdrop: true,
        data: {cabecera : '¡Advertencia!' ,messages: [error.error.message]}
      })
      this.deshabilitado = false;
    });

  }

  onFileChange(foto : File) {
    const reader = new FileReader();
    if(foto) {
      const file = foto;
      reader.readAsDataURL(file);

      reader.onload = () => {

        this.imageSrc = reader.result as string;
        // this.myForm.patchValue({
        //   fileSource: reader.result
        // });
      };
    }
  }


  downloadPDF = async (file:any) => {
    try {
      // console.log('archivoo', file);
      this.casillaService.downloadFile(file, file.name);
    } catch (error) {
    }
  };


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
           // console.log("Tocken solicitud: "+this.TOkenCaptcha);
           //this.formGroup.get("recaptchaReactive")?.setValue(this.TOkenCaptcha);
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




}
