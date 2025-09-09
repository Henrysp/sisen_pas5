import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { requestGlobal } from 'src/app/core/dto/request';
import {CasillaService} from "../../core/services/casilla.service";

@Component({
  selector: 'app-terminos-condiciones',
  templateUrl: './terminos-condiciones.component.html',
  styleUrls: ['./terminos-condiciones.component.css']
})
export class TerminosCondicionesComponent implements OnInit {

  @Output() completedStep = new EventEmitter<any>()
  @Output() previousStep = new EventEmitter<any>()

  formGroup!: FormGroup;
  terminosCondicionesTexto = ''

  observableRequestSubscription!: Subscription;
  requestSave: requestGlobal = new requestGlobal();
  bloquearTerminos : boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private casillaService: CasillaService
  ) {
    this.terminosCondicionesTexto = casillaService.getTerminosCondiciones()

    this.observableRequestSubscription = casillaService.casilla$.subscribe(
      (requestSave: requestGlobal) => {
        this.requestSave = requestSave;
      }
    );
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      terminosCondiciones: ['', Validators.required],
      //politicasDatos: ['', Validators.required],
      autorizacionNotificaciones: ['', Validators.required]
    });
  }

  regresar() {
    this.previousStep.emit()
  }

  continuar() {
    //console.log("data enviar", this.requestSave )
    //console.log("data enviar", JSON.stringify(this.requestSave) )
  this.bloquearTerminos = true;
    if(this.formGroup.valid){
      if(this.formGroup.controls['terminosCondiciones'].value == true && this.formGroup.controls['autorizacionNotificaciones'].value == true){
        this.completedStep.emit()
      }else{
        this.formGroup.markAllAsTouched()
        this.bloquearTerminos = false;
        return
      }


    }else{
      this.formGroup.markAllAsTouched()
      return
    }



  }



  validarForm():boolean{


    if(this.formGroup.controls['terminosCondiciones'].value == true && this.formGroup.controls['autorizacionNotificaciones'].value == true){
      return false;
    }

    return true;

  }
}
