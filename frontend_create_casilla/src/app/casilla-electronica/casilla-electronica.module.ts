import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DatosGeneralesComponent} from "./datos-generales/datos-generales.component";
import {DatosRepresentanteComponent} from "./datos-representante/datos-representante.component";
import {TerminosCondicionesComponent} from "./terminos-condiciones/terminos-condiciones.component";
import {
  SolicitudComponent
} from "./solicitud/solicitud.component";
import {
  CreacionPasosComponent
} from "./creacion-pasos/creacion-pasos.component";
import {MatStepperModule} from "@angular/material/stepper";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {MatInputModule} from "@angular/material/input";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {SharedModule} from "../shared/shared.module";
import {FlexModule} from "@angular/flex-layout";
import {ValidacionCorreoComponent} from './validacion-correo/validacion-correo.component';
import {MatDialogModule} from "@angular/material/dialog";
import { PersonaJuridicaComponent } from './persona-juridica/persona-juridica.component';
import { PersonaNaturalComponent } from './persona-natural/persona-natural.component';
import {DndDirective} from "../directives/dnd.directive";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { FotoDniComponent } from './foto-dni/foto-dni.component';
import { SharedDialogComponent } from './shared/shared-dialog/shared-dialog.component';
import { FileUploadModule } from '@iplab/ngx-file-upload';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FinProcesoComponent } from './fin-proceso/fin-proceso.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatosOtrosComponent } from './datos-otros/datos-otros.component';


@NgModule({
  declarations: [
    DatosGeneralesComponent,
    DatosRepresentanteComponent,
    DatosOtrosComponent,
    TerminosCondicionesComponent,
    SolicitudComponent,
    CreacionPasosComponent,
    ValidacionCorreoComponent,
    PersonaJuridicaComponent,
    PersonaNaturalComponent,
    AlertDialogComponent,
    FotoDniComponent,
    SharedDialogComponent,
    FinProcesoComponent,
  ],
  exports: [
    CreacionPasosComponent,
  ],
  imports: [
    FlexModule,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatStepperModule,
    SharedModule,
    MatDialogModule,
    MatSnackBarModule,
    FileUploadModule,
    BrowserAnimationsModule,
    BrowserModule,
    NgbModule,
    FormsModule
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA]
})
export class CasillaElectronicaModule {
}
