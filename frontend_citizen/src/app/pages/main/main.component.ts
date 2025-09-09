import {
  Component,
  OnInit
} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {notificationsRequest} from 'src/app/models/notifications/notifications-request';
import {NotificationlistServicesService} from 'src/app/services/notificationlist-services.service';
import {SeguridadService} from 'src/app/services/seguridad.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  notificationRequest: notificationsRequest = new notificationsRequest();
  contador = '...';
  userName: string;
  letterInitial: string;
  perfil: string;
  cargo: string;
  constructor(
    private router: Router,
    private notificationsservices: NotificationlistServicesService,
    private seguridadService: SeguridadService,
  ) {
  }

  subscription: Subscription;

  ngOnInit(): void {
    this.countnotview();
    this.getUserName();
  }
  ngAfterViewInit(): void {
    this.notificationsservices.notificationsLoaded$.subscribe(loaded => {
      if (loaded) {
        this.countnotview();
      }
    });
  }

  linkRedirect() {
    this.notificationsservices.searchNotifications({textSearch: '', pageIndex: 1, pageSize: 5});
    this.countnotview();
    this.router.navigate(['/main']);
  }

  getUserName() {
    let name = this.seguridadService.getUserName();
    let lastName = this.seguridadService.getUserLastName();
    let doctype = this.seguridadService.getUserDocType();
    let firstName = name.split(' ');
    let surname = lastName.split(' ');
    this.cargo = this.seguridadService.getCargo();

    if(doctype == 'ruc' || doctype == 'pr'){
      this.userName = this.seguridadService.getUserOrganizationName();
    }else{
      this.userName = firstName[0] + ' ' + surname[0];
    }
    /*this.userName = this.cap((firstName[0] + ' ' + surname[0] + this.seguridadService.getUserOrganizationName()).trim());
    const splitNames = this.userName.split(' ');
    let newNames = '';
    if (splitNames.length > 1) {
      for (const dataName of splitNames) {
        // if (!this.userName.includes(' ') && this.userName.length >= 11) {
        if (dataName.length >= 10) {
          newNames = newNames + this.insertSpaces(dataName, 10) + ' ';
        } else {
          newNames = newNames + dataName + ' ';
        }
      }

      this.userName = newNames;
    } else {
      if (this.userName.length >= 10) {
        this.userName = this.insertSpaces(this.userName, 10);
      }
    }*/

    this.letterInitial = name.charAt(0) + lastName.charAt(0) + this.seguridadService.getUserOrganizationName().charAt(0);

    //add traer perfil
    if (this.seguridadService.getUserDocType() == 'ruc' || this.seguridadService.getUserDocType() == 'pr') {
      this.perfil = 'Persona Jurídica';
    } else {
      this.perfil = 'Persona Natural';
    }
  }

  countnotview() {
    this.notificationsservices.getUnreadNotifications().subscribe(data => {
      if (data.success) {
        this.contador = data.recordsTotal;
      }
    });
  }

  private cap(word: string) {
    if (!word) {
      return word;
    }
    return word[0].toUpperCase() + word.substr(1).toLowerCase();
  }

  insertSpaces(input: string, interval: number): string {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      if (i > 0 && i % interval === 0) {
        result += ' '; // Agrega un espacio en cada posición múltiplo de interval
      }
      result += input[i];
    }
    return result;
  }
}
