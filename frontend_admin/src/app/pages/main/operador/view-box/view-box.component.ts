import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { FuncionesService } from 'src/app/utils/funciones.service';

@Component({
  selector: 'app-view-box',
  templateUrl: './view-box.component.html',
  styleUrls: ['./view-box.component.scss']
})
export class ViewBoxComponent implements OnInit {
  load = false;
  usuario: any = {};
  constructor(private route: Router,
    private router: ActivatedRoute,
    private usuarioService: UserService,
    private funcionesService: FuncionesService) { }

  ngOnInit() {
    this.loadUser();
  }

  loadUser = async () => {
    const id = this.router.snapshot.paramMap.get('id');
    this.load = true;
    const acreditacion = await this.usuarioService.GetTypeAcreditation().toPromise();
    const data = await this.usuarioService.getUser(id).toPromise();
    this.usuario = data.user;
    this.usuario.accreditation_name = acreditacion.data.acreditationTypes.find(x => x.code === this.usuario.accreditation)?.value;
    this.load = false;

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
   
  }
  cancelar() {
    this.route.navigate(['/main/list-boxes']);
  }
  buildHide = (name: string) => {
    const esRuc = this.usuario.doc_type == 'ruc';
    switch (name) {
      case 'fm_razon_social':
        if (esRuc) return true;
        return false;
      case 'fm_optiontipo_rep':
        if (esRuc) return true;
        return false;
      case 'fm_numerodoc_rep':
        if (esRuc) return true;
        return false;
      case 'fm_organizacion':
        if (esRuc) return false;
        return true;
    }
  };

}
