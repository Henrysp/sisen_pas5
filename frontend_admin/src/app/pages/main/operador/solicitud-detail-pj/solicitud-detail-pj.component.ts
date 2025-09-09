import {Component, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from 'src/app/services/user.service';
import {FuncionesService} from 'src/app/utils/funciones.service';
import {Location} from '@angular/common';
import Swal from 'sweetalert2';
import {IResendEmailAndSms} from '../../../../models/users/user';

@Component({
  selector: 'app-solicitud-detail-pj',
  templateUrl: './solicitud-detail-pj.component.html',
  styleUrls: ['./solicitud-detail-pj.component.scss']
})
export class SolicitudDetailPjComponent implements OnInit {
  load = false;
  loadDownload = false;
  sinDatos = true;
  mostrarImagen = true;
  ofile_box1:boolean = false;
  ofile_box2:boolean = false;
  ofile_document:boolean = false;
  ofile_document1:boolean = false;
  ofile_document2:boolean = false;
  file_box1: any  = {};
  file_box2: any = {};
  info: any = {};

  displayedColumnsHistory: string[] = ['contact', 'updated_at', 'doc', 'updated_user', 'attachments'];
  displayedColumns: string[] = ['dni', 'nombre', 'fec_reg', 'fec_eval', 'evaluador', 'fec_ini', 'fec_fin', 'foto', 'sustento', 'accion'];
  displayedColumnsHistoryRepresentative: string[] = ['doc', 'names', 'evaluator_user_names', 'date_begin', 'date_end', 'foto', 'sustento'];
  displayedColumnsHistoryRepresentativeOP: string[] = ['doc', 'names', 'evaluator_user_names', 'date_begin', 'date_end'];

  id; action;
  motivo1_detalle = "DNI no corresponde al usuario";
  motivo2_detalle = "Documento de representante no corresponde al representante legal";
  motivo3_detalle = "Documento de representante no corresponde al personero legal (titular)";
  motivo4_detalle = "Documento adjunto ilegible o en blanco";
  motivo5_detalle = "Documento de representación mayor a 90 días calendarios";
  motivo6_detalle = "Foto adjunta no cumple con las especificaciones";
  motivo7_detalle = "Foto adjunta no corresponde a los datos registrados";
  motivo8_detalle = "Información registrada errada (ejm. colocan lisuras en el campo de la dirección)";
  motivo9_detalle = "Otros";
  data: any = {};
  representante: any = {};

  imageURlss: any = '';
  officials = [
    { value: true, label: 'Representante Legal', dataKey: 'Rep_Legal', op: false },
    { value: true, label: 'Personero Legal Titular', dataKey: 'Pers_Legal_OP', op: true },
    { value: true, label: 'Tesorero', dataKey: 'Tesorero_OP', op: true },
    { value: true, label: 'Representante Legal de OP', dataKey: 'Rep_Legal_OP', op: true},
    { value: true, label: 'Presidente', dataKey: 'Presidente_OP', op: true },
    { value: true, label: 'Presidente del OEC', dataKey: 'PresidenteOEC_OP', op: true}
  ];
  cargoDisplayData: any[] = [];

  constructor(
    private usuarioService: UserService,
    private router: ActivatedRoute,
    private route: Router,
    private funcionesService: FuncionesService,
    public domSanitizer: DomSanitizer,
    private readonly location: Location
  ) {
    this.id = this.router.snapshot.paramMap.get('id');
    this.action = this.router.snapshot.paramMap.get('action');
  }

  ngOnInit(): void {
    this.getDataUser();
  }

  async getDataUser() {
    this.load = true;
    const info = await this.usuarioService.getUserDetailPJ(this.id, true).toPromise();
    this.info = info;
    if (!this.info.user) {
      this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r => {
        this.route.navigate(['main/list-boxes']);
      });
    }
    this.data = info.user;
    this.load = false;
    this.setupCargoDisplayData();
    this.setupTooltips();
    this.sinDatos = false;
    if ( this.data.doc_type === 'pr') {
      this.data.doc_type_des = 'Partida registral';
    } else {
      this.data.doc_type_des = this.data.doc_type;
    }
    if ( this.action !== 'view'){
      if (this.data.enAtencion === true || this.data.enAtencion === undefined){

        this.funcionesService.mensajeInfo('El registro ya está siendo atendido por ' + this.data.enAtencionPor) .then((resp) => {

        this.usuarioService.searchListuser({search: '', filter : '', page: 1, count: 5, estado: '', fechaInicio: '', fechaFin: '', ordenFec: 'desc'});
        this.linkRedirect('list-boxes');

      })
      .catch((err) => {});

      }
    }

    if (typeof this.data.representantes[0].file_document1 !== 'undefined') {
      if (this.data.representantes[0].file_document1[0].name !== undefined){
        this.ofile_document1 = true;
      }
    }
    if (typeof this.data.representantes[0].file_document2 !== 'undefined') {
      if (this.data.representantes[0].file_document2[0].name !== undefined) {
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
      if (typeof this.data.representantes[0].file_box1 !== 'undefined') {
        if (typeof this.data.representantes[0].file_box1[0].name !== undefined){
          this.ofile_box1 = true;
          this.file_box1 = this.data.representantes[0].file_box1[0];
        }
      }
      if (typeof this.data.representantes[0].file_box2 !== 'undefined') {
        if (typeof this.data.representantes[0].file_box2[0].name !== undefined) {
          this.ofile_box2 = true;
          this.file_box2 = this.data.representantes[0].file_box2[0];
        }
      }
    }

    if (typeof this.data.representantes[0].file_document !== 'undefined') {
      if (this.data.representantes[0].file_document[0].name !== undefined){
        this.ofile_document = true;
      }
    }

    this.representante = this.data.representante;

    if(this.data.representantes.length > 1){
      this.mostrarImagen = false;
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
    try {
      this.loadDownload = true;
      const file = await this.usuarioService.download(path).toPromise();
      this.funcionesService.downloadFile(file, name);
      this.loadDownload = false;
    } catch (error) {
      this.loadDownload = false;
    }
  }
  ViewImg(attachments): string {
    let typeArray = new Uint8Array(attachments.data);
    const STRING_CHAR = String.fromCharCode.apply(null, typeArray);
    let base64String = btoa(STRING_CHAR);

    let info = 'data:image/jpeg;base64,' + base64String;
    return info;
    //this.domSanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,'+ base64String);
  }

  _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer.data);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    let info = 'data:image/jpeg;base64,' + window.btoa(binary);
    return info;
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
    });
  }

  closeloading(){
    Swal.close();
  }

  cancelar() {
    this.location.back();
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
      mode: 'inbox',
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
  resendEmailAndSmsOP(type: string, value: string, isRep: boolean, Rep_Id: string) {
    let message = '';
    let messageSuccessful = '';

    const data: IResendEmailAndSms = {
      userId: this.id,
      sendType: type,
      email: '',
      cellphone: '',
      mode: 'inbox',
      isRep,
      RepId: Rep_Id,
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
  hasData(dataKey: string): boolean {
    return this.data.representative &&
      this.data.representative[dataKey] &&
      this.data.representative[dataKey].length > 0;
  }
  getColumnDefs(dataKey: string): string[] {
    const basicColumns = ['doc', 'names', 'evaluator_user_names', 'date_begin', 'date_end', 'sustento'];
    return this.showAdvancedColumns(dataKey)
      ? [...basicColumns, 'foto']
      : basicColumns;
  }
  showAdvancedColumns(dataKey: string): boolean {
    return ['Rep_Legal', 'Pers_Legal_OP'].includes(dataKey);
  }
  getAvailableRoles() {
    return this.officials.filter(role => role.op === (this.data.orgPol === '1'));
  }
  get emailPJ() {
    return this.data?.event_history?.EMAIL_SENT?.PJ[0];
  }
  get smsPJ() {
    return this.data?.event_history?.SMS_SENT?.PJ[0];
  }
  get emailPersonero() {
    return this.data?.event_history?.EMAIL_SENT?.Pers_Legal_OP[0];
  }
  get smsPersonero() {
    return this.data?.event_history?.SMS_SENT?.Pers_Legal_OP[0];
  }
  get emailTesorero() {
    return this.data?.event_history?.EMAIL_SENT?.Tesorero_OP[0];
  }
  get smsTesorero() {
    return this.data?.event_history?.SMS_SENT?.Tesorero_OP[0];
  }
  get emailRep_Legal() {
    return this.data?.event_history?.EMAIL_SENT?.Rep_Legal_OP[0];
  }
  get smsRep_Legal() {
    return this.data?.event_history?.SMS_SENT?.Rep_Legal_OP[0];
  }
  get emailPresidente() {
    return this.data?.event_history?.EMAIL_SENT?.Presidente_OP[0];
  }
  get smsPresidente() {
    return this.data?.event_history?.SMS_SENT?.Presidente_OP[0];
  }
  get emailPresidenteOEC() {
    return this.data?.event_history?.EMAIL_SENT?.PresidenteOEC_OP[0];
  }
  get smsPresidenteOEC() {
    return this.data?.event_history?.SMS_SENT?.PresidenteOEC_OP[0];
  }
  setupCargoDisplayData() {
    this.cargoDisplayData = [
      {
        title: 'PERSONA JURÍDICA',
        email: this.emailPJ,
        sms: this.smsPJ,
        positionId: this.data.id,
        showButton: true,
        emailHistoryCheck: this.data.event_history?.EMAIL_SENT.PJ.length > 0,
        smsHistoryCheck: this.data.event_history?.SMS_SENT.PJ.length > 0,
        isRep: false,
        view: true
      },
      {
        title: 'PERSONERO LEGAL TITULAR',
        email: this.emailPersonero,
        sms: this.smsPersonero,
        positionId: this.data.representative?.Pers_Legal_OP[0]?.user_id,
        showButton: this.officials[1].value,
        emailHistoryCheck: this.data.event_history?.EMAIL_SENT.Pers_Legal_OP.length > 0 && this.officials[1].value,
        smsHistoryCheck: this.data.event_history?.SMS_SENT.Pers_Legal_OP.length > 0 && this.officials[1].value,
        isRep: true,
        view: true
      },
      {
        title: 'TESORERO',
        email: this.emailTesorero,
        sms: this.smsTesorero,
        positionId: this.data.representative?.Tesorero_OP[0]?.user_id,
        showButton: this.officials[2].value,
        emailHistoryCheck: this.data.event_history?.EMAIL_SENT.Tesorero_OP.length > 0 && this.officials[2].value,
        smsHistoryCheck: this.data.event_history?.SMS_SENT.Tesorero_OP.length > 0 && this.officials[2].value,
        isRep: true,
        view: this.data.status !== 'DESAPROBADO'
      },
      {
        title: 'REPRESENTANTE LEGAL OP',
        email: this.emailRep_Legal,
        sms: this.smsRep_Legal,
        positionId: this.data.representative?.Rep_Legal_OP[0]?.user_id,
        showButton: this.officials[3].value,
        emailHistoryCheck: this.data.event_history?.EMAIL_SENT.Rep_Legal_OP.length > 0 && this.officials[3].value,
        smsHistoryCheck: this.data.event_history?.SMS_SENT.Rep_Legal_OP.length > 0 && this.officials[3].value,
        isRep: true,
        view: this.data.status !== 'DESAPROBADO'
      },
      {
        title: 'PRESIDENTE',
        email: this.emailPresidente,
        sms: this.smsPresidente,
        positionId: this.data.representative?.Presidente_OP[0]?.user_id,
        showButton: this.officials[4].value,
        emailHistoryCheck: this.data.event_history?.EMAIL_SENT.Presidente_OP.length > 0 && this.officials[4].value,
        smsHistoryCheck: this.data.event_history?.SMS_SENT.Presidente_OP.length > 0 && this.officials[4].value,
        isRep: true,
        view: this.data.status !== 'DESAPROBADO'
      },
      {
        title: 'PRESIDENTE DEL OEC',
        email: this.emailPresidenteOEC,
        sms: this.smsPresidenteOEC,
        positionId: this.data.representative?.PresidenteOEC_OP[0]?.user_id,
        showButton: this.officials[5].value,
        emailHistoryCheck: this.data.event_history?.EMAIL_SENT.PresidenteOEC_OP.length > 0 && this.officials[5].value,
        smsHistoryCheck: this.data.event_history?.SMS_SENT.PresidenteOEC_OP.length > 0 && this.officials[5].value,
        isRep: true,
        view: this.data.status !== 'DESAPROBADO'
      }
    ];
  }
  get filteredCargos() {
    return this.cargoDisplayData.filter(cargo => cargo.view);
  }
  buildTooltip(remitente: string, type: string, origen: string) {
    const tipoDato = type === 'email' ? 'correo electrónico' : 'celular';

    if (origen === 'PJ') {
      if (remitente === this.cargoDisplayData[1][type]?.sent_to) {
        return `Enviado a: ${remitente}\nEl ${tipoDato} coincide con el registrado en el representante.`;
      }
    } else {
      if (remitente === this.cargoDisplayData[0][type]?.sent_to) {
        return `Enviado a: ${remitente}\nEl ${tipoDato} coincide con el registrado en la PJ.`;
      }
    }
    return `Enviado a: ${remitente}`;
  }
  setupTooltips() {
    for (let i = 0; i < 2/*this.cargoDisplayData.length*/; i++) {
      if (this.cargoDisplayData[i].email?.sent_to) {
        const origen = i === 0 ? 'PJ' : 'rep';
        this.cargoDisplayData[i].tooltipEMAIL = this.buildTooltip(
          this.cargoDisplayData[i].email.sent_to,
          'email',
          origen
        );
      }

      if (this.cargoDisplayData[i].sms?.sent_to) {
        const origen = i === 0 ? 'PJ' : 'rep';
        this.cargoDisplayData[i].tooltipSMS = this.buildTooltip(
          this.cargoDisplayData[i].sms.sent_to,
          'sms',
          origen
        );
      }
    }
  }
}
