import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { DeshabilitarService } from 'src/app/services/deshabilitar.service';
import { FuncionesService } from 'src/app/utils/funciones.service';
import {UserRequest} from '../../../../models/users/user-request';
import {UserService} from '../../../../services/user.service';
import {Profile} from '../../../../transversal/enums/global.enum';
import {ActivatedRoute, Router} from '@angular/router';
import {SeguridadService} from '../../../../services/seguridad.service';
import {UserData} from '../../../../models/users/user-data';
import {error} from "protractor";

@Component({
  selector: 'app-consultar',
  templateUrl: './consultar.component.html',
  styleUrls: ['./consultar.component.scss']
})
export class ConsultarComponent implements OnInit {
  data: Data;
  pageEvent: PageEvent;
  textSearch = '';
  isLoading = false;
  userRequest: UserRequest;
  listReadyCheck: boolean;
  userData: UserData;
  estado: '';
  page = 1;
  motivo = 'otros';
  envio = false;

  constructor(private catalogService: DeshabilitarService,
              private funcionesService: FuncionesService,
              public dialog: MatDialog,
              private userService: UserService,
              private route: Router,
              private seguridadService: SeguridadService,
  ) { }

  ngOnInit(): void {
    this.data = new Data();
    // this.loadUsers('', 1, 5, '');
  }
  loadUsers(uerySearch: string, page?: number, pageSize?: number, estado ?: string) {
    this.funcionesService.showloading('Procesando', 'Buscando');
    this.listReadyCheck = false;
    this.isLoading = false;
    this.userRequest = new UserRequest();
    this.userRequest.search = uerySearch;
    this.userRequest.page = page;
    this.userRequest.count = pageSize;
    this.esAdministrador ? this.userRequest.estado = 'admin' : this.userRequest.estado = 'notificador';
    const promesa = this.userService.GetUsers(this.userRequest);
    promesa.subscribe(
      (res) => {
        if (res.success) {
          this.envio = true;
          this.listReadyCheck = true;
          this.userData = res;

          this.userData.Items.map(res => {
            if (res.estate_inbox === '' || res.estate_inbox === undefined){
              res.estate_inbox = 'Registro interno';
            }else if (res.estate_inbox === '1'){
              res.estate_inbox = 'DESHABILITADO ';
            }
          });
        }
        this.funcionesService.closeloading();
      },
      (err) => {
        this.funcionesService.closeloading();
        console.log('Problemas del servicio', err);
      }
    );
  }
  get esVentanadeCasillas() {
    return this.route.url.toString().indexOf('list-boxes') !== -1;
  }
  get esAdministrador() {
    const typeProfile = this.seguridadService.getUserProfile();
    return typeProfile === Profile.Administrador;
  }
  get esNotificador() {
    const typeProfile = this.seguridadService.getUserProfile();
    return typeProfile === Profile.Notifier;
  }
  get esSuperAdmin() {
    const typeAdmin = this.seguridadService.getIsSuperAdmin();
    return typeAdmin === true;
  }
  disableInbox(user: any) {
    this.funcionesService
      .mensajeConfirmarInput('En caso de ser necesario, ingrese el motivo:', '¿Estás seguro de deshabilitar la casilla?', 'Deshabilitar casilla')
      .then((motivo: string) => {
        this.userService.inboxStatusChange(user.id, motivo, 'disable').subscribe((res) => {
          if (res.success) {
            this.funcionesService.mensajeOk('Casilla deshabilitada correctamente').then(() => {
              this.searchByQuery();
            });
          } else {
            this.funcionesService.mensajeError(res.error ? res.error : 'No se pudo deshabilitar la casilla');
          }
        });
      })
      .catch((err) => {});
  }
  enableInbox(user: any) {
    this.funcionesService
      .mensajeConfirmarInput('En caso de ser necesario, ingrese el motivo:', '¿Estás seguro de habilitar la casilla?', 'Habilitar casilla')
      .then((motivo: string) => {
        this.userService.inboxStatusChange(user.id, motivo, 'enable').subscribe((res) => {
          if (res.success) {
            this.funcionesService.mensajeOk('Casilla habilitada correctamente').then(() => {
              this.searchByQuery();
            });
          } else {
            this.funcionesService.mensajeError(res.error ? res.error : 'No se pudo habilitar la casilla');
          }
        });
      })
      .catch((err) => {});
  }
  searchByQuery() {
    if (this.textSearch !== ''){
      this.loadUsers(this.textSearch, 1, 10, '');
    }
  }
  getColor(name: string) {
    return this.funcionesService.colorLetter(name);
  }
  handleVerCasilla(user){
       const type = user.doc_type;
       if (type === 'ruc' || type === 'pr'){
      this.route.navigate(['/main/user/view/pj/', user.id]);
    }else{
      this.route.navigate(['/main/user/view/pn/', user.id]);
    }
  }
  redirectDetailRegCasilla(user){
    const action = 'view';
    if (user.doc_type === 'ruc' || user.doc_type === 'pr'){
      this.route.navigate(['/main/operador/solicitud-detalle-pj', user.id, action]);
    } else {
      // this.route.navigate(['/main/operador/solicitud-detalle-valid',user.id]);
      this.route.navigate(['/main/operador/solicitud-detalle/', user.id, user.doc_type , action]);
    }
  }
  pageChangeEvent(event) {
    this.loadUsers(this.textSearch, event.pageIndex + 1, event.pageSize);
  }
  cleanSearch(){
    this.textSearch = '';
    this.envio = false;
  }
}

export class Data {
  success: boolean;
  recordsTotal: number;
  page: number;
  count: number;
  items: [];
}
