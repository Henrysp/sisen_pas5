import {DatePipe} from '@angular/common';
import {AfterViewInit, Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatPaginatorIntl, PageEvent} from '@angular/material/paginator';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {UserData} from 'src/app/models/users/user-data';
import {UserRequest} from 'src/app/models/users/user-request';
import {SeguridadService} from 'src/app/services/seguridad.service';
import {UserService} from 'src/app/services/user.service';
import {Profile} from 'src/app/transversal/enums/global.enum';
import {FuncionesService} from 'src/app/utils/funciones.service';
import {NewUserComponent} from '../../user/new-user/new-user.component';
import {MatSelectionListChange} from '@angular/material/list';

interface Filtro {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  userRequest: UserRequest;
  userData: UserData;
  filterSelected = '0';
  textSearch = '';
  txtestado = 'PENDIENTE';
  txtestadoUser = '';
  txtprofile = '';
  txtfechaini = '';
  txtfechafin = '';
  ordenFec = 'asc';
  tamanoPaginado = 10;
  page = 1;
  listReadyCheck: boolean;
  pageEvent: PageEvent;
  toDay = new Date();
  dateMin = '';
  dateMax = '';
  subscription: Subscription;
  disableUsers: number[] = [];

  listEstados = [
    {name: '- TODOS -', value: ''},
    {name: 'APROBADO', value: 'APROBADO'},
    {name: 'DESAPROBADO', value: 'DESAPROBADO'},
    {name: 'DESHABILITADO', value: 'DESHABILITADO'},
    {name: 'REGISTRO INTERNO', value: 'REGISTRO INTERNO'},
    {name: 'PENDIENTE', value: 'PENDIENTE'}
  ];
  listEstadosUser = [
    {name: '- TODOS -', value: ''},
    {name: 'HABILITADO', value: 'HABILITADO'},
    {name: 'DESHABILITADO', value: 'DESHABILITADO'}
  ];
  lstProfile: any = [
    { profile: '', name: '- TODOS -'},
    { profile: 'admin', name: 'Administrador' },
    { profile: 'notifier', name: 'Notificador' },
    { profile: 'register', name: 'Operador de registro' },
    { profile: 'consult', name: 'Operador de consulta' },
    // { profile: 'evaluator', name: 'Evaluador' }
  ];

  constructor(
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private funcionesService: FuncionesService,
    private paginator: MatPaginatorIntl,
    private seguridadService: SeguridadService,
    public dialog: MatDialog,
    private datePipe: DatePipe
  ) {
    this.userData = new UserData();
    this.paginator.itemsPerPageLabel = 'Registros por página';
    this.paginator.nextPageLabel = 'Página siguiente';
    this.paginator.previousPageLabel = 'Página anterior';
    this.paginator.getRangeLabel = this.rangoPaginacion;
    this.dateMin = this.datePipe.transform(new Date('2021-03-28 00:00:00'), 'yyyy-MM-dd');
    this.dateMax = this.datePipe.transform(this.toDay, 'yyyy-MM-dd');
    this.ordenFec = this.esVentanadeCasillas ? this.ordenFec : 'desc';
  }

  ngOnInit(): void {
    this.getQueryParams();
  }

