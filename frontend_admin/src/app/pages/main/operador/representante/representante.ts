import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators  } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { TypeDocument } from 'src/app/models/notifications/notification';
import { Departamento, Distrito, Provincia } from 'src/app/models/ubigeo';
import { UserDetail } from 'src/app/models/users/user';
import { UbigeoService } from 'src/app/services/ubigeo.service';
import { UserService } from 'src/app/services/user.service';
import { Profile } from 'src/app/transversal/enums/global.enum';
import { FuncionesService } from 'src/app/utils/funciones.service';
@Component({
  selector: 'app-edit-user',
  templateUrl: './representante.component.html',
  styleUrls: ['./representante.component.scss']
})
export class Representante implements OnInit {
  departamentoList: Array<Departamento> = []
  provinciaList: Array<Provincia> = []
  distritoList: Array<Distrito> = []
  Formulario: FormGroup;
  inputDisabled = false;
  documentTypeSelected: string = '';
  maxlengthNumDoc: number;
  placeHolder = 'Ingrese número de documento';
  user : any ;
  esInterno: boolean = false;
  id;
  public data: any
  constructor(
    //@Inject(MAT_DIALOG_DATA) public data: any,
    //private dialogRef: MatDialogRef<EditUser1Component>,
    private fb: FormBuilder,
    private userService: UserService,
    private funcionesService: FuncionesService,
    private ubigeoService: UbigeoService,
    private renderer: Renderer2,
    private router: ActivatedRoute,
  ) {
    this.id = this.router.snapshot.paramMap.get('id');
    //console.log("datauser", this.data)
  }

  ngOnInit(): void {
   // this.getInfo();
    this.initForm();
    this.getInfo();
    // if(this.data.estate_inbox == 'Registro interno') this.esInterno = true;
  }

  typeDocument: TypeDocument[] = [
    { id: 'dni', value: 'DNI' },
    { id: 'ce', value: 'Carnet de Extranjería' },
  ];

  profiles: TypeDocument[] = [
    { id: Profile.RegistryOperator, value: 'Registrador' },
    { id: Profile.Notifier, value: 'Notificador' },
    { id: Profile.Administrador, value: 'Administrador' },
  ];

  formInvalid(control: string) {
    return (
      this.Formulario.get(control).invalid &&
      (this.Formulario.get(control).dirty ||
        this.Formulario.get(control).touched)
    );
  }



  getInfo(){
    //const  id = this.data.inbox_id;
    //const  id2 = this.data.id;

    this.userService.getUserDetail(this.id, false).subscribe((resp)=>{

      // console.log("informacion edit",resp)
      this.user = resp.user;
      this.Formulario.controls["fm_optiontipo"].setValue( this.user.doc_type);
      this.Formulario.controls["fm_numerodoc"].setValue( this.user.doc);
      this.Formulario.controls["fm_nombres"].setValue( this.user.name);
      this.Formulario.controls["fm_apellidoPaterno"].setValue( this.user.lastname);
      this.Formulario.controls["fm_apellidoMaterno"].setValue( this.user.second_lastname);
      this.Formulario.controls["fm_correo"].setValue( this.user.email);
      this.Formulario.controls["fm_telefono"].setValue( this.user.cellphone);
      this.Formulario.controls["fm_direccion"].setValue( this.user.address);

      if(this.user.ubigeo != undefined){
        var cadenaUbigeo = this.user.ubigeo.split("/");
        var dep = cadenaUbigeo[0].trim();
        var prov = cadenaUbigeo[1].trim();
        var dis = cadenaUbigeo[2].trim();
        //console.log("dep- prov- dis", dep + " - "+ prov + " - " + dis)


        var foundProv = this.departamentoList.find( departamento => departamento.nodep == dep)
        this.Formulario.controls["fm_departamento"].setValue(foundProv);

        this.cambiarProvincia(prov,dis);
      }



     }, (error)=>{
       console.error(error)
     })
  }

  getDepartamento(){

  this.ubigeoService.getDepartamentoList().subscribe((resp)=>{

    this.departamentoList = resp


  })

  }

  cambiarProvincia(prov = "" , dis = "" ){

    this.Formulario.get("fm_provincia")?.reset();
    this.Formulario.get("fm_distrito")?.reset();
    this.distritoList = [];

    var value  = this.Formulario.get('fm_departamento')?.value.ubdep;

    this.ubigeoService.getProvinciaList(value).subscribe((resp)=>{

      this.provinciaList = resp
      if(prov != "" && dis != ""){
      var foundProv = this.provinciaList.find( provincia => provincia.noprv == prov)
      this.Formulario.controls["fm_provincia"].setValue(foundProv);
        this.cambiarDistrito(dis);
      }

    })
  }

