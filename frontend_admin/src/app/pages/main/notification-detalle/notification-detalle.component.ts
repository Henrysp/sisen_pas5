import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {NotificationRequest} from 'src/app/models/notifications/notification-request';
import {
  attachment,
  notification,
  notificationRequest,
} from 'src/app/models/notifications/notification';
import {NotificationService} from 'src/app/services/notification.service';
import {FuncionesService} from 'src/app/utils/funciones.service';
import {ResultSignature} from 'src/app/shared/constantes';
import {Subject} from 'rxjs';
import {DatePipe} from '@angular/common';
import {CalendarService} from 'src/app/services/calendar.service';
import {IResendEmailAndSms} from '../../../models/users/user';
import {UserService} from '../../../services/user.service';

declare var initInvoker: any;
declare var dispatchEventClient: any;

@Component({
  selector: 'app-notification-detalle',
  templateUrl: './notification-detalle.component.html',
  styleUrls: ['./notification-detalle.component.scss'],
})
export class NotificationDetalleComponent implements OnInit {
  notiRequest: notificationRequest = new notificationRequest();
  // notificationRequest : notificationsRequest = new notificationsRequest();
  id: string;
  public formulario: FormGroup;
  adjuntos: attachment[];
  urlAcuse: string;
  urlAcuseRecibido: string;
  view1 = 'color_1 posUno';
  view2 = 'color_2 posDos posUno';
  icon2 = 'stop_circle';
  view3 = 'color_2 posDos';
  icon3 = 'stop_circle';
  formDataNotification: FormData = new FormData();
  notification: notification = new notification();
  countSend: any = {  };
  isAutomatic = false;
  enviando = false;
  parametro: string;
  loading = true;
  cargos = true;
  cargoDisplayData: any[] = [];
  lbl_bloqueado = 'El documento contiene datos que sólo el administrado puede acceder';
  calendars: any = [];
  cargoList: any = [
    { value: false, position: '2', nombre: 'Personero Legal Titular' },
    { value: false, position: '3', nombre: 'Tesorero' },
    { value: false, position: '4', nombre: 'Representante Legal OP' },
    { value: false, position: '5', nombre: 'Presidente' },
    { value: false, position: '6', nombre: 'Presidente del OEC' }
  ];
  fecha: any = '';
  isOP: boolean;

  textSearch = '';
  pageIndex: number;
  pageSize: number;

