import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { CalendarService } from 'src/app/services/calendar.service';
import { FuncionesService } from 'src/app/utils/funciones.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  calendars = [];
  textSearch: string = '';
  txtestado : string ='all'
  txtfechaini : string = '';
  txtfechafin : string = '';
  listReadyCheck: boolean = false;

  listEstados = [
    {name: "- TODOS -", value:"all"},
    {name: "PENDIENTES", value:"yes"},
    {name: "VENCIDOS", value:"not"}
  ]

  constructor(
    private route: Router,
    private funcionesService: FuncionesService,
    private calendarService: CalendarService
  ) {
  }

  ngOnInit(): void {
    let _filter = [
      { field: "editable", value: "all" }
    ]
    this.loadData(1, 10, JSON.stringify(_filter));
  }

  loadData = async (page:number, size:number, filter:string) => {
    this.listReadyCheck = false;
    this.calendars = await this.calendarService.getCalendar(page.toString(), size.toString(), filter).toPromise();
    this.listReadyCheck = true;
  }

  new(){
    this.route.navigate(['/main/admin/new-calendar']);
  }

  searchByQuery(){
    let fechaini = "";
    if(this.txtfechaini !== ''){
      fechaini = this.txtfechaini + "T00:00:00-00:00";
    }
    let fechafin = "";
    if(this.txtfechafin !== ''){
      fechafin = this.txtfechafin + "T23:59:59-00:00";
    }

    let _filter = [
      { field: "title", value: this.textSearch },
      { field: "editable", value: this.txtestado },
      { field: "dateBegin", value: fechaini },
      { field: "dateEnd", value: fechafin }
    ]
    this.loadData(1 ,10 , JSON.stringify(_filter));
  }

  cleanSearch(){
    this.textSearch = '';
    this.txtestado = 'all';
    this.txtfechaini = '';
    this.txtfechafin = '';
    const filter = [
      { field: 'editable', value: 'all' }
    ];
    this.loadData(1, 10, JSON.stringify(filter));
  }

  edit(calendar: any){
    this.route.navigate(['/main/admin/new-calendar'], {
      queryParams: {
        calendar: calendar._id
      },
    });
  }

  view(calendar: any){
    this.route.navigate(['/main/admin/view-calendar'], {
      queryParams: {
        calendar: calendar._id
      },
    });
  }

  getColor(name: string) {
    return this.funcionesService.colorLetter(name);
  }

  pageChangeEvent(event) {
    let _filter = [
      { field: "title", value: this.textSearch },
      { field: "editable", value: this.txtestado },
      { field: "dateBegin", value: this.txtfechaini },
      { field: "dateEnd", value: this.txtfechafin }
    ]
    this.loadData(event.pageIndex + 1 , event.pageSize, JSON.stringify(_filter));
  }

  keyoff(e){
    e.preventDefault();
  }
}