  getQueryParams() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params.ordenFec){
        this.textSearch = params.textSearch;
        this.tamanoPaginado = Number(params.tamanoPaginado);
        this.page = Number(params.page);
        this.txtestado = params.txtestado;
        this.txtestadoUser = params.txtestado;
        if (!this.esVentanadeCasillas){ this.txtprofile = params.txtprofile; }
        this.txtfechaini = params.txtfechaini;
        this.txtfechafin = params.txtfechafin;
        this.ordenFec = params.ordenFec;

        this.loadUsers(
          params.textSearch,
          this.page,
          this.tamanoPaginado,
          params.txtestado,
          params.txtprofile,
          params.txtfechaini,
          params.txtfechafin,
          params.ordenFec
        );
      }else{
        if (params && params.page){
          this.page = Number(params.page);
          this.tamanoPaginado = Number(params.tamanoPaginado);
        }
        if ( this.esVentanadeCasillas){
          this.loadUsers('', this.page, this.tamanoPaginado, 'PENDIENTE', '', '', '', 'asc');
        }else {
          this.loadUsers('', this.page, this.tamanoPaginado, '', '', '', '', 'desc');
        }
      }
    });
  }
  addParams() {
    const params = {
      textSearch: this.textSearch ? this.textSearch : '',
      tamanoPaginado: this.tamanoPaginado,
      page: 1,
      txtestado: this.esVentanadeCasillas ? this.txtestado : this.txtestadoUser,
      txtprofile: !this.esVentanadeCasillas ? this.txtprofile : null,
      txtfechaini: this.txtfechaini,
      txtfechafin: this.txtfechafin,
      ordenFec: this.ordenFec,
    };
    this.route.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
    if (this.esVentanadeCasillas){
      this.loadUsers(this.textSearch, 1, this.tamanoPaginado, this.txtestado, '', this.txtfechaini, this.txtfechafin, this.ordenFec);
    } else{
      this.loadUsers(this.textSearch, 1, this.tamanoPaginado, this.txtestadoUser, this.txtprofile, this.txtfechaini, this.txtfechafin, this.ordenFec);
    }
  }
  loadUsers(uerySearch: string, page?: number, pageSize?: number, estado ?: string,
            profile ?: string, fechaini ?: string , fechafin ?: string, ordenFec ?: string) {
    this.funcionesService.showloading('Procesando', 'Buscando');
    this.listReadyCheck = false;
    this.userRequest = new UserRequest();
    this.userRequest.search = uerySearch;
    this.userRequest.page = page;
    this.userRequest.count = pageSize;
    this.userRequest.estado = estado;
    if (!this.esVentanadeCasillas){this.userRequest.profile = profile; }
    this.userRequest.fechaInicio = fechaini;
    this.userRequest.fechaFin = fechafin;
    this.userRequest.ordenFec = ordenFec;
    const promesa = this.esAdministrador && !this.esVentanadeCasillas ? this.userService.ListUsers(this.userRequest) :
      this.userService.GetUsers(this.userRequest);
    promesa.subscribe(
        (res) => {
          if (res.success) {
            this.listReadyCheck = true;
            this.userData = res;
            if (this.esVentanadeCasillas){
              this.userData.Items.map(res => {
                if (res.estate_inbox === '' || res.estate_inbox === undefined) {
                  res.estate_inbox = 'Registro interno';
                } else if (res.estate_inbox === '1') {
                  res.estate_inbox = 'DESHABILITADO ';
                }
              });
            }else{
              this.userData.Items.map(res => {
                switch (res.profile) {
                  case 'admin':
                    res.profile = 'Administrador ';
                    break;
                  case 'register':
                    res.profile = 'Operador de registro ';
                    break;
                  case 'notifier':
                    res.profile = 'Notificador ';
                    break;
                  case 'consult':
                    res.profile = 'Operador de consulta';
                    break;
                }
                });
            }
          }
          this.funcionesService.closeloading();
        },
        (err) => {
          this.funcionesService.closeloading();
          this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r =>{
            this.route.navigate(['main/list-boxes']);
          });
          console.log('Problemas del servicio', err);
        }
      );
  }
  searchByQuery() {
    this.addParams();
  }
  deleteUser(user: any) {
    this.funcionesService
      .mensajeConfirmar('¿Desea eliminar el registro?')
      .then((resp) => {
        this.userService.delete(user.doc_type, user.doc).subscribe((res) => {
          if (res.success) {
            this.funcionesService.mensajeOk('Registro eliminado correctamente');

            this.loadUsers(
              this.textSearch,
              this.pageEvent?.pageIndex || 1,
              this.pageEvent?.pageSize || 5
            );
          } else {
            this.funcionesService.mensajeError(
              'No se pudo eliminar el registro'
            );
          }
        });
      })
      .catch((err) => {});
  }
  get esVentanadeCasillas() {
    return this.route.url.toString().indexOf('list-boxes') !== -1;
  }
  get esAdministrador() {
    const typeProfile = this.seguridadService.getUserProfile();
    return typeProfile === Profile.Administrador;
  }

  get esEvaluador() {
    const typeProfile = this.seguridadService.getUserProfile();
    return typeProfile === Profile.Evaluator;
  }
  get esRegistrador() {
    const typeProfile = this.seguridadService.getUserProfile();
    return typeProfile === Profile.RegistryOperator;
  }

  get esConsultor() {
    const typeProfile = this.seguridadService.getUserProfile();
    return typeProfile === Profile.QueryOperator;
  }

  getColor(name: string) {
    return this.funcionesService.colorLetter(name);
  }

  redirectDetail(user){
    let param = 1; if (user.doc_type === 'ruc' || user.doc_type === 'pr'){param = 2; }
    this.route.navigate(['/main/operador/solicitud-detalle/', user.id, param, 'valid']);
  }

  redirectDetailRegCasilla(user){
    const action = 'view';
    if (user.doc_type === 'ruc' || user.doc_type === 'pr'){
      this.route.navigate(['/main/operador/solicitud-detalle-pj', user.id, action]);
    } else {
     this.route.navigate(['/main/operador/solicitud-detalle/', user.id, user.doc_type , action]);
    }
  }

  pageChangeEvent(event) {
    this.tamanoPaginado = event.pageSize;
    this.page = event.pageIndex + 1;
    this.route.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { tamanoPaginado: event.pageSize, page: event.pageIndex + 1},
      queryParamsHandling: 'merge',
    });
    if (this.esVentanadeCasillas){
      this.loadUsers(this.textSearch, this.page, this.tamanoPaginado, this.txtestado, '', this.txtfechaini, this.txtfechafin, this.ordenFec);
    } else{
      this.loadUsers(this.textSearch, this.page, this.tamanoPaginado, this.txtestadoUser, this.txtprofile, this.txtfechaini, this.txtfechafin, this.ordenFec);
    }
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
    const endIndex =
      startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize;

    return `${startIndex + 1} - ${endIndex} de ${length}`;
  }

  newUser() {
    if (this.esVentanadeCasillas) {
      this.route.navigate(['/main/operador/nueva-casilla']);
    } else {
      // this.route.navigate(['main/operador/nuevo-usuario']);
      const component = this.dialog.open(NewUserComponent, {
        disableClose: true,
      });

      component.afterClosed().subscribe(resp => {
        if (resp) {
          this.getQueryParams();
        }
      });
    }
  }

