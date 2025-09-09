import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AlertComponent} from "./alert/alert.component";
import {UploadFileComponent} from "./upload-file/upload-file.component";
import {MatCardModule} from "@angular/material/card";
import {FlexModule} from "@angular/flex-layout";
import {DirectiveModule} from "../directives/directive.module";

@NgModule({
  declarations: [
    AlertComponent,
    UploadFileComponent
  ],
  exports: [
    AlertComponent,
    UploadFileComponent
  ],
  imports: [
    MatCardModule,
    CommonModule,
    FlexModule,
    DirectiveModule
  ]
})
export class SharedModule {
}
