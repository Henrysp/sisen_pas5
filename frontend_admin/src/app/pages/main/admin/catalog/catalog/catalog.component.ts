import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { CatalogService } from 'src/app/services/catalog.service';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { NewCatalogComponent } from '../new-catalog/new-catalog.component';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {
  data: Data;
  pageEvent: PageEvent;
  textSearch: string;
  tamanoPaginado = 5;
  page = 1;
  isLoading = false;
  displayedColumns: string[] = ['codigo', 'nombre', 'acciones'];

  constructor(private catalogService: CatalogService,
              private funcionesService: FuncionesService,
              public dialog: MatDialog,
              private route: Router,
              private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.data = new Data();
    this.getQueryParams();
  }
  getQueryParams() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params.page){
        this.textSearch = params.textSearch;
        this.tamanoPaginado = Number(params.tamanoPaginado);
        this.page = Number(params.page);
        this.refreshTable(
          params.textSearch,
          this.page,
          this.tamanoPaginado,
        );
      }else{
        this.refreshTable('', 1, 5);
      }
    });
  }
  refreshTable(querySearch: string, page?: number, pageSize?: number) {
    this.isLoading = true;
    this.catalogService.paginateCatalog({
      search: querySearch,
      count: pageSize,
      page: page,
    }).subscribe(
      (res) => {
        if (res.success) {
          this.isLoading = false;
          this.data.count = res.count;
          this.data.recordsTotal = res.recordsTotal;
          this.data.items = res.data;
          this.data.page = page;
        }
      },
      (err) => {
        this.isLoading = true;
      }
    );
  }

  remove(data: any) {
    this.funcionesService
      .mensajeConfirmar('¿Desea eliminar el catálogo?')
      .then((resp) => {
        this.catalogService.removeCatalog(data.id).subscribe((res) => {
          if (res.success) {
            this.funcionesService.mensajeOk('Catálogo eliminado correctamente');
            this.refreshTable(
              this.textSearch,
              this.pageEvent?.pageIndex || 1,
              this.pageEvent?.pageSize || 5
            );
          } else {
            this.funcionesService.mensajeError(
              res.error !== undefined ? res.error : 'No se pudo eliminar el catálogo'
            );
          }
        });
      })
      .catch((err) => { });
  }

  newCatalog() {
    this.dialog.open(NewCatalogComponent, {disableClose: true}).afterClosed().subscribe(resp => {
      if (resp) {
        this.refreshTable(
          this.textSearch,
          this.pageEvent?.pageIndex || 1,
          this.pageEvent?.pageSize || 5
        );
      }
    });
  }
  edit(data: any) {
    this.dialog.open(NewCatalogComponent, { disableClose: true, data }).afterClosed().subscribe(resp => {
      if (resp) {
        this.getQueryParams();
      }
    });
  }
  searchByQuery() {
    this.refreshTable(this.textSearch, 1, 5);
    this.addParams();
  }
  pageChangeEvent(event) {
    this.tamanoPaginado = event.pageSize;
    this.page = event.pageIndex + 1;
    this.route.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { tamanoPaginado: event.pageSize, page: event.pageIndex + 1},
      queryParamsHandling: 'merge',
    });
    this.refreshTable(this.textSearch, event.pageIndex + 1, event.pageSize);
  }
  cleanSearch(){
    this.textSearch = '';
    this.refreshTable('', 1, 5);
    this.addParams();
  }
  addParams() {
    const params = {
      textSearch: this.textSearch,
      tamanoPaginado: this.tamanoPaginado,
      page: 1,
    };
    this.route.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}

export class Data {
  success: boolean;
  recordsTotal: number;
  page: number;
  count: number;
  items: [];
}
