import { Component, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { notificationsRespone } from 'src/app/models/notifications/notifications';
import { notificationsRequest } from 'src/app/models/notifications/notifications-request';
import { NotificationlistServicesService } from 'src/app/services/notificationlist-services.service';
import { Router } from '@angular/router';
import { FuncionesService } from 'src/app/services/funciones.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

interface Filtro {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-notificaciones-electronicas',
  templateUrl: './notificaciones-electronicas.component.html',
  styleUrls: ['./notificaciones-electronicas.component.scss'],
})
export class NotificacionesElectronicasComponent implements OnInit {
  notificationRespone: notificationsRespone = new notificationsRespone();
  notificationRequest: notificationsRequest = new notificationsRequest();
  listReadyCheck: boolean;
  mensaje: string;
  //textSearch: string;

  pageIndex: number;
  pageSize: number;

  maxTam: number = 100;
  //filterSelected: string = '0';

  subscriptionSearch: Subscription;

  @ViewChild('paginator') initPage: MatPaginator;

  formSearch: FormGroup;
  textSearch: FormControl = new FormControl('', [Validators.maxLength(this.maxTam)]);
  filterSelected: FormControl = new FormControl('0');

  constructor(
    private buider: FormBuilder,
    private funcionesService: FuncionesService,
    private notificationsservices: NotificationlistServicesService,
    private router: Router,
    private paginator: MatPaginatorIntl,
  ) {
    this.pageIndex = 1;
    this.pageSize = 5;
    this.paginator.itemsPerPageLabel = 'Registros por página';
    this.paginator.nextPageLabel = 'Siguiente pagina';
    this.paginator.previousPageLabel = 'Pagina anterior';
    this.paginator.getRangeLabel = this.rangoPaginacion;
  }

  ngOnInit(): void {
    this.formSearch = this.buider.group({
      'textSearch': this.textSearch,
      'filterSelected': this.filterSelected,
    });
    this.textSearch.setValue('');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {

      this.subscriptionSearch = this.notificationsservices.fieldsSearch.subscribe(value => {
        if(value != null) {
          this.textSearch.setValue(value.textSearch);
          this.filterSelected.setValue('0');
          this.pageIndex = value.pageIndex;
          this.pageSize = value.pageSize;
          if(this.pageIndex == 1 && this.pageSize == 5) {
            this.resetValores();
          }
          else {
            this.initPage.pageIndex = this.pageIndex - 1;
            this.initPage.pageSize = this.pageSize;
          }
          this.GetNotificationList(value.textSearch, '', this.pageIndex, this.pageSize);
        } else {
          this.resetValores();
          this.GetNotificationList('', '', this.pageIndex, this.pageSize);
        }
      });
    });
  }

  filtros: Filtro[] = [
    { value: '0', viewValue: 'Todos' },
    { value: '1', viewValue: 'Recibido' },
    { value: '2', viewValue: 'No recibido' },
  ];

  GetNotificationList(
    querySearch: string,
    filter: string,
    page: number,
    pagesize: number,
    // filterselected: string,
  ) {
    this.listReadyCheck = false;
    this.notificationRequest.search = querySearch;
    this.notificationRequest.filter = filter;
    this.notificationRequest.page = page;
    this.notificationRequest.count = pagesize;
    // this.notificationRequest.filter = filterselected;

    this.notificationsservices
      .getNotificationList<any>(this.notificationRequest)
      .subscribe(
        (data) => {
          if (data.success) {
            this.listReadyCheck = true;
            this.notificationRespone = data;
          } else {
            this.mensaje = data.error.message;

            this.funcionesService.mensajeError(this.mensaje);
          }
        },
        (error) => {
          this.funcionesService.mensajeError('Problemas en el servicio.');
        }
      );
  }

  goNotificationDetail(item: any) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigate(['/main/notificaciones-electronicas-detalle/' + item],
      {state: {textSearch: this.textSearch.value, pageIndex: this.pageIndex, pageSize: this.pageSize}});
  }

  onOptionsSelected() {
    this.GetNotificationList(
      this.textSearch.value,
      this.filterSelected.value,
      this.pageIndex = 1,
      this.pageSize,
    );
    this.pageIndex = 1;
  }

  getColor(nombre: string) {
    var letra = nombre.substring(-1, 1);
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

  pageChangeEvent(event) {
    this.pageIndex = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.GetNotificationList(
      this.textSearch.value,
      this.filterSelected.value,
      this.pageIndex,
      this.pageSize
    );
  }

  searchByQuery() {
    this.resetValores();
    this.GetNotificationList(
      this.textSearch.value,
      this.filterSelected.value,
      this.pageIndex,
      this.pageSize
    );
    this.resetValores();
  }

  resetValores() {
    this.pageIndex = 1;
    this.pageSize = 5;
    this.filterSelected.setValue('0');
  }

  private rangoPaginacion = (
    page: number,
    pageSize: number,
    length: number
  ) => {
    if (length == 0 || pageSize == 0) {
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
  };

  ngOnDestroy(): void {
    this.subscriptionSearch.unsubscribe();
  }

}
