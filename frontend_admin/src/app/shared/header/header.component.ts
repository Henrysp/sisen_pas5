import {Component, OnInit} from '@angular/core';
import {SeguridadService} from '../../services/seguridad.service';
import {Usuario} from '../../models/Usuario';
import { UserService } from 'src/app/services/user.service';
import {JwtHelperService} from '@auth0/angular-jwt';
import {Profile} from '../../transversal/enums/global.enum';
import {UserLogin} from '../../models/UserLogin';
import {environment} from '../../../environments/environment';
import * as CryptoJS from 'crypto-js';
import {Router} from '@angular/router';
import {FuncionesService} from '../../utils/funciones.service';
import {ERROR_SERVER} from '../constantes';
import {Subscription} from 'rxjs';
import {ReCaptchaV3Service} from 'ng-recaptcha';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  constructor(
    private seguridadService: SeguridadService,
    private userService: UserService,
    private funcionesService: FuncionesService,
    private router: Router,
    private reCaptchaV3Service: ReCaptchaV3Service,
  ){}
  existeSession: boolean;
  usuario: Usuario = new Usuario();
  userName: string;
  profilesAvailable: any ;
  inputDisabled = true;
  profileSelected: any;
  jwtHelper: JwtHelperService = new JwtHelperService();
  RequestUser: UserLogin = new UserLogin();
  TOkenCaptcha = '';
  typeProfile: string;
  isLoading = true;
  protected readonly event = event;
  public recentToken = '';
  public recentError?: { error: any };
  private singleExecutionSubscription: Subscription;
  async ngOnInit() {
    this.existeSession = await this.seguridadService.verificarSesion();
    this.getUserName();
    this.getProfilesAvailable();
  }

  getUserName() {
    const name =  this.seguridadService.getUserName();
    const lastName =  this.seguridadService.getUserLastName();
    const firstName = name.split(' ');
    const surname = lastName.split(' ');
    this.userName = firstName[0] + ' ' + surname;
  }
  getProfilesAvailable() {
    this.executeAction('homeLogin');
    const id = this.seguridadService.getID();
    const profile = this.seguridadService.getUserProfile();
    this.userService.profilesAvailable(id, profile).subscribe((res) => {
      if (res.success) {
        this.profilesAvailable = res.user.profiles;
        if (( this.profilesAvailable === '' || this.profilesAvailable.length === 0 ) && this.isLoading === false){
          this.funcionesService.mensajeError('No cuenta con perfiles disponibles');
        }
        this.isLoading = false;
      } else {
        this.funcionesService.mensajeError('No se pudieron obtener los perfiles');
      }
    });
  }
  changeSelectProfile(event){
    this.profileSelected = event.value;
    this.inputDisabled = false;
  }
  changeProfile(){
    this.executeAction('homeLogin');
    const LDAP = this.seguridadService.getLDAP();
    this.funcionesService
      .mensajeConfirmarPassword(
      'Ingrese su contraseña', 'Confirmación')
      .then((password) => {
        this.RequestUser.profile = CryptoJS.AES.encrypt(this.profileSelected, environment.SECRET_KEY).toString();
        this.RequestUser.usuario = CryptoJS.AES.encrypt(LDAP, environment.SECRET_KEY).toString();
        this.RequestUser.password = CryptoJS.AES.encrypt(password, environment.SECRET_KEY).toString();
        this.RequestUser.recaptcha = this.TOkenCaptcha;
        this.seguridadService.GetLogin<any>(this.RequestUser).subscribe(
          (data) => {
            if (data.success) {
              this.userService.CerrarSesion().subscribe(
              (res) => {
                if (res.success) {
                  console.log('Se cerro la sesión');
                } else {
                  return;
                }
              },
                (err) => {
                  console.log('Problemas del servicio', err);
                }
              );
              sessionStorage.setItem('accessToken', data.token);
              const exp = this.seguridadService.getEXP();
              sessionStorage.setItem('token_expiration', (exp * 1000).toString());
              this.redirectOption();
            } else {
              if (data.error.code === 126){
                this.funcionesService.mensajeError('Contraseña incorrecta');
              }else {
                console.log(data.error.code);
                this.funcionesService.mensajeError('Ocurrió un error. Inténtelo nuevamente');
              }
            }
          }, (error) => {
            this.funcionesService.mensajeError(ERROR_SERVER);
          }
        );
      })
      .catch((err) => {});
  }
  cerrarSession() {
    this.userService.CerrarSesion().subscribe(
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
  resolved(captchaResponse: string) {
    this.TOkenCaptcha = captchaResponse;
  }
  redirectOption(){
    if (this.seguridadService.getUserProfile() !== '') {
      this.typeProfile = this.seguridadService.getUserProfile();
      switch (this.typeProfile) {
        case Profile.Administrador:
        case Profile.RegistryOperator:
        case Profile.QueryOperator:
          this.router.navigate(['/main/list-boxes']);
          break;
        case Profile.Notifier:
          this.router.navigate(['/main/notificaciones']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    }
    setTimeout(() => {
      location.reload();
    });
  }
  displayRecaptchaBadge(show = true){
    const el: any = document.querySelector('.grecaptcha-badge');
    if (el){
      el.style.visibility = show ? 'visible' : 'hidden';
    }
  }
  private executeAction = async (action: string) => {
    return new Promise((resolve) => {
      if (this.singleExecutionSubscription) {
        this.singleExecutionSubscription.unsubscribe();
      }
      this.singleExecutionSubscription = this.reCaptchaV3Service
        .execute(action)
        .subscribe(
          (token) => {
            this.recentToken = token;
            this.recentError = undefined;
            this.TOkenCaptcha = token;
            resolve(true);
          },
          (error) => {
            this.recentToken = '';
            this.TOkenCaptcha = '';
            this.recentError = { error };
            resolve(false);
          }
        );
    });
  }
}
