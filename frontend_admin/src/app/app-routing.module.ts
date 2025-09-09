import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './utils/auth-guard';
import { AuthGuardTemp } from './utils/auth-temp';
import { NewNotificationComponent } from './pages/main/new-notification/new-notification.component';

import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { MainComponent } from './pages/main/main.component';
import { RandompagesComponent } from './pages/randompages/randompages.component';
import { NotificationsComponent } from './pages/main/notifications/notifications.component';
import { OperadorComponent } from './pages/main/operador/operador.component';
import { UsersComponent } from './pages/main/operador/users/users.component';
import { NewBoxComponent } from './pages/main/operador/new-box/new-box.component';
import { RecoveryPasswordComponent } from './pages/recovery-password/recovery-password.component';
import { NotificationDetalleComponent } from './pages/main/notification-detalle/notification-detalle.component';
import { ViewBoxComponent } from './pages/main/operador/view-box/view-box.component';
import { AdminComponent } from './pages/main/admin/admin.component';
import { ColeccionesComponent } from './pages/main/admin/colecciones/colecciones.component';
import { CatalogComponent } from './pages/main/admin/catalog/catalog/catalog.component';
import { SolicitudDetailComponent } from './pages/main/operador/solicitud-detail/solicitud-detail.component';
import { SolicitudDetailValidComponent } from './pages/main/operador/solicitud-detail-valid/solicitud-detail-valid.component';
import { ReportesComponent } from './pages/main/operador/reportes/reportes.component';
import { EditBoxComponent } from './pages/main/operador/edit-box/edit-box.component';
import { EditUserComponent } from './pages/main/admin/user/edit-user/edit-user.component';
import { EditCitizenComponent } from './pages/main/admin/user/edit-citizen/edit-citizen.component';
import { EditOrgComponent } from './pages/main/admin/user/edit-org/edit-org.component';
import { SolicitudDetailPjComponent } from './pages/main/operador/solicitud-detail-pj/solicitud-detail-pj.component';
import { EditUser1Component } from './pages/main/user/edit-user1/edit-user1.component';
import { UserComponent } from './pages/main/user/user.component';
import { AddRepresentativeComponent } from './pages/main/user/add-representative/add-representative.component';
import { PersonComponent } from './pages/main/admin/person/person.component';
import { CalendarComponent } from './pages/main/admin/calendar/calendar/calendar.component';
import { NewCalendarComponent } from './pages/main/admin/calendar/new-calendar/new-calendar.component';
import { ViewCalendarComponent } from './pages/main/admin/calendar/view-calendar/view-calendar.component';
import {AddOfficialComponent} from './pages/main/user/add-official/add-official.component';
import { ConsultarComponent } from './pages/main/admin/consultar/consultar.component';
import {DisableUsersComponent} from './pages/main/admin/disable-users/disable-users.component';
import { ForbiddenComponent } from './error-pages/forbidden/forbidden.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'acceso-prohibido', component: ForbiddenComponent },
  {
    path: 'nueva-contrasena',
    canActivate: [AuthGuardTemp],
    component: NewPasswordComponent,
  },
  { path: 'recuperar-contrasena', component: RecoveryPasswordComponent },
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: 'main/admin',
        component: AdminComponent,
        canActivate: [AuthGuard],
        pathMatch: 'full',
      },
      {
        path: 'main/admin',
        component: AdminComponent,
        children: [
          {
            path: 'collections',
            component: ColeccionesComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'usuarios',
            component: UsersComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'catalog',
            component: CatalogComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'consultar',
            component: ConsultarComponent,
            canActivate: [AuthGuard],
          },
          // {
          //   path: 'gest-usuarios',
          //   component: UsuariosComponent,
          //   canActivate: [AuthGuard],
          // },
          {
            path: 'gestionar-usuario',
            component: EditUserComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'gestionar-casilla-ciudadano',
            component: EditCitizenComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'gestionar-casilla-org',
            component: EditOrgComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'person',
            component: PersonComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'calendar',
            component: CalendarComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'new-calendar',
            component: NewCalendarComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'disable-users',
            component: DisableUsersComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'view-calendar',
            component: ViewCalendarComponent,
            canActivate: [AuthGuard],
          },
        ],
      },
      {
        path: '',
        component: RandompagesComponent,
        canActivate: [AuthGuard],
        pathMatch: 'full',
      },
      {
        path: 'main/randompages',
        component: RandompagesComponent,
        canActivate: [AuthGuard],
        pathMatch: 'full',
      },
      {
        path: 'main/notificaciones',
        component: NotificationsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'main/nueva-notificacion',
        component: NewNotificationComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'main/notificaciones-detalle/:id',
        component: NotificationDetalleComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'main/list-boxes',
        component: UsersComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'main/user',
        component: UserComponent,
        children: [
          {
            path: 'edit/:type/:id',
            component: EditUser1Component,
            canActivate: [AuthGuard],
          },
          {
            path: 'view/:type/:id',
            component: EditUser1Component,
            canActivate: [AuthGuard],
          },
          {
            path: 'edit/:type/:id/representante',
            component: AddRepresentativeComponent,
            canActivate: [AuthGuard]
          } ,
          {
            path: 'edit/:type/:id/official',
            component: AddOfficialComponent,
            canActivate: [AuthGuard]
          }
        ]
      },
      // {
      //   path: 'main/list-boxes/detalle/:id',
      //   component: EditUser1Component,
      //   canActivate: [AuthGuard],
      // },
      {
        path: 'main/list-boxes/nuevo-representante',
        component: EditUser1Component,
        canActivate: [AuthGuard],
      },
      {
        path: 'main/view-box/:id',
        component: ViewBoxComponent,
        canActivate: [AuthGuard],
      },

      {
        path: 'main/operador',
        component: OperadorComponent,
        children: [
          {
            path: 'usuarios',
            component: UsersComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'nueva-casilla',
            component: NewBoxComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'solicitud-detalle/:id/:type/:action',
            component: SolicitudDetailComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'solicitud-detalle-pj/:id/:action',
            component: SolicitudDetailPjComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'solicitud-detalle-valid/:id',
            component: SolicitudDetailValidComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'editar-casilla',
            component: EditBoxComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'operador-reportes',
            component: ReportesComponent,
            canActivate: [AuthGuard],
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule { }
