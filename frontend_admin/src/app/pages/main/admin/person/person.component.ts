import { DatePipe } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { PersonService } from 'src/app/services/person.service';
import { FuncionesService } from 'src/app/utils/funciones.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {

  constructor(
    private fb: FormBuilder,
    private personService: PersonService,
    private funcionesService: FuncionesService,
    private renderer: Renderer2,
    private datePipe: DatePipe,
    private router: Router,
    private userService: UserService
  ) {
    this.dateMax = this.datePipe.transform(new Date( new Date().setFullYear(new Date().getFullYear() - 18)), 'yyyy-MM-dd');
  }
  formPerson: FormGroup;

  fm_apellidoPaterno: FormControl = new FormControl({ value: '', disabled: true }, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/));
  fm_apellidoMaterno: FormControl = new FormControl({ value: '', disabled: true }, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/));
  fm_nombres: FormControl = new FormControl({ value: '', disabled: true }, [Validators.required,
    Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);
  fm_fchNacimiento: FormControl = new FormControl({ value: '', disabled: true}, [Validators.required, Validators.minLength(10)]);
  todaydate: Date = new Date( new Date().setFullYear(new Date().getFullYear() - 18));

  dateMin = '';
  dateMax = '';


  protected readonly onsubmit = onsubmit;
  protected readonly event = event;

  ngOnInit(): void {
    this.initForm();
    this.dateMin = this.datePipe.transform(new Date('1900-01-01 00:00:00'), 'yyyy-MM-dd');
  }

  initForm() {
    this.formPerson = this.fb.group({
      fm_tipoDoc: this.fb.control({value: 'DNI', disabled: true}),
      fm_numerodoc: this.fb.control( '', [Validators.required, Validators.pattern('^[0-9]+$')]),
      fm_apellidoPaterno: this.fm_apellidoPaterno,
      fm_apellidoMaterno: this.fm_apellidoMaterno,
      fm_nombres: this.fm_nombres,
      fm_fchNacimiento: this.fm_fchNacimiento,
      fm_digitVerifica: this.fb.control({value: '', disabled: true}, [Validators.required, Validators.pattern('^[0-9]+$')])
    }, { validators: this.apellidoRequerido.bind(this) });
  }
  apellidoRequerido(formGroup: FormGroup) {
    const grupos: [string, string][] = [
      ['fm_apellidoPaterno' , 'fm_apellidoMaterno']
    ].filter((grupo): grupo is [string, string] => grupo !== null);

    for (const [paterno, materno] of grupos) {
      const tieneApellido =
        formGroup.get(paterno)?.value?.trim() ||
        formGroup.get(materno)?.value?.trim();

      if (!tieneApellido) {
        return { apellidoRequerido: true };
      }
    }

    return null;
  }
  formInvalid(control: string) {
    return (
      this.formPerson.get(control).invalid &&
      (this.formPerson.get(control).dirty ||
        this.formPerson.get(control).touched)
    );
  }

  eShowError = (input, error = null) => {
    if (error.required !== undefined) {
      return 'Campo requerido';
    } else if (error.pattern !== undefined) {
      return 'Formato no válido';
    } else if (error.fileSize !== undefined) {
      return 'Archivo(s) con peso excedido';
    } else if (error.minlength !== undefined) {
      return `Se requiere ${error.minlength.requiredLength} caracteres como mínimo` ;
    } else {
      return 'Campo inválido';
    }
  }
  formatNumero(event, type): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  existeDni = async () => {
    if (this.formPerson.get('fm_numerodoc').value.length > 7) {
      const dni = this.formPerson.get('fm_numerodoc').value;
      const response = await this.consultaReniec(dni);
      if (response) {
        this.funcionesService.mensajeOk(`El número de dni ${dni} existe en el padrón`);
        this.formPerson.get('fm_numerodoc').setValue('');
        this.formPerson.get('fm_digitVerifica').setValue('');
      } else {
        this.personService.findExiste(dni).subscribe(
          (res) => {
            if (res.success) {
              this.funcionesService.mensajeOk(`El número de dni ${dni} existe en base de datos`);
              this.formPerson.get('fm_numerodoc').setValue('');
              this.formPerson.get('fm_digitVerifica').setValue('');
            } else {
              this.funcionesService.mensajeConfirmar(
                `El DNI N° ${dni} no está registrado en el padrón electoral ¿Estás seguro de querer registrarlo? Recuerda tener sus datos personales a la mano.`)
                .then((resp) => {
                  this.formPerson.get('fm_numerodoc').disable();
                  this.formPerson.get('fm_apellidoPaterno').enable();
                  this.formPerson.get('fm_apellidoMaterno').enable();
                  this.formPerson.get('fm_nombres').enable();
                  this.formPerson.get('fm_fchNacimiento').enable();
                  this.formPerson.get('fm_digitVerifica').enable();
                })
                .catch((err) => {
                  this.formPerson.get('fm_numerodoc').setValue('');
                  this.formPerson.get('fm_apellidoPaterno').setValue('');
                  this.formPerson.get('fm_apellidoMaterno').setValue('');
                  this.formPerson.get('fm_nombres').setValue('');
                  this.formPerson.get('fm_apellidoPaterno').disable();
                  this.formPerson.get('fm_apellidoMaterno').disable();
                  this.formPerson.get('fm_nombres').disable();
                });
            }
          }
        );
      }
    }
  }

  private consultaReniec = (doc: string) => {
    return new Promise<boolean>((resolve) => {
      this.userService.ConsultaReniec(doc).subscribe(
        (resp: any) => {
          if (resp.statusCode === 200) {
            resolve(true);
          } else if (resp.statusCode === 404) {
            resolve(false);
          }
        }, (error) => {
          resolve(false);
        }
      );
    });
  }

  preSubmit() {
    if (this.formPerson.get('fm_apellidoPaterno').value === '' && this.formPerson.get('fm_apellidoMaterno').value === '') {
      this.funcionesService.mensajeInfo('Ingrese por lo menos un apellido');
      return;
    }
    const msg =
      '<div style=\'text-align:left;\'>Valide que los datos sean conformes, si es así haga clic en el botón <strong>\'Aceptar\'</strong> de lo contrario haga clic en <strong>\'Cancelar\'</strong><br/>'
      + 'Nro Documento: ' + this.formPerson.get('fm_numerodoc').value + '<br/>'
      + 'Apellido Paterno: ' + this.formPerson.get('fm_apellidoPaterno').value.toUpperCase() + '<br/>'
      + 'Apellido Materno: ' + this.formPerson.get('fm_apellidoMaterno').value.toUpperCase() + '<br/>'
      + 'Nombres: ' + this.formPerson.get('fm_nombres').value.toUpperCase() + '<br/>'
      + 'Fecha de nacimiento: ' + this.formPerson.get('fm_fchNacimiento').value + '<br/>'
      + 'Dígito de verificación: ' + this.formPerson.get('fm_digitVerifica').value + '<br/>'
      + 'Una vez enviada la información, se almacenará en la DB de la ONPE.</div>';
    Swal.fire({
      title: 'Mensaje',
      html: msg,
      cancelButtonText: `Cancelar`,
      confirmButtonText: 'Aceptar',
      showCancelButton: true,
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.submit();
      }
    })
      .catch((err) => {

      });
  }

  submit = () => {
    if (!this.formPerson.valid) { return; }
    const fchNacFormateado = (this.formPerson.get('fm_fchNacimiento').value).split('-');
    const fd = new FormData();
    fd.append('dni', this.formPerson.controls.fm_numerodoc.value);
    fd.append('fenac', fchNacFormateado[0] + fchNacFormateado[1] + fchNacFormateado[2]);
    fd.append('digverifica', this.formPerson.controls.fm_digitVerifica.value);
    fd.append('paterno', this.formPerson.controls.fm_apellidoPaterno.value.trim().toUpperCase());
    fd.append('materno', this.formPerson.controls.fm_apellidoMaterno.value.trim().toUpperCase());
    fd.append('nombre', this.formPerson.controls.fm_nombres.value.trim().toUpperCase());

    this.personService.save(fd).subscribe(
      (res) => {
        if (res.success) {
          this.funcionesService.mensajeOk('Se creó al ciudadano con éxito').then(r =>
            this.router.navigate(['/main/list-boxes']));
        } else {
          this.funcionesService.mensajeError(res.message);
        }
      }
    );
  }
  onSubmit(event: Event): void {
    event.preventDefault();
  }
  preventDefault(event: KeyboardEvent): void {
    event.preventDefault();
  }
  cancelar() {
    this.router.navigate(['/main/list-boxes']);
  }
  onInputFormat(event: Event, caseType: 'uppercase' | 'lowercase' | 'none', formControlNameValue: string): void {
    const inputElement = event.target as HTMLInputElement;
    const originalValue = inputElement.value;
    const selectionStart = inputElement.selectionStart;
    const selectionEnd = inputElement.selectionEnd;

    const { newText, newSelectionStart, newSelectionEnd } =
      this.funcionesService.formatInputText(
        originalValue,
        caseType,
        selectionStart,
        selectionEnd
      );
    inputElement.value = newText;
    inputElement.setSelectionRange(newSelectionStart, newSelectionEnd);
    const control = this.formPerson.get(formControlNameValue);
    if (control) {
      control.setValue(newText, { emitEvent: false });
    }
  }
}
