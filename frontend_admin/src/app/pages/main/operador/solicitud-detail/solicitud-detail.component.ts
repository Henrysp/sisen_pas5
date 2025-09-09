import {Component, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from 'src/app/services/user.service';
import {FuncionesService} from 'src/app/utils/funciones.service';
import Swal from 'sweetalert2';
import {IResendEmailAndSms} from '../../../../models/users/user';

@Component({
  selector: 'app-solicitud-detail',
  templateUrl: './solicitud-detail.component.html',
  styleUrls: ['./solicitud-detail.component.scss'],
})
export class SolicitudDetailComponent implements OnInit {
  load = false;
  sinDatos = true;
  ofile_document:boolean = false;
  ofile_document1:boolean = false;
  ofile_document2:boolean = false;
  ofile_box1:boolean = false;
  ofile_box2:boolean = false;
  file_box1: any  = {};
  file_box2: any = {};
  info: any = {};
  displayedColumns: string[] = ['contact', 'updated_at', 'doc', 'updated_user', 'attachments'];

  id; type; action;
  motivo1_detalle = "DNI no corresponde al usuario";
  motivo2_detalle = "Documento de representante no corresponde al representante legal";
  motivo3_detalle = "Documento de representante no corresponde al personero legal (titular)";
  motivo4_detalle = "Documento adjunto ilegible o en blanco";
  motivo5_detalle = "Documento de representación mayor a 90 días calendarios";
  motivo6_detalle = "Foto adjunta no cumple con las especificaciones establecidas";
  motivo7_detalle = "Foto adjunta no corresponde a los datos registrados";
  motivo8_detalle = "Información registrada errada (ejm. colocan lisuras en el campo de la dirección)";
  motivo9_detalle = "Otros";

  motivo1_detalle_pj = "DNI no corresponde al usuario";
  motivo2_detalle_pj = "Documento de representante no corresponde al representante legal";
  motivo3_detalle_pj = "Documento de representante no corresponde al personero legal (titular)";
  motivo4_detalle_pj = "Documento adjunto incompleto";
  motivo5_detalle_pj = "Documento adjunto ilegible o en blanco";
  motivo6_detalle_pj = "Documento de representante legal mayor a 90 días calendarios";
  motivo7_detalle_pj = "Foto adjunta no cumple con las especificaciones establecidas";
  motivo8_detalle_pj = "Foto adjunta no corresponde al DNI del solicitante";
  motivo9_detalle_pj = "Información registrada errada (ejm. colocan lisuras en el campo de la dirección)";
  motivo10_detalle_pj = "Otros"

  data: any = {};

  imageURlss: any = '';
  pdfSolicitudCasilla: any;

  constructor(
    private usuarioService: UserService,
    private router: ActivatedRoute,
    private route: Router,
    private funcionesService: FuncionesService,
    public domSanitizer: DomSanitizer
  ) {
    this.id = this.router.snapshot.paramMap.get('id');
    this.type = this.router.snapshot.paramMap.get('type');
    this.action = this.router.snapshot.paramMap.get('action');
  }

  ngOnInit(): void {
    this.getDataUser();
  }

  cancelar(){
    this.usuarioService.searchListuser({search:"",filter : "",page:1,count:5,estado:"",fechaInicio:"",fechaFin:"",ordenFec:"desc"});
    history.back();
  }

  async getDataUser() {

    this.load = true;
    this.info = await this.usuarioService.getUserDetail(this.id, true).toPromise();
    this.load = false;
    if (!this.info.user) {
      this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r => {
      this.route.navigate(['main/list-boxes']);
      });
    }
    this.data = this.info.user;
    const tpmUbigeo = this.info.user.ubigeo.split('/');
    this.data.departamento = tpmUbigeo[0];
    this.data.provincia = tpmUbigeo[1];
    this.data.distrito = tpmUbigeo[2];
    if (this.data.doc_type === 'pr') {
      this.data.doc_type_des = 'Partida registral';
    } else {
      this.data.doc_type_des = this.data.doc_type;
    }
    if (this.info.user.representative.length !== undefined){
      const tpmUbigeoRep = this.info.user.representative.ubigeo.split('/');
      this.data.representative.departamento = tpmUbigeoRep[0];
      this.data.representative.provincia = tpmUbigeoRep[1];
      this.data.representative.distrito = tpmUbigeoRep[2];
    }

    if (this.data.doc_type === 'pr' || this.data.doc_type === 'ruc'){

      if (typeof this.data.representative.file_document1 !== 'undefined') {
        if (this.data.representative.file_document1[0].name !== undefined){
          this.ofile_document1 = true;
        }
      }
      if (typeof this.data.representative.file_document2 !== 'undefined') {
        if (this.data.representative.file_document2[0].name !== undefined){
          this.ofile_document2 = true;
        }
      }

      if (this.data.attachments != null) {
        if (typeof this.data.attachments[0] !== 'undefined'){
          this.ofile_box1 = (typeof this.data.attachments[0].path !== 'undefined') && (typeof this.data.attachments[0].name !== 'undefined');
          this.file_box1 = this.data.attachments[0];
        }
        if (typeof this.data.attachments[1] !== 'undefined') {
          this.ofile_box2 = (typeof this.data.attachments[1].path !== 'undefined') && (typeof this.data.attachments[1].name !== 'undefined');
          this.file_box2 = this.data.attachments[1];
        }
      } else {
        if (typeof this.data.representative.file_box1 !== 'undefined') {
          if (typeof this.data.representative.file_box1[0].name !== undefined){
            this.ofile_box1 = true;
            this.file_box1 = this.data.representative.file_box1[0];
          }
        }
        if (typeof this.data.representative.file_box2 !== 'undefined') {
          if (typeof this.data.representative.file_box2[0].name !== undefined) {
            this.ofile_box2 = true;
            this.file_box2 = this.data.representative.file_box2[0];
          }
        }
      }

      if (typeof this.data.representative.file_document !== 'undefined') {
        if (this.data.representative.file_document[0]?.name !== undefined){
          this.ofile_document = true;
        }
      }
    }

    this.sinDatos = false;
    if (this.action !== 'view'){
      if (this.data.enAtencion === true || this.data.enAtencion === undefined){

        this.funcionesService.mensajeInfo('El registro ya está siendo atendido por '+ this.data.enAtencionPor) .then((resp) => {
          this.usuarioService.searchListuser({search:"",filter : "",page:1,count:5,estado:"",fechaInicio:"",fechaFin:"",ordenFec:"desc"});
          this.linkRedirect('list-boxes');
      })
      .catch((err) => {});


      }
    }

    if (this.data.imageDNI) {
      this.imageURlss = this._arrayBufferToBase64(this.data.imageDNI);
    }
  }

  linkRedirect(section: any) {
    this.route.routeReuseStrategy.shouldReuseRoute = () => false;
    this.route.navigate(['/main/' + section]);
  }

  download = async (path: string, name: string) => {
    // Propuesta al no encontrar archivo
    // const timeout = new Promise((_, reject) =>
    //   setTimeout(() => reject(new Error('Error al descargar archivo')), 2000)
    // );
    try {
      // this.funcionesService.showloading('Procesando...', 'Descargando archivo');
      this.load = true;
      // Propuesta al no encontrar archivo
      // const file = await Promise.race([this.usuarioService.download(path).toPromise(), timeout]);
      const file = await this.usuarioService.download(path).toPromise();
      // console.log('archivoo', file);
      this.funcionesService.downloadFile(file, name);
      // this.funcionesService.closeloading();
      this.load = false;
    } catch (error) {
      await this.funcionesService.mensajeError(error.message);
      this.load = false;
    }
  }
  /*async downloadPdf (inboxId: string, name: string) {
    try {
      this.load = true;
      console.log('downloading file ...', inboxId);

      const file = await this.casillaService.download(inboxId); //.toPromise();

      console.log('file :', file);
      this.load = false;
    } catch (error) {
      console.log('Ocurrio el error:', error);
      this.load = false;
    }
  };*/

  ViewImg(attachments): string {
    let typeArray = new Uint8Array(attachments.data);
    const STRING_CHAR = String.fromCharCode.apply(null, typeArray);
    let base64String = btoa(STRING_CHAR);

    let info = 'data:image/jpeg;base64,' + base64String;
    return info;
  }

  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer.data);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:image/jpeg;base64,' + window.btoa(binary);
  }

  consultar(estado) {
    let palabra = '';
    let envioestado = '';
    let motivoenvio = {};
    let palabraRespues = '';

    if (estado == 1) {
      envioestado = 'APROBADO';
      palabraRespues = 'aprobada';
      let tmpName = "";

      if(this.data.doc_type == 'ruc' || this.data.doc_type == 'pr'){
        tmpName = this.data.organization_name;
      } else {
        tmpName = this.data.name;
      }

      this.funcionesService
        .mensajeConfirmar(
          '¿Estás seguro de aprobar la creación de Casilla Electrónica de ' + tmpName + '?'
        )
        .then((resp) => {
          this.funcionesService.showloading('Procesando...', 'Aprobar');
          this.usuarioService
            .updateEstateInbox({
              idUser: this.id,
              estado: envioestado,
              motivo: motivoenvio,
              name: this.data.name + ' ' + this.data.lastname + ' ' + this.data.second_lastname,
              email : this.data.email
            })
            .subscribe((res) => {
              this.funcionesService.closeloading();
              if (res.success) {
                this.funcionesService.mensajeOk(
                  'La casilla ha sido aprobada con éxito',
                  '/main/list-boxes'
                );
              } else {
                this.funcionesService.mensajeError(
                  res.error + ''
                );
              }
            });
        })
        .catch((err) => {
          this.funcionesService.closeloading();
        });
    } else {
      palabra = 'desaprobar';
      envioestado = 'DESAPROBADO';
      palabraRespues = 'desaprobada';

    if (this.data.doc_type == 'ruc' || this.data.docType == 'pr'){
      Swal.fire({
        width: '800px',
        title: 'Motivo de desaprobación',
        showCancelButton: true,
        confirmButtonText: 'Enviar',
        // denyButtonText: 'Cancelar',
        cancelButtonText: 'Cancelar',
        html: `
        <div id="contenidoSweet" style="
        text-align: start !important;
    ">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="value1">
            <label class="form-check-label" for="value1">
            ${this.motivo1_detalle_pj}
            </label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="value2">
            <label class="form-check-label" for="value2">
            ${this.motivo2_detalle_pj}
            </label>
        </div>
        <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="value3">
        <label class="form-check-label" for="value3">
        ${this.motivo3_detalle_pj}
        </label>
    </div>
      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value4">
      <label class="form-check-label" for="value4">
      ${this.motivo4_detalle_pj}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value5">
      <label class="form-check-label" for="value5">
      ${this.motivo5_detalle_pj}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value6">
      <label class="form-check-label" for="value6">
      ${this.motivo6_detalle_pj}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value7">
      <label class="form-check-label" for="value7">
      ${this.motivo7_detalle_pj}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value8">
      <label class="form-check-label" for="value8">
      ${this.motivo8_detalle_pj}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value9">
      <label class="form-check-label" for="value9">
      ${this.motivo9_detalle_pj}
      </label>
      </div>

      <div class="form">
      <label class="form-check-label" for="value10" style="position: relative;vertical-align: top;">
      ${this.motivo10_detalle_pj}:
      </label>
      <textarea class="form-check-input" id="value10" cols="75" rows="2" maxlength="300" style="font-family: inherit;font-size: 14px;"></textarea>
      </div>
          `,

        focusConfirm: false,
        preConfirm: () => {
          return {
            motivo1:{
              detalle : this.motivo1_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value1'))
              .checked
            } ,
            motivo2:{
              detalle : this.motivo2_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value2'))
              .checked
            } ,
            motivo3:{
              detalle : this.motivo3_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value3'))
              .checked
            } ,
            motivo4:{
              detalle : this.motivo4_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value4'))
              .checked
            },
            motivo5:{
              detalle : this.motivo5_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value5'))
              .checked
            },
            motivo6:{
              detalle : this.motivo6_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value6'))
              .checked
            },
            motivo7:{
              detalle : this.motivo7_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value7'))
              .checked
            },
            motivo8:{
              detalle : this.motivo8_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value8'))
              .checked
            },
            motivo9:{
              detalle : this.motivo9_detalle_pj,
              value : (<HTMLInputElement>document.getElementById('value9'))
              .checked
            },
            motivo10:{
              detalle : this.motivo10_detalle_pj + ': ' + (<HTMLInputElement>document.getElementById('value10')).value,
              value : (<HTMLInputElement>document.getElementById('value10')).value.length > 0
            }
          };
        },
      }).then((result) => {
        let val1 = (<HTMLInputElement>document.getElementById('value1')).checked;
        let val2 = (<HTMLInputElement>document.getElementById('value2')).checked;
        let val3 = (<HTMLInputElement>document.getElementById('value3')).checked;
        let val4 = (<HTMLInputElement>document.getElementById('value4')).checked;
        let val5 = (<HTMLInputElement>document.getElementById('value5')).checked;
        let val6 = (<HTMLInputElement>document.getElementById('value6')).checked;
        let val7 = (<HTMLInputElement>document.getElementById('value7')).checked;
        let val8 = (<HTMLInputElement>document.getElementById('value8')).checked;
        let val9 = (<HTMLInputElement>document.getElementById('value9')).checked;
        let val10St = (<HTMLInputElement>document.getElementById('value10')).value.replace(/^( )+/, '');
        let val10 = val10St.length;
        let valTotal = (val1 || val2 || val3 || val4 || val5 || val6 || val7 || val8 || val9 || val10>0);

          if (result.isConfirmed) {
            // console.log('resultado', result);
            // console.log('Resultado total checks', valTotal);

            if(valTotal){
              this.funcionesService.showloading('Procesando...','Desaprobar');
              this.usuarioService
              .updateEstateInbox({
                idUser: this.id,
                estado: envioestado,
                motivo: result.value,
                name: this.data.name + ' ' + this.data.lastname + ' ' + this.data.second_lastname,
                email : this.data.email
              })
              .subscribe((res) => {
                this.funcionesService.closeloading();
                if (res.success) {
                  this.funcionesService.mensajeOk(
                    'La casilla ha sido desaprobada',
                    '/main/list-boxes'
                  );
                } else {
                  this.funcionesService.mensajeError(res.error);
                  return;
                }
              });
            }else{
              this.funcionesService.mensajeError('Debe seleccionar por lo menos un motivo');
              return;
            }

          } else {
            return;
          }
      });
    } else {
      Swal.fire({
        width: '800px',
        title: 'Motivo de desaprobación',
        showCancelButton: true,
        confirmButtonText: 'Enviar',
        // denyButtonText: 'Cancelar',
        cancelButtonText: 'Cancelar',
        html: `
        <div id="contenidoSweet" style="
        text-align: start !important;
    ">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="value1">
            <label class="form-check-label" for="value1">
            ${this.motivo1_detalle}
            </label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="value2">
            <label class="form-check-label" for="value2">
            ${this.motivo2_detalle}
            </label>
        </div>
        <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="value3">
        <label class="form-check-label" for="value3">
        ${this.motivo3_detalle}
        </label>
    </div>
      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value4">
      <label class="form-check-label" for="value4">
      ${this.motivo4_detalle}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value5">
      <label class="form-check-label" for="value5">
      ${this.motivo5_detalle}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value6">
      <label class="form-check-label" for="value6">
      ${this.motivo6_detalle}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value7">
      <label class="form-check-label" for="value7">
      ${this.motivo7_detalle}
      </label>
      </div>

      <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="value8">
      <label class="form-check-label" for="value8">
      ${this.motivo8_detalle}
      </label>
      </div>

      <div class="form">
      <label class="form-check-label" for="value9" style="position: relative;vertical-align: top;">
      ${this.motivo9_detalle}:
      </label>
      <textarea class="form-check-input" id="value9" cols="75" rows="2" maxlength="300" style="font-family: inherit;font-size: 14px;"></textarea>
      </div>
          `,

        focusConfirm: false,
        preConfirm: () => {
          return {
            motivo1:{
              detalle : this.motivo1_detalle,
              value : (<HTMLInputElement>document.getElementById('value1'))
              .checked
            } ,
            motivo2:{
              detalle : this.motivo2_detalle,
              value : (<HTMLInputElement>document.getElementById('value2'))
              .checked
            } ,
            motivo3:{
              detalle : this.motivo3_detalle,
              value : (<HTMLInputElement>document.getElementById('value3'))
              .checked
            } ,
            motivo4:{
              detalle : this.motivo4_detalle,
              value : (<HTMLInputElement>document.getElementById('value4'))
              .checked
            }  ,
            motivo5:{
              detalle : this.motivo5_detalle,
              value : (<HTMLInputElement>document.getElementById('value5'))
              .checked
            }  ,
            motivo6:{
              detalle : this.motivo6_detalle,
              value : (<HTMLInputElement>document.getElementById('value6'))
              .checked
            }  ,
            motivo7:{
              detalle : this.motivo7_detalle,
              value : (<HTMLInputElement>document.getElementById('value7'))
              .checked
            }  ,
            motivo8:{
              detalle : this.motivo8_detalle,
              value : (<HTMLInputElement>document.getElementById('value8'))
              .checked
            }  ,
            motivo9:{
              detalle : this.motivo9_detalle + ': ' + (<HTMLInputElement>document.getElementById('value9')).value,
              value : (<HTMLInputElement>document.getElementById('value9')).value.length > 0
            }
          };
        },
      }).then((result) => {
        let val1 = (<HTMLInputElement>document.getElementById('value1')).checked;
        let val2 = (<HTMLInputElement>document.getElementById('value2')).checked;
        let val3 = (<HTMLInputElement>document.getElementById('value3')).checked;
        let val4 = (<HTMLInputElement>document.getElementById('value4')).checked;
        let val5 = (<HTMLInputElement>document.getElementById('value5')).checked;
        let val6 = (<HTMLInputElement>document.getElementById('value6')).checked;
        let val7 = (<HTMLInputElement>document.getElementById('value7')).checked;
        let val8 = (<HTMLInputElement>document.getElementById('value8')).checked;
        let val9St = (<HTMLInputElement>document.getElementById('value9')).value.replace(/^( )+/, '');
        let val9 = val9St.length;
        let valTotal = (val1 || val2 || val3 || val4 || val5 || val6 || val7 || val8 || val9>0);



          if (result.isConfirmed) {
            // console.log('resultado', result);
            // console.log('Resultado total checks', valTotal);

            if(valTotal){
              this.funcionesService.showloading('Procesando...','Desaprobar');
              this.usuarioService
              .updateEstateInbox({
                idUser: this.id,
                estado: envioestado,
                motivo: result.value,
                name: this.data.name + ' ' + this.data.lastname + ' ' + this.data.second_lastname,
                email : this.data.email
              })
              .subscribe((res) => {
                this.funcionesService.closeloading();
                if (res.success) {
                  this.funcionesService.mensajeOk(
                    'La casilla ha sido desaprobada',
                    '/main/list-boxes'
                  );
                } else {
                  this.funcionesService.mensajeError(res.error);
                  return;
                }
              });
            }else{
              this.funcionesService.mensajeError('Debe seleccionar por lo menos un motivo');
              return;
            }

          } else {
            return;
          }
      });
    } // fin if
    }
  }

  showloading(subtitle: string = null, title: string = null){
      Swal.fire({
        title: title,
        html: subtitle,
        showConfirmButton: false,
        allowOutsideClick: false,
        timerProgressBar: true,
        onBeforeOpen: () => {
          Swal.showLoading();
        }
      })

    }

    closeloading(){
      Swal.close();
    }

  resendEmailAndSms(type: string, value: string, isRep: boolean) {
    let message = '';
    let messageSuccessful = '';

    const data: IResendEmailAndSms = {
      userId: this.id,
      sendType: type,
      email: '',
      cellphone: '',
      isRep,
      mode: 'inbox'
    };

    if (type === 'email') {
      data.email = value;
      message = '¿Estás seguro de reenviar la comunicación vía correo electrónico al destinatario?';
      messageSuccessful = 'El reenvío del email fue realizado con éxito';
    }

    if (type === 'sms') {
      data.cellphone = value;
      message = '¿Estás seguro de reenviar la comunicación vía mensaje de texto al destinatario?';
      messageSuccessful = 'El reenvío del mensaje de texto fue realizado con éxito';
    }

    // console.log(data);
    // data.email = 'alex.alx107@gmail.com';
    // data.sendType = 'email';
    this.funcionesService.mensajeConfirmar(message, 'Información')
      .then((resp) => {
        this.usuarioService.resendEmailAndSms(data).subscribe((response) => {
          if (!response.success){
            this.funcionesService.closeloading();
            this.funcionesService.mensajeError(response.message ? response.message : 'Error al reenviar ' + type.toUpperCase());
          } else {
            this.funcionesService.closeloading();
            this.funcionesService.mensajeOk(messageSuccessful);
            this.getDataUser();
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  consolidateDocuments(...documentSets: any[][]): any[] {//Array para representative nuevo cuadro
    return documentSets.reduce((consolidated, documentSet) => {
      return consolidated.concat(documentSet || []);
    }, []);
  }
}
