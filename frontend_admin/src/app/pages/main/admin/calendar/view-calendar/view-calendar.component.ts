import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormBuilder,FormControl,FormGroup,Validators } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import { FileUploadValidators } from '@iplab/ngx-file-upload';
import { CalendarService } from 'src/app/services/calendar.service';
import { UserService } from 'src/app/services/user.service';
import { LBL_ADD_FILES, LBL_ERROR_MAX_FILES, LBL_ERROR_MAX_LENGTH_NAME, LBL_ERROR_MAX_SIZE_FILE, LBL_ERROR_ONLY_FILE, LBL_FEATURES_FILE, MAXFILES, MAX_TAM_FILES_10, MIN_TAM_FILES } from 'src/app/shared/constantes';
import { FuncionesService } from 'src/app/utils/funciones.service';

@Component({
  selector: 'app-view-calendar',
  templateUrl: './view-calendar.component.html',
  styleUrls: ['./view-calendar.component.scss']
})
export class ViewCalendarComponent implements OnInit {
  load:boolean = false;
  calendar: any = {};
  document: any = {};
  id: string = '';

  constructor(
    private funcionesService: FuncionesService,
    private calendarService: CalendarService,
    private usuarioService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loadUrlParam();
  }

  ngOnInit() {
  }

  private loadUrlParam = async () => {
    this.id = this.route.snapshot.queryParams.calendar;
    if (this.id !== undefined){
      this.calendar = await this.calendarService.getCalendarxId(this.id).toPromise();
      if (!this.calendar) {
        this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r => {
          this.router.navigate(['main/admin/calendar']);
        });
      }
      this.document = this.calendar.file_document[0];
    }else{
      this.funcionesService.mensajeError('Ha ocurrido un error, por favor vuelve a intentarlo.').then(r => {
        this.router.navigate(['main/admin/calendar']);
      });
    }
  }

  download = async (path: string, name: string) => {
    try {
      this.load = true;
      const file = await this.usuarioService.download(path).toPromise();
      this.funcionesService.downloadFile(file, name);
      this.load = false;
    } catch (error) {
      this.load = false;
    }
  };

  cancelar() {
    this.router.navigate(['/main/admin/calendar']);
  }

}
