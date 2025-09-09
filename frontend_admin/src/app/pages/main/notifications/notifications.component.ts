import { Filters } from './../../../models/notifications/notification';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NotificationData } from 'src/app/models/notifications/notification-data';
import { NotificationRequest } from 'src/app/models/notifications/notification-request';
import { notificationRequest} from 'src/app/models/notifications/notification';
import { NotificationService } from 'src/app/services/notification.service';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notificationRequest: NotificationRequest = new NotificationRequest();
  notiRequest: notificationRequest = new notificationRequest();
  notificationData: any = {};
  listReadyCheck: boolean;
  textSearch: string = '';
  filterSelected: string = '0';
  subscription: Subscription;
  recibido: number;
  noRecibido: number;
  total: number;
  vencido: number;
  intervalo: any;

  mensaje: string;
  pageIndex: number = 1;
  pageSize: number = 5;
  loading: boolean = true;

  constructor(
    private route: Router,
    private funcionesService: FuncionesService,
    private paginator: MatPaginatorIntl,
    private notificationService: NotificationService,
  ) {
    this.paginator.itemsPerPageLabel = 'Registros por página';
    this.paginator.nextPageLabel = 'Página siguiente';
    this.paginator.previousPageLabel = 'Página anterior';
    this.paginator.getRangeLabel = this.rangoPaginacion;
  }

  filters: Filters[] = [
    { id: '0', value: 'Todos' },
    { id: '1', value: 'Recibido' },
    { id: '2', value: 'No Recibido' },
    { id: '3', value: 'Depositado' },
    { id: '4', value: 'No Depositado' },
    { id: '5', value: 'Vencido' },
    { id: '6', value: 'No Vencido' },
  ];

  ngOnInit(): void {
    // this.intervalo = setInterval(() => {
      this.loadData(this.textSearch, this.pageIndex, this.pageSize);
      this.cargarLengenda();
    // }, 10000);
  }

  search() {
    this.loading = true;
    this.pageIndex = 1;
    this.pageSize = 5;
    this.loadData(this.textSearch, 1, 5);
  }

  loadData = async (querySearch: string, page?: number, pageSize?: number) => {
    this.notificationRequest.search = querySearch;
    this.notificationRequest.filter = this.filterSelected.toString();
    this.notificationRequest.page = page;
    this.notificationRequest.count = pageSize;
    this.listReadyCheck = false;
    this.notificationData = await this.notificationService.GetNotifications<any>(this.notificationRequest).toPromise();
    this.listReadyCheck = true;
    this.loading = false;
  }

  cargarLengenda = async () => {
    let legend = await this.notificationService.getLenged().toPromise();
    this.recibido = legend.recibido;
    this.noRecibido = legend.noRecibido;
    this.total = legend.total;
    this.vencido = legend.vencido;
  }

  goNotificationDetail(item: any) {
    if (sessionStorage.getItem("downloadFile") !== "1") {
      this.route.routeReuseStrategy.shouldReuseRoute = () => false;
      this.route.navigate(['/main/notificaciones-detalle/' + item], { state: { textSearch: this.textSearch, pageIndex: this.pageIndex, pageSize: this.pageSize } });
    }
    sessionStorage.removeItem("downloadFile");
  }

  getColor(name: string) {
    return this.funcionesService.colorLetter(name);
  }

  downloadAcuse(idNotificacion: string, doc: string) {
    let token = sessionStorage.getItem("accessToken");
    this.notificationService.downloadAcuse(token, idNotificacion).subscribe(data => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.setAttribute('style', 'display:none');
      document.body.appendChild(a);
      a.href = url;
      a.download = "Constancia_de_notificacion_" + doc + ".pdf";
      a.click();
    });
    sessionStorage.setItem("downloadFile", "1");
  }

  downloadAcuseRecibido(idNotificacion: string, doc: string, read_at_formatted: string) {
    if (read_at_formatted !== "") {
      let token = sessionStorage.getItem("accessToken");
      this.notificationService.downloadAcuseRecibo(token, idNotificacion).subscribe(data => {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.setAttribute('style', 'display:none');
        document.body.appendChild(a);
        a.href = url;
        a.download = "Acuse_Recibido_" + doc + ".pdf";
        a.click();
      });
    }
    sessionStorage.setItem("downloadFile", "1");
  }

  pageChangeEvent(event) {
    this.pageIndex = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData(this.textSearch, event.pageIndex + 1 , event.pageSize);
  }

  ngOnDestroy() {
    // clearInterval(this.intervalo);
  }
  private rangoPaginacion = (
    page: number,
    pageSize: number,
    length: number
  ) => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex =
      startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize;

    return `${startIndex + 1} - ${endIndex} de ${length}`;
  }
}