  cambiarDistrito(dis = ""){
    this.Formulario.get("fm_distrito")?.reset();
    var valueprovincia = this.Formulario.get('fm_provincia')?.value.ubprv;
    var valuedepar = this.Formulario.get('fm_departamento')?.value.ubdep;

    this.ubigeoService.getDistritoList(valuedepar, valueprovincia).subscribe((resp)=>{

      this.distritoList = resp
      if(dis != ""){
      var foundDist = this.distritoList.find( distrito => distrito.nodis == dis)
      this.Formulario.controls["fm_distrito"].setValue(foundDist);
      }
    })
  }


  saveEdit(){

    var _dept = this.Formulario.controls["fm_departamento"].value.nodep;
    var _prov = this.Formulario.controls["fm_provincia"].value.noprv;
    var _dist = this.Formulario.controls["fm_distrito"].value.nodis;

    var userDet = new UserDetail ();
    userDet.inbox_id = ""; //this.data.inbox_id ;
    userDet.email = this.Formulario.controls["fm_correo"].value;
    userDet.cellphone = this.Formulario.controls["fm_telefono"].value;
    userDet.ubigeo = _dept + " / "+ _prov + " / " + _dist; //this.user.ubigeo;//this.Formulario.controls[""].value;
    userDet.address = this.Formulario.controls["fm_direccion"].value;
    userDet!.user!.name = "owner"
    userDet!.user!.lastname = "lastname owner"
    this.userService.editUserDetail(userDet).subscribe((resp)=>{
      if(!resp.success){
        this.funcionesService.mensajeError(
          resp.error
        );
      }else{
        //this.dialogRef.close(true);
      }
    })
  }

  initForm() {
    this.Formulario = this.fb.group({
      fm_optiontipo: this.fb.control({
        value: '',// this.data ? this.data.doc_type : '',
        disabled: this.inputDisabled,
      }),
      fm_numerodoc: this.fb.control(
        {
          value: '',//this.data ? this.data.doc : '',
          disabled: this.inputDisabled,
        },
        [Validators.pattern('^[0-9]+$')]
      ),
      fm_nombres: this.fb.control({
        value:'',// this.data ? this.data.name : '',
        disabled: this.inputDisabled,
      }),
      // fm_apellidos: this.fb.control({
      //   value: this.data ? this.data.lastname : '',
      //   disabled: this.inputDisabled,
      // }),
      fm_apellidoPaterno: this.fb.control({
        value:'',// this.data ? this.data.lastname : '',
        disabled: this.inputDisabled,
      }),
      fm_apellidoMaterno: this.fb.control({
        value:'',// this.data ? this.data.second_lastname : '',
        disabled: this.inputDisabled,
      }),
      fm_correo: this.fb.control(
        {
          value:'',// this.data ? this.data.email : '',
          disabled: this.inputDisabled,
        },
        [
          Validators.required,
          Validators.pattern(
            '[a-zA-Z0-9.+-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}'
          ),
        ]
      ),
      fm_telefono: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',
          disabled: this.inputDisabled,
        },
        [Validators.required]
      ),
      fm_direccion: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',
          disabled: this.inputDisabled,
        },
        [Validators.required]
      ),
      fm_departamento: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',
          disabled: false,
        },
        [Validators.required]
      ),
      fm_provincia: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',
          disabled: false,
        },
        [Validators.required]
      ),
      fm_distrito: this.fb.control(
        {
          value: '',//this.data ? this.data.profile : '',
          disabled: false,
        },
        [Validators.required]
      ),
    });
    // if(this.data.estate_inbox === 'Registro interno'){
    //   this.Formulario.get('fm_departamento').clearValidators();
    //   this.Formulario.get('fm_provincia').clearValidators();
    //   this.Formulario.get('fm_distrito').clearValidators();
    //   this.Formulario.get('fm_departamento').updateValueAndValidity();
    //   this.Formulario.get('fm_provincia').updateValueAndValidity();
    //   this.Formulario.get('fm_distrito').updateValueAndValidity();
    // }
    this.getDepartamento();
  }

  changeTypeDocument(event) {
    this.documentTypeSelected = event.value;

    if (this.documentTypeSelected === 'dni') {
      this.maxlengthNumDoc = 8;
      this.placeHolder = 'Ingrese número de DNI';
    } else {
      this.maxlengthNumDoc = 12;

      this.placeHolder = 'Ingrese número de CE';
    }
  }
  validar_campo(event): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }


  cancelar() {
    //this.dialogRef.close(false);
  }


  validarCelular(event : any): boolean{
    const charCode = (event.which) ? event.which : event.keyCode;
    const numCelular = this.Formulario.get('fm_telefono')?.value;
    var primerDigito = event.target.selectionStart;
    var primerdato = numCelular[0];
    if(primerDigito == 0   ){
      if(charCode == 57 ){
        return true;
      }else{
        return false;
      }
    }else{
      if( charCode > 31 && (charCode < 48 || charCode > 57)){
        return false;
      }else {
        return true;
      }
    }
   }

  validardomicilio(e : any, idInput: string){
    var value = this.Formulario.get('fm_direccion')?.value;

    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;

    this.Formulario.get('fm_direccion')?.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');


return true;
   }

}
