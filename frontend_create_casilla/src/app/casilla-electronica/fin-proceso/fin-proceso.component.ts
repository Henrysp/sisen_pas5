import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-fin-proceso',
  templateUrl: './fin-proceso.component.html',
  styleUrls: ['./fin-proceso.component.css']
})
export class FinProcesoComponent implements OnInit {

  @Output() completedStep = new EventEmitter<any>()
  @Output() previousStep = new EventEmitter<any>()
  constructor(
    
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
  }


  goCasilla(){

    this.document.location.href = 'https://casillaelectronica.onpe.gob.pe/#/login';
  }
}
