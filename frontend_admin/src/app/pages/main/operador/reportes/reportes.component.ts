import { Component, OnInit } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { SeguridadService } from 'src/app/services/seguridad.service';
import { PopOpReportesComponent, TipoReporteEnum } from "./pop-op-reportes/pop-op-reportes.component";
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  tipoReporte = TipoReporteEnum;

  typeProfile: string;

  constructor(
    private dialog: MatDialog,
    private seguridadService: SeguridadService
  ) { }

  ngOnInit(): void {
    this.typeProfile = this.seguridadService.getUserProfile();
  }
  //
  opFiltroReportes(tipoReporte: TipoReporteEnum) {
    const popDetalle = this.dialog.open(PopOpReportesComponent, {
      width: '50%',
      maxWidth: '700px',
      disableClose: false
    });
    popDetalle.componentInstance.tipoReporte =  tipoReporte;
  }
  //
}
