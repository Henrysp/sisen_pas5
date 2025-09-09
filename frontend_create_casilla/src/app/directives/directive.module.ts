import {NgModule} from "@angular/core";
import {AppComponent} from "../app.component";
import {DndDirective} from "./dnd.directive";
import { NumberDirective } from "./numbers-only.directive";

@NgModule({
  declarations: [
    DndDirective,
    NumberDirective
  ],
  imports: [
  ],
  providers: [],
  exports: [
    DndDirective,
    NumberDirective
  ],
  bootstrap: [AppComponent]
})
export class DirectiveModule { }
