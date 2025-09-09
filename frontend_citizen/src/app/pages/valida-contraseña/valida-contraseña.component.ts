import { SeguridadService } from './../../services/seguridad.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-valida-contraseña',
  templateUrl: './valida-contraseña.component.html',
  styleUrls: ['./valida-contraseña.component.scss'],
})
export class ValidaContraseñaComponent implements OnInit {
  id: string = '';
  doc: string = '';
  msj: string = '';
  msjsuccess: string = '';
  subMsj: string = '';
  valida: any;

  constructor(
    private route: ActivatedRoute,
    private seguridadService : SeguridadService
  ) {
    this.loadUrlParam();
  }

  ngOnInit(): void {
  }

  private loadUrlParam = async () => {
    this.id = this.route.snapshot.paramMap.get('id');
    this.doc = this.route.snapshot.paramMap.get('doc');
    this.valida = await this.seguridadService.GetValidChangePass(this.id, this.doc).toPromise();
    if(this.valida.success){
      this.msjsuccess = "Tu correo ha sido validado correctamente.";
      this.subMsj = "Revisa tu correo electrónico, ya te hemos enviado tu nueva contraseña.";
    } else {
      this.msj = this.valida.mensaje;
      this.subMsj = "";
    }
  }

}
