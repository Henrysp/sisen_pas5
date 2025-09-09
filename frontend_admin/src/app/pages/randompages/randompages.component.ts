import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeguridadService } from 'src/app/services/seguridad.service';
import { Profile } from 'src/app/transversal/enums/global.enum';

@Component({
  selector: 'app-randompages',
  templateUrl: './randompages.component.html',
  styleUrls: ['./randompages.component.scss']
})
export class RandompagesComponent implements OnInit {

  typeProfile: string;
  constructor(private router: Router, private seguridadService: SeguridadService ) {
  }

  ngOnInit(): void {
    this.redirectComponent();
  }
  redirectComponent(){
    if (this.seguridadService.getUserProfile() !== '') {
      this.typeProfile = this.seguridadService.getUserProfile();
      if (this.typeProfile === Profile.Administrador) {
        this.router.navigate(['/main']);
      }else if (this.typeProfile === Profile.Notifier) {
        this.router.navigate(['/main/notificaciones']);
      }else {
        this.router.navigate(['/main/operador/usuarios']);
      }
    }
  }
}
