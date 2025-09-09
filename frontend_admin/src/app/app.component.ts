import { Component } from '@angular/core';
import { FuncionesService } from './utils/funciones.service';
import { ResultSignature } from 'src/app/shared/constantes';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(public funcionesService: FuncionesService, public notificacionService: NotificationService) {
    //TODO:Events Signature
    window.addEventListener('invokerOk', (event: any) => {
      var type = event.detail;
      if (type === ResultSignature.TypeEvenReniec) {
        // console.log('--InvokerSuccess()');
        //send Notification api
        if(!this.notificacionService.saveNotification.isStopped) this.notificacionService.saveNotification.next(true);
      }
    });
    window.addEventListener('getArguments', (event: any) => {
      var type = event.detail;
      if (type === ResultSignature.TypeEvenReniec) {
        // console.log('--InvokerSend()');
        if(!this.notificacionService.openWindow.isStopped) this.notificacionService.openWindow.next(true);
      }
    });
    window.addEventListener('invokerCancel', (event) => {
      // console.log('--invokerCancel()');
      this.funcionesService.mensajeError(
        'El proceso de firma digital fue cancelado.'
      );
    });
  }

  title = 'front';
}
