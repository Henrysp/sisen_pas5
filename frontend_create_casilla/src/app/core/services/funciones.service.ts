import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { searchNotifications } from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class FuncionesService {

  colorMtc: string = '';

  constructor(private router: Router) {
  }

  mensajeOk(text: string, accionRedirect?: string, search?: searchNotifications): Promise<null> {
    return new Promise((resolve) => {
      Swal.fire({
        text: text,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: "green"
      }).then(() => {
      });
    });
  }

  mensajeError(text: string): Promise<null> {
    return new Promise((resolve, reject) => {
      Swal.fire({
        text: text,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false,
        confirmButtonColor: '#23DF05'
      }).then(() => {
      });
    });
  }

  mensajeInfo(text: string): Promise<null> {
    return new Promise((resolve, reject) => {
      Swal.fire({
        text: text,
        icon: 'info',
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false,
        confirmButtonColor: '#23DF05'
      }).then(() => {
      });
    });

  }

  mensajeConfirmar(text: string, title: string) {
    return new Promise((resolve, reject) => {
      Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        cancelButtonColor: '#b5b3b3',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Aceptar',
        reverseButtons: true
      }).then((resultado) => {
        if (resultado.value)
            console.log('');
        else
            reject();
      });
    });
  }

}
