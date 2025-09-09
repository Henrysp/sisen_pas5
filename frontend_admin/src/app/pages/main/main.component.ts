import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { SeguridadService } from 'src/app/services/seguridad.service';
import { UserService } from 'src/app/services/user.service';
import { Profile } from 'src/app/transversal/enums/global.enum';
import { FuncionesService } from 'src/app/utils/funciones.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  panelOpenState = false;
  typeProfile: string;
  sidebar: string;
  jobAreaName: string;
  labelProfile: string;
  userName: string;
  letterInitial: string;
  isSuperAdmin = false;
  constructor(
    private router: Router,
    private seguridadService: SeguridadService,
    private funcionesService: FuncionesService,
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.validateProfile();
    this.getUserName();
    this.getAreaUser();
  }

  linkRedirect(section: any) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigate(['/main/' + section]);
  }

  refreshNotifications() {
    this.notificationService.searchNotifications({textSearch: '', pageIndex: 1, pageSize: 5});
    this.linkRedirect('notificaciones');
  }
  refreshUsuarios(){
    this.userService.searchListuser(
      {search: '', filter : '', page: 1, count: 5, estado: 'PENDIENTE', fechaInicio: '', fechaFin: '', ordenFec: 'desc'});
    this.linkRedirect('admin/usuarios');
  }

  refreshCasilla(){
    this.userService.searchListuser(
      {search: '', filter : '', page: 1, count: 5, estado: 'PENDIENTE', fechaInicio: '', fechaFin: '', ordenFec: 'desc'});
    this.linkRedirect('list-boxes');
  }


  validateProfile() {
    if (this.seguridadService.getUserProfile() !== '') {
      this.typeProfile = this.seguridadService.getUserProfile();
      this.isSuperAdmin = this.seguridadService.getIsSuperAdmin();
      if (this.typeProfile === Profile.Administrador) {
        this.sidebar = Profile.Administrador;
        this.labelProfile = 'Administrador';
      } else if (this.typeProfile === Profile.Notifier) {
        this.sidebar = Profile.Notifier;
        this.labelProfile = 'Notificador';
      } else if (this.typeProfile === Profile.Evaluator) {
        this.sidebar = Profile.Evaluator;
        this.labelProfile = 'Evaluador';
      }else if (this.typeProfile === Profile.RegistryOperator) {
        this.sidebar = Profile.RegistryOperator;
        this.labelProfile = 'Operador de registro';
      } else {
        this.sidebar = Profile.QueryOperator;
        this.labelProfile = 'Operador de consulta';
      }
    } else {
      this.funcionesService.mensajeError(
        'El usuario no tiene un perfil, por favor vuelva autenticarse'
      );
      this.router.navigate(['/login']);
    }
  }

  getUserName() {
    const name = this.seguridadService.getUserName();
    const lastName = this.seguridadService.getUserLastName() || this.seguridadService.getUserSecondLastName();
    const firstName = name.split(' ');
    const surname = lastName.split(' ');
    this.userName = this.capitalize(firstName[0]) + ' ' + this.capitalize(surname[0]) + ' ' + this.capitalize(surname[1]);
    this.letterInitial = name.charAt(0) + lastName.charAt(0);
  }

  getAreaUser() {
    this.jobAreaName = this.seguridadService.getJobAreaName();
  }

  capitalize = (s) => {
    if (typeof s !== 'string') { return ''; }
    return s[0].toUpperCase() + s.slice(1).toLowerCase();
  }
}
