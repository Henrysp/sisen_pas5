import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from './material/material.module';
import { LoginComponent } from './pages/login/login.component';
import { MainComponent } from './pages/main/main.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { RandompagesComponent } from './pages/randompages/randompages.component';
import { NotificationsComponent } from './pages/main/notifications/notifications.component';
import { NewNotificationComponent } from './pages/main/new-notification/new-notification.component';
import { JwtInterceptor } from './utils/jwt-interceptor';
import { ErrorInterceptor } from './utils/error-interceptor';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { OperadorComponent } from './pages/main/operador/operador.component';
import { UsersComponent } from './pages/main/operador/users/users.component';
import { NewBoxComponent } from './pages/main/operador/new-box/new-box.component';
import { RecoveryPasswordComponent } from './pages/recovery-password/recovery-password.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FileUploadModule } from '@iplab/ngx-file-upload';
import { NotificationDetalleComponent } from './pages/main/notification-detalle/notification-detalle.component';

import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';
import { BlockCopyPasteDirective } from './directives/blockPaste.directive';
import { TrimDirective } from './directives/trim.directive';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';
import { ListBoxesComponent } from './pages/main/box/list-boxes/list-boxes.component';
import { env } from 'process';
import { environment } from 'src/environments/environment';
import { NgxTrimModule } from 'ngx-trim';
import { NewUserComponent } from './pages/main/user/new-user/new-user.component';
import { ViewBoxComponent } from './pages/main/operador/view-box/view-box.component';
import { AdminComponent } from './pages/main/admin/admin.component';
import { ColeccionesComponent } from './pages/main/admin/colecciones/colecciones.component';
import { PopFiltroComponent } from './pages/main/admin/colecciones/pop-filtro/pop-filtro.component';
import { CatalogComponent } from './pages/main/admin/catalog/catalog/catalog.component';
import { NewCatalogComponent } from './pages/main/admin/catalog/new-catalog/new-catalog.component';
import { SolicitudDetailComponent } from './pages/main/operador/solicitud-detail/solicitud-detail.component';
import { DatePipe } from '@angular/common';
import { SolicitudDetailValidComponent } from './pages/main/operador/solicitud-detail-valid/solicitud-detail-valid.component';
import { EditUser1Component } from './pages/main/user/edit-user1/edit-user1.component';

import { ReportesComponent } from './pages/main/operador/reportes/reportes.component';
import { PopOpReportesComponent } from './pages/main/operador/reportes/pop-op-reportes/pop-op-reportes.component';
import { EditBoxComponent } from './pages/main/operador/edit-box/edit-box.component';
import { EditUserComponent } from './pages/main/admin/user/edit-user/edit-user.component';
import { EditCitizenComponent } from './pages/main/admin/user/edit-citizen/edit-citizen.component';
import { EditOrgComponent } from './pages/main/admin/user/edit-org/edit-org.component';

import { MAT_DATE_LOCALE } from '@angular/material/core';
import { SolicitudDetailPjComponent } from './pages/main/operador/solicitud-detail-pj/solicitud-detail-pj.component';
import { MatTableModule } from '@angular/material/table';
import { UserComponent } from './pages/main/user/user.component';
import { AddRepresentativeComponent } from './pages/main/user/add-representative/add-representative.component';
import { PersonComponent } from './pages/main/admin/person/person.component';
import { CalendarComponent } from './pages/main/admin/calendar/calendar/calendar.component';
import { NewCalendarComponent } from './pages/main/admin/calendar/new-calendar/new-calendar.component';
import { ViewCalendarComponent } from './pages/main/admin/calendar/view-calendar/view-calendar.component';
import {MatTabsModule} from '@angular/material/tabs';
import {AddOfficialComponent} from './pages/main/user/add-official/add-official.component';
import { FocusDirective } from './directives/focus.directive';
import { ModalMessageComponent } from './pages/main/operador/reportes/pop-op-reportes/modal-message/modal-message.component';
import {ConsultarComponent} from './pages/main/admin/consultar/consultar.component';
import {DisableUsersComponent} from './pages/main/admin/disable-users/disable-users.component';
import {MatPaginatorIntl} from '@angular/material/paginator';
import {ForbiddenComponent} from './error-pages/forbidden/forbidden.component';
export function getSpanishPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = 'Registros por página:';
  paginatorIntl.nextPageLabel = 'Página siguiente';
  paginatorIntl.previousPageLabel = 'Página anterior';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ?
      Math.min(startIndex + pageSize, length) :
      startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} de ${length}`;
  };

  return paginatorIntl;
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    HeaderComponent,
    FooterComponent,
    RandompagesComponent,
    NotificationsComponent,
    NewNotificationComponent,
    NewPasswordComponent,
    OperadorComponent,
    UserComponent,
    UsersComponent,
    NewBoxComponent,
    RecoveryPasswordComponent,
    NotificationDetalleComponent,
    // TrimDirective,
    // BlockCopyPasteDirective,
    ListBoxesComponent,
    NewUserComponent,
    ViewBoxComponent,
    AdminComponent,
    ColeccionesComponent,
    PopFiltroComponent,
    CatalogComponent,
    NewCatalogComponent,
    SolicitudDetailComponent,
    SolicitudDetailValidComponent,
    EditUser1Component,
    AddRepresentativeComponent,
    ReportesComponent,
    PopOpReportesComponent,
    EditBoxComponent,
    EditUserComponent,
    EditCitizenComponent,
    EditOrgComponent,
    SolicitudDetailPjComponent,
    PersonComponent,
    CalendarComponent,
    NewCalendarComponent,
    ViewCalendarComponent,
    AddOfficialComponent,
    FocusDirective,
    ModalMessageComponent,
    ConsultarComponent,
    DisableUsersComponent,
    ForbiddenComponent
  ],
    imports: [
        BrowserModule,
        ReactiveFormsModule,
        FormsModule,
        BrowserAnimationsModule,
        FileUploadModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MaterialModule,
        HttpClientModule,
        FlexLayoutModule,
        MatSidenavModule,
        MatExpansionModule,
        RecaptchaModule, //this is the recaptcha main module
        RecaptchaFormsModule, //this is the module for form incase form validation
        RecaptchaV3Module,
        NgxTrimModule,
        MatTableModule,
        MatTabsModule,
    ],
  //{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  providers: [
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.KeycodeCaptcha,
    },
    { provide: MatPaginatorIntl, useFactory: getSpanishPaginatorIntl }
  ],
  bootstrap: [AppComponent],

  entryComponents: [
    NewUserComponent,
    PopFiltroComponent,
    NewCatalogComponent,
    SolicitudDetailComponent,
    PopOpReportesComponent
  ]
})
export class AppModule { }
