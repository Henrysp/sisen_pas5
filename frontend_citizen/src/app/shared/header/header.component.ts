import { Component, OnInit } from '@angular/core';
import { SeguridadService } from '../../services/seguridad.service';
import { Usuario } from '../../models/user/Usuario';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  existeSession: boolean;
  usuario: Usuario = new Usuario();
  userName: string;

  constructor(private seguridadService: SeguridadService) {}

  async ngOnInit() {
    this.existeSession = await this.seguridadService.verificarSesion();
    this.getUserName();
  }
  getUserName() {
    const name = this.seguridadService.getUserName();
    const lastName = this.seguridadService.getUserLastName();
    const firstName = name.split(' ');
    const surname = lastName.split(' ');
    this.userName = firstName[0] + ' ' + surname[0];
  }

  cerrarSession2() {
    this.seguridadService.cerrarSesion();
  }
  cerrarSession() {
    this.seguridadService.CerrarSesionPre().subscribe(
      (res) => {
        if (res.success) {
          this.seguridadService.cerrarSesion();
        } else {
        return;
        }
      },
      (err) => {
        console.log('Problemas del servicio', err);
      }
    );
  }
}