  @Input() numNotview: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private notificationService: NotificationService,
    private funcionesService: FuncionesService,
    private calendarService: CalendarService,
    private userService: UserService,
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.router.getCurrentNavigation() != null) {
      this.textSearch = this.router.getCurrentNavigation().extras.state != null ? this.router.getCurrentNavigation().extras.state.textSearch : '';
      this.pageIndex = this.router.getCurrentNavigation().extras.state != null ? this.router.getCurrentNavigation().extras.state.pageIndex : 1;
      this.pageSize = this.router.getCurrentNavigation().extras.state != null ? this.router.getCurrentNavigation().extras.state.pageSize : 5;
    }
  }
  ngOnInit(): void {
    this.createForm();
    // console.log('tipo '+ this.cargoList.type);
    this.GetNotificationDetail();
    this.notification.read_at = null;
    this.notification.received_at = null;
    if (this.notificationService.openWindow.isStopped) { this.notificationService.openWindow = new Subject<boolean>(); }
    if (this.notificationService.saveNotification.isStopped) { this.notificationService.saveNotification = new Subject<boolean>(); }

    this.notificationService.saveNotification.subscribe(save => {
      if (save) {
        this.updateNotification();
      }
    });

    this.notificationService.openWindow.subscribe(open => {
      if (open) {
        dispatchEventClient('sendArguments', this.parametro);
      }
    });
  }

  createForm(): void {
    this.formulario = this.fb.group({
      n_expediente: [''],
      n_notifier_Area: [''],
      n_received_at: [''],
      n_read_at: [''],
      n_message: [''],
      n_expired_in: ['']
    });
  }

  getColor(name: string) {
    return this.funcionesService.colorLetter(name);
  }

  GetNotificationDetail() {
    this.notiRequest.id = this.id;
    this.loading = true;
    this.notificationService
      .getNotificationDetail<any>(this.notiRequest)
      .subscribe(
        (data) => {
          this.loading = false;
          if (data.success) {
            // console.log(data);
            this.countSend = data.count_send;
            this.notification = data.notification;
            this.isAutomatic = data.notification.automatic;
            this.adjuntos = data.notification.attachments;
            this.urlAcuse = data.notification.acuse.url;
            this.cargos = (data.notification.orgPol && data.notification.orgPol === '1');
            data.notification.orgPol === '1' ? this.isOP = true : this.isOP = false;
            if (this.cargos !== undefined && this.cargos){
              this.loadCargos(data.notification.read_position);
            }
            if (data.notification.acuse_read !== undefined) {
              this.urlAcuseRecibido = data.notification.acuse_read.url;
            }
            if (data.notification.officials ) {
              this.officialsAvailable();
              this.setupCargoDisplayData();
              this.setupTooltips();
            }
            if (!this.isAutomatic) {
              this.loadNotificationData(data.notification);
              if (data.notification.read_at !== undefined) {
                if (data.notification.expired) {
                  this.view2 = 'color_3 posDos posUno';
                } else {
                  this.view2 = 'color_1 posDos posUno';
                }
                this.icon2 = 'check_circle';
              }
              if (data.notification.expired) {
                this.view3 = 'color_3 posDos';
                this.icon3 = 'cancel';
              }
            }
          } else {
            this.funcionesService.mensajeError(data.error.message).then(r => {
              this.router.navigate(['main/notificaciones']);
            });
          }
        },
        (error) => {
          // this.mensaje="Error de servicio, intente de nuevo o mas tarde.";
        }
      );
  }
  officialsAvailable(){
    const officials = this.notification.officials;
    this.cargoList.forEach((cargo: { position: string | number; value: boolean; }) => {
      if (officials[cargo.position]) {
        cargo.value = true;
      }
    });
  }
  loadCargos(cargos: any){
    this.cargoList.forEach(cargo => {
      if (cargos !== undefined){
        const found = cargos.find((element) => element.cargo.toString() === cargo.nombre.toString());
        if (found){
          cargo.view = 'color_1';
          cargo.icon = 'check_circle';
          cargo.read_at = found.fecha;
        }else{
          cargo.view = 'color_2';
          cargo.icon = 'circle';
        }
      } else{
        cargo.view = 'color_2';
        cargo.icon = 'circle';
      }
    });
  }

  loadNotificationData(noti: notification) {

    this.formulario.get('n_expediente').setValue(noti.expedient);
    this.formulario.get('n_notifier_Area').setValue(noti.notifier_area);
    this.formulario.get('n_received_at').setValue(noti.received_at);
    this.formulario.get('n_read_at').setValue(noti.read_at);
    // this.formulario.get('n_received_at').setValue(this.funcionesService.transformDate(noti.received_at));
    // this.formulario.get('n_read_at').setValue(this.funcionesService.transformDate(noti.read_at));
    this.formulario.get('n_message').setValue(noti.message);
    this.formulario.get('n_expired_in').setValue(noti.expired_in);
    // this.adjuntos = noti.attachments;
  }

  viewDocument(item: any) {
    this.notificationService.downloadAttachment(item.url).subscribe(data => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.setAttribute('style', 'display:none');
      document.body.appendChild(a);
      a.href = url;
      a.download = item.name;
      a.click();
    });
  }

  downloadAcuse(doc: string) {
    this.notificationService.downloadAttachment(this.urlAcuse).subscribe(data => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.setAttribute('style', 'display:none');
      document.body.appendChild(a);
      a.href = url;
      a.download = 'Constancia_de_notificacion_' + doc + '.pdf';
      a.click();
    });
  }

  downloadAcuseRecibido(doc: string) {
    this.notificationService.downloadAttachment(this.urlAcuseRecibido).subscribe(data => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.setAttribute('style', 'display:none');
      document.body.appendChild(a);
      a.href = url;
      a.download = 'Acuse_Recibido_' + doc + '.pdf';
      a.click();
    });
  }

  downloadReporteLecturaNotification(idNotificacion: string, expedient: string) {
    this.notiRequest.id = idNotificacion;
    this.notificationService.reporteLecturaNotification(this.notiRequest).subscribe(data => {
      // console.log(data);
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.setAttribute('style', 'display:none');
      document.body.appendChild(a);
      a.href = url;
      a.download = 'ReporteLecturaNotificacion_' + expedient + '.xlsx';
      a.click();
    });
  }

  print() {
    const printContents = document.getElementById('imp1').innerHTML;
    document.getElementById('no-imp1').remove();
    const contenido = document.getElementById('imp1').innerHTML;

    const contenidoOriginal = document.body.innerHTML;
    document.body.innerHTML = contenido;
    window.print();
    document.body.innerHTML = contenidoOriginal;
    location.reload();
  }

  cancel() {
    this.notificationService.searchNotifications({
      textSearch: this.textSearch,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    });
    this.router.navigate(['/main/notificaciones']);
  }

  clearData() {
    this.notification = new notification();
  }

  getFormDataNotification() {
    this.formDataNotification = new FormData();
    this.formDataNotification.append('id', this.notification.id);
  }

  NotificationSign() {
    this.enviando = true;
    this.getFormDataNotification();

    this.notificationService
      .GetNotificationAutomaticSign(this.formDataNotification)
      .subscribe(
        (res) => {
          if (res.success) {
            this.parametro = res.param;
            if (this.parametro.length > 0) {
              // initInvoker(ResultSignature.TypeEvenReniec);
              this.updateNotification();
            } else {
              this.funcionesService.mensajeError(
                'No hay data para envío invoker'
              );
              this.enviando = false;
            }
          } else {
            this.funcionesService.mensajeError(res.error.message);
            this.enviando = false;
          }
        },
        (err) => {
          console.log('Problemas del servicio', err);
          this.enviando = false;
        }
      );
  }

  updateNotification() {
    this.getFormDataNotification();
    this.notificationService.SendNotificationAutomatic(this.formDataNotification).subscribe(
      (res) => {
        if (res.success) {
          // this.clearData();
          this.funcionesService.mensajeOk(
            'La notificación fue enviada con éxito',
            '/main/notificaciones'
          );
        } else {
          this.funcionesService.mensajeError(res.error.message);
        }
      },
      (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }

  resendEmailAndSms(type: string, value: string, isRep: boolean) {
    let message = '';
    let messageSuccessful = '';

    const data: IResendEmailAndSms = {
      notificationId: this.id,
      sendType: type,
      email: '',
      cellphone: '',
      isRep,
      mode: 'notification',
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
        this.userService.resendEmailAndSms(data).subscribe((response) => {
          if (!response.success){
            this.funcionesService.closeloading();
            this.funcionesService.mensajeError(response.message ? response.message : 'Error al reenviar ' + type.toUpperCase());
          } else {
            this.funcionesService.closeloading();
            this.funcionesService.mensajeOk(messageSuccessful);
            this.GetNotificationDetail();
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  ngOnDestroy(): void {
    this.notificationService.openWindow.unsubscribe();
    this.notificationService.saveNotification.unsubscribe();
  }
  get emailPJ() {
    return this.notification?.event_history_notifications?.EMAIL_SENT?.PJ[0];
  }
  get smsPJ() {
    return this.notification?.event_history_notifications?.SMS_SENT?.PJ[0];
  }
  get emailPersonero() {
    return this.notification?.event_history_notifications?.EMAIL_SENT?.Pers_Legal_OP[0];
  }
  get smsPersonero() {
    return this.notification?.event_history_notifications?.SMS_SENT?.Pers_Legal_OP[0];
  }
  get emailTesorero() {
    return this.notification?.event_history_notifications?.EMAIL_SENT?.Tesorero_OP[0];
  }
  get smsTesorero() {
    return this.notification?.event_history_notifications?.SMS_SENT?.Tesorero_OP[0];
  }
  get emailRep_Legal() {
    return this.notification?.event_history_notifications?.EMAIL_SENT?.Rep_Legal_OP[0];
  }
  get smsRep_Legal() {
    return this.notification?.event_history_notifications?.SMS_SENT?.Rep_Legal_OP[0];
  }
  get emailPresidente() {
    return this.notification?.event_history_notifications?.EMAIL_SENT?.Presidente_OP[0];
  }
  get smsPresidente() {
    return this.notification?.event_history_notifications?.SMS_SENT?.Presidente_OP[0];
  }
  get emailPresidenteOEC() {
    return this.notification?.event_history_notifications?.EMAIL_SENT?.PresidenteOEC_OP[0];
  }
  get smsPresidenteOEC() {
    return this.notification?.event_history_notifications?.SMS_SENT?.PresidenteOEC_OP[0];
  }

  resendEmailAndSmsOP(type: string, value: string, isRep: boolean, position_rep: string) {
    let message = '';
    let messageSuccessful = '';

    const data: IResendEmailAndSms = {
      notificationId: this.id,
      sendType: type,
      email: '',
      cellphone: '',
      isRep,
      mode: 'notification',
      position: position_rep,
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
        this.userService.resendEmailAndSms(data).subscribe((response) => {
          if (!response.success){
            this.funcionesService.closeloading();
            this.funcionesService.mensajeError(response.message ? response.message : 'Error al reenviar ' + type.toUpperCase());
            this.GetNotificationDetail();
          } else {
            this.funcionesService.closeloading();
            this.funcionesService.mensajeOk(messageSuccessful);
            this.GetNotificationDetail();
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  downloadAcuseRecibido2(idNotificacion: string, doc: string, read_at_formatted: string) {
    if (read_at_formatted !== '') {
      const token = sessionStorage.getItem('accessToken');
      this.notificationService.downloadAcuseRecibo(token, idNotificacion).subscribe(data => {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.setAttribute('style', 'display:none');
        document.body.appendChild(a);
        a.href = url;
        a.download = 'Acuse_Recibido_' + doc + '.pdf';
        a.click();
      });
    }
    sessionStorage.setItem('downloadFile', '1');
  }
  setupCargoDisplayData() {
    this.cargoDisplayData = [
      {
        title: 'PERSONA JURÍDICA',
        email: this.emailPJ,
        sms: this.smsPJ,
        positionId: '',
        showButton: true,
        emailHistoryCheck: this.notification.event_history_notifications?.EMAIL_SENT.PJ.length > 0,
        smsHistoryCheck: this.notification.event_history_notifications?.SMS_SENT.PJ.length > 0,
        isRep: false
      },
      {
        title: 'PERSONERO LEGAL TITULAR',
        email: this.emailPersonero,
        sms: this.smsPersonero,
        positionId: '2',
        showButton: this.cargoList[0].value,
        emailHistoryCheck: this.notification.event_history_notifications?.EMAIL_SENT.Pers_Legal_OP.length > 0 && this.cargoList[0].value,
        smsHistoryCheck: this.notification.event_history_notifications?.SMS_SENT.Pers_Legal_OP.length > 0 && this.cargoList[0].value,
        isRep: true
      },
      {
        title: 'TESORERO',
        email: this.emailTesorero,
        sms: this.smsTesorero,
        positionId: '3',
        showButton: this.cargoList[1].value,
        emailHistoryCheck: this.notification.event_history_notifications?.EMAIL_SENT.Tesorero_OP.length > 0 && this.cargoList[1].value,
        smsHistoryCheck: this.notification.event_history_notifications?.SMS_SENT.Tesorero_OP.length > 0 && this.cargoList[1].value,
        isRep: true
      },
      {
        title: 'REPRESENTANTE LEGAL OP',
        email: this.emailRep_Legal,
        sms: this.smsRep_Legal,
        positionId: '4',
        showButton: this.cargoList[2].value,
        emailHistoryCheck: this.notification.event_history_notifications?.EMAIL_SENT.Rep_Legal_OP.length > 0 && this.cargoList[2].value,
        smsHistoryCheck: this.notification.event_history_notifications?.SMS_SENT.Rep_Legal_OP.length > 0 && this.cargoList[2].value,
        isRep: true
      },
      {
        title: 'PRESIDENTE',
        email: this.emailPresidente,
        sms: this.smsPresidente,
        positionId: '5',
        showButton: this.cargoList[3].value,
        emailHistoryCheck: this.notification.event_history_notifications?.EMAIL_SENT.Presidente_OP.length > 0 && this.cargoList[3].value,
        smsHistoryCheck: this.notification.event_history_notifications?.SMS_SENT.Presidente_OP.length > 0 && this.cargoList[3].value,
        isRep: true
      },
      {
        title: 'PRESIDENTE DEL OEC',
        email: this.emailPresidenteOEC,
        sms: this.smsPresidenteOEC,
        positionId: '6',
        showButton: this.cargoList[4].value,
        emailHistoryCheck: this.notification.event_history_notifications?.EMAIL_SENT.PresidenteOEC_OP.length > 0 && this.cargoList[4].value,
        smsHistoryCheck: this.notification.event_history_notifications?.SMS_SENT.PresidenteOEC_OP.length > 0 && this.cargoList[4].value,
        isRep: true
      }
    ];
  }
  buildTooltip(remitente: string, type: string, origen: string) {
    const tipoDato = type === 'email' ? 'correo electrónico' : 'celular';

    if (origen === 'PJ') {
      if (remitente === this.cargoDisplayData[1][type]?.sent_to) {
        return `Enviado a: ${remitente}\nEl ${tipoDato} coincide con el registrado en el representante.`;
      }
    } else {
      if (remitente === this.cargoDisplayData[0][type].sent_to) {
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
