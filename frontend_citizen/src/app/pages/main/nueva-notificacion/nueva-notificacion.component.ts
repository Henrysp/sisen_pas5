import { Component, OnInit } from '@angular/core';

interface Filtro {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-nueva-notificacion',
  templateUrl: './nueva-notificacion.component.html',
  styleUrls: ['./nueva-notificacion.component.scss']
})
export class NuevaNotificacionComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  filtros: Filtro[] = [
    {value: 'filtro-0', viewValue: 'DNI'},
    {value: 'filtro-1', viewValue: 'Carnet de Extranjería'}
  ];

}
