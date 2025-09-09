import { Component, OnInit } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { CollectionService } from 'src/app/services/collection.service';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { PopFiltroComponent } from "./pop-filtro/pop-filtro.component";

export interface DialogData {
  animal: string;
  name: string;
}

interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-colecciones',
  templateUrl: './colecciones.component.html',
  styleUrls: ['./colecciones.component.scss']
})
export class ColeccionesComponent implements OnInit {
  isLoading = false;
  collections = [];
  constructor(
    private dialog: MatDialog,
    private collectionService: CollectionService,
    private funcionesServices: FuncionesService,
  ) { }

  ngOnInit(): void {
     this.loadData();
  }
  foods: Food[] = [
    { value: 'steak-0', viewValue: 'Steak' },
    { value: 'pizza-1', viewValue: 'Pizza' },
    { value: 'tacos-2', viewValue: 'Tacos' }
  ];

  //
  colFiltro() {
    const popDetalle = this.dialog.open(PopFiltroComponent, {
      width: '80%',
      maxWidth: '600px',
      disableClose: false
    })
  }
  //

  loadData = async () => {
    try {
      this.isLoading = true;
      this.collections = await this.collectionService.listColletions().toPromise();
      this.isLoading = false;
    } catch {
      this.isLoading = false;
    }
  }

  exportCollection = async (name: string, label: string) => {
    try {
      this.isLoading = true;
      const file = await this.collectionService.exportCatalog(name, label).toPromise();
      this.funcionesServices.downloadFile(file, `${label}.csv`);
      this.isLoading = false;
    } catch {
      this.isLoading = false;
    }
  }

}


