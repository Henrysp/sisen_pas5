import { SeguridadService } from './../../../services/seguridad.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { attachment, notification, notificationRequest } from 'src/app/models/notification/notification';
import { notificationsRequest } from 'src/app/models/notifications/notifications-request';
import { NotificationlistServicesService } from 'src/app/services/notificationlist-services.service';
import { FuncionesService } from 'src/app/services/funciones.service';
@Component({
  selector: 'app-notificaciones-electronicas-detalle',
  templateUrl: './notificaciones-electronicas-detalle.component.html',
  styleUrls: ['./notificaciones-electronicas-detalle.component.scss']
})
export class NotificacionesElectronicasDetalleComponent implements OnInit {
  notiRequest: notificationRequest = new notificationRequest();
  notificationRequest: notificationsRequest = new notificationsRequest();
  id: string;
  public formulario: FormGroup;
  adjuntos: attachment[];
  view1 = 'color_1 posUno';

  view2 = 'color_2 posDos';
  icon2 = 'stop_circle';

  urlAcuse: string;
  loading = true;
  notifier_area: string;

  textSearch = '';
  pageIndex: number;
  pageSize: number;

  @Input() numNotview: number;

  constructor(private fb: FormBuilder,
              private route: ActivatedRoute,
              private router: Router,
              private notificationsservices: NotificationlistServicesService,
              private seguridadService: SeguridadService,
              private funcionesService: FuncionesService,
    ) {
      localStorage.removeItem('id');
      this.id = this.route.snapshot.paramMap.get('id');
      if (this.router.getCurrentNavigation() != null) {
        this.textSearch = this.router.getCurrentNavigation().extras.state != null ?
          this.router.getCurrentNavigation().extras.state.textSearch : '';
        this.pageIndex = this.router.getCurrentNavigation().extras.state != null ?
          this.router.getCurrentNavigation().extras.state.pageIndex : 1;
        this.pageSize = this.router.getCurrentNavigation().extras.state != null ?
          this.router.getCurrentNavigation().extras.state.pageSize : 5;
      }
   }

  ngOnInit(): void {
    this.createForm();
    this.GetNotificationDetail();
  }

  createForm(): void{
    this.formulario = this.fb.group({
      n_expediente : [''],
      n_notifier_Area : [''],
      n_received_at : [''],
      n_read_at  : [''],
      n_message : ['']
    });
  }

  GetNotificationDetail = async () => {
    const token = await this.seguridadService.get();
    this.notiRequest.id = this.id;
    this.notiRequest.doc = token.doc;
    this.loading = true;


    this.notificationsservices.getNotificationDetail<any>(this.notiRequest)
    .subscribe(
      data => {
        if (!data.notification) {
          this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r => {
            this.router.navigate(['main']);
          });
        }
        if (data.notification.inbox_doc !== token.doc){
          this.router.navigate(['/']);
        }
        this.loading = false;
        if (data.success){
          this.loadNotificationData(data.notification);
          this.view2  = 'color_1 posDos';
          this.icon2  = 'check_circle';
        }
      });
  }

  loadNotificationData(noti: notification){
    this.formulario.get('n_expediente').setValue(noti.expedient);
    this.formulario.get('n_notifier_Area').setValue(noti.notifier_area);
    this.formulario.get('n_received_at').setValue(noti.received_at);
    this.formulario.get('n_read_at').setValue(noti.read_at);
    this.formulario.get('n_message').setValue(noti.message);
    this.urlAcuse = noti.acuse.url;
    this.adjuntos = noti.attachments;
    this.notifier_area = noti.notifier_area;
    this.notificationsservices.markNotificationsAsLoaded();
  }

  back() {
    this.notificationsservices.searchNotifications({textSearch: this.textSearch, pageIndex: this.pageIndex, pageSize: this.pageSize});
    this.router.navigate(['/main']);
  }

  viewDocument(item: any) {
    this.notificationsservices.getAttachment(item.url).subscribe(data => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.setAttribute('style', 'display:none');
      document.body.appendChild(a);
      a.href = url;
      a.download = item.name;
      a.click();
    });
  }

  downloadAcuse() {
    this.notificationsservices.getAttachment(this.urlAcuse).subscribe(data => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.setAttribute('style', 'display:none');
      document.body.appendChild(a);
      a.href = url;
      a.download = 'Acuse.pdf';
      a.click();
    });
  }

  getColor(nombre: string) {
    const letra = nombre.substring(-1, 1);
    if (letra === 'A' || letra === 'B' || letra === 'C') {
      return 'listCircle rdmColor_1';
    } else if (letra === 'D' || letra === 'E' || letra === 'F') {
      return 'listCircle rdmColor_2';
    } else if (letra === 'G' || letra === 'H' || letra === 'I') {
      return 'listCircle rdmColor_3';
    } else if (letra === 'J' || letra === 'K' || letra === 'L') {
      return 'listCircle rdmColor_4';
    } else if (letra === 'M' || letra === 'N' || letra === 'Ñ') {
      return 'listCircle rdmColor_5';
    } else if (letra === 'O' || letra === 'P' || letra === 'Q') {
      return 'listCircle rdmColor_6';
    } else if (letra === 'R' || letra === 'S' || letra === 'T') {
      return 'listCircle rdmColor_7';
    } else if (letra === 'U' || letra === 'V' || letra === 'W') {
      return 'listCircle rdmColor_8';
    } else if (letra === 'X' || letra === 'Y' || letra === 'Z') {
      return 'listCircle rdmColor_9';
    }
  }

  print() {
    let printContents = document.getElementById('imp1').innerHTML;
    document.getElementById('no-imp1').remove();
    const contenido = document.getElementById('imp1').innerHTML;
    const contenidoOriginal = document.body.innerHTML;
    document.body.innerHTML = contenido;
    window.print();
    document.body.innerHTML = contenidoOriginal;
    location.reload();
  }
   ngOnDestroy(): void {
  }
}
