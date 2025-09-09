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
import { NotificacionesElectronicasComponent } from './pages/main/notificaciones-electronicas/notificaciones-electronicas.component';
import { NuevaNotificacionComponent } from './pages/main/nueva-notificacion/nueva-notificacion.component';
import { NotificacionAdjuntosComponent } from './pages/main/notificacion-adjuntos/notificacion-adjuntos.component';
import { NotificacionesElectronicasDetalleComponent } from './pages/main/notificaciones-electronicas-detalle/notificaciones-electronicas-detalle.component';
import { NuevaConstrasenaComponent } from './pages/nueva-constrasena/nueva-constrasena.component';
import { JwtInterceptor } from './Utils/jwt-interceptor';
import { ErrorInterceptor } from './Utils/error-interceptor';
import { RecoveryPasswordComponent } from './pages/recovery-password/recovery-password.component';

import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';
import { environment } from 'src/environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    HeaderComponent,
    FooterComponent,
    RandompagesComponent,
    NotificacionesElectronicasComponent,
    NuevaNotificacionComponent,
    NotificacionAdjuntosComponent,
    NotificacionesElectronicasDetalleComponent,
    NuevaConstrasenaComponent,
    RecoveryPasswordComponent,
  ],
  imports: [
    BrowserModule,
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
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.KeycodeCaptcha,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
