import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { mainModule } from 'process';
import { LoginComponent } from './pages/login/login.component';
import { NuevaConstrasenaComponent } from './pages/nueva-constrasena/nueva-constrasena.component';
import { MainComponent } from './pages/main/main.component';
import { RandompagesComponent } from './pages/randompages/randompages.component';
import { NotificacionesElectronicasComponent } from './pages/main/notificaciones-electronicas/notificaciones-electronicas.component';
import { NuevaNotificacionComponent } from './pages/main/nueva-notificacion/nueva-notificacion.component';
import { NotificacionAdjuntosComponent } from './pages/main/notificacion-adjuntos/notificacion-adjuntos.component';
import { NotificacionesElectronicasDetalleComponent } from './pages/main/notificaciones-electronicas-detalle/notificaciones-electronicas-detalle.component';
import { AuthGuard } from './Utils/auth-guard';
import { RecoveryPasswordComponent } from './pages/recovery-password/recovery-password.component';
import { AuthGuardTemp } from './Utils/auth-temp';
import { ValidaContraseñaComponent } from './pages/valida-contraseña/valida-contraseña.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'nueva-contrasena',
    canActivate: [AuthGuardTemp],
    component: NuevaConstrasenaComponent,
  },
  { path: 'recuperar-contrasena', component: RecoveryPasswordComponent },
  { path: 'valida-contrasena/:id/:doc', component: ValidaContraseñaComponent },
  {
    path: 'main',
    component: MainComponent,
    children: [
      {
        path: '',
        component: NotificacionesElectronicasComponent,
        canActivate: [AuthGuard],
        pathMatch: 'full',
      },
      {
        path: 'randompages',
        component: RandompagesComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'notificaciones-electronicas',
        component: NotificacionesElectronicasComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'nueva-notificacion',
        component: NuevaNotificacionComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'notificacion-adjuntos',
        component: NotificacionAdjuntosComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'notificaciones-electronicas-detalle/:id',
        component: NotificacionesElectronicasDetalleComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'main', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