async  editUser(user) {
   const promesa = this.userService.getUserID(user.id).subscribe((res) => {
     if (res.success) {
       const component = this.dialog.open(NewUserComponent, {
         disableClose: true,
         data: res.user,
       });
       component.afterClosed().subscribe(resp => {
         if (resp) {
           this.funcionesService.mensajeOk('El registro fue actualizado correctamente');
           this.loadUsers(this.textSearch, this.pageEvent?.pageIndex || 1, this.pageEvent?.pageSize || this.tamanoPaginado, this.txtestado, this.txtfechaini, this.txtfechafin, this.ordenFec);
         }
       });
     } else{
       this.funcionesService.mensajeError('No se pudo obtener datos del usuario');
     }
   });
  }

  async editCasilla(user) {
    const type = user.doc_type;
    if (type === 'ruc' || type === 'pr'){
      this.route.navigate(['/main/user/edit/pj/', user.id]);
    }else{
      this.route.navigate(['/main/user/edit/pn/', user.id]);
    }
  }

  handleVerCasilla(user){
    const type = user.doc_type;
    if (type === 'ruc' || type === 'pr'){
      this.route.navigate(['/main/user/view/pj/', user.id]);
    }else{
      this.route.navigate(['/main/user/view/pn/', user.id]);
    }
  }

  cleanSearch(){
    if (this.esVentanadeCasillas){
      this.loadUsers('', 1, this.tamanoPaginado, 'PENDIENTE', '', '', '', 'asc');
    }else{
      this.loadUsers('', 1, this.tamanoPaginado, '', '', '', '', 'desc');
    }
    this.cleanInputs();
    this.addParams();
  }

  cleanInputs(){
    if (this.esVentanadeCasillas){
      this.textSearch = '';
      this.txtestado = 'PENDIENTE';
      this.txtfechaini = '';
      this.txtfechafin = '';
      this.ordenFec = 'asc';
    } else {
      this.textSearch = '';
      this.txtestadoUser = '';
      this.txtprofile = '';
      this.txtfechaini = '';
      this.txtfechafin = '';
      this.ordenFec = 'desc';
    }
  }
  disableUser(user: any) {
    this.funcionesService
      .mensajeConfirmarInput( 'En caso de ser necesario, ingrese el motivo:', '¿Estás seguro de deshabilitar este usuario?', 'Deshabilitar')
      .then((motivo: string) => {
        this.userService.userDisable(user.id, motivo).subscribe((res) => {
          if (res.success) {
            this.funcionesService.mensajeOk('Usuario deshabilitado correctamente').then(() => {
              this.searchByQuery();
            });
          } else {
            this.funcionesService.mensajeError(res.error).then(r => {});
          }
        });
      })
      .catch((err) => {});
  }
  enableUser(user: any) {
    this.funcionesService
      .mensajeConfirmarInput('En caso de ser necesario, ingrese el motivo:', '¿Estás seguro de habilitar este usuario?', 'Habilitar')
      .then((motivo: string) => {
        this.userService.userEnable(user.id, motivo).subscribe((res) => {
          if (res.success) {
            this.funcionesService.mensajeOk('Usuario habilitado correctamente').then(() => {
              this.searchByQuery();
            });
          } else {
            this.funcionesService.mensajeError(res.error).then(r => {});
          }
        });
      })
      .catch((err) => {});
  }
  addDisableUsers(event: MatSelectionListChange): void {
    if (event.option.value.status !== 'DESHABILITADO'){
      this.disableUsers = event.source.selectedOptions.selected.map(option => option.value.id);
    } else{
      this.funcionesService.mensajeError('No puede deshabilitarse este usuario');
    }
  }
}
