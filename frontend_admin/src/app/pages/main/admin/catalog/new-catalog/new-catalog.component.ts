import { getSupportedInputTypes } from '@angular/cdk/platform';
import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CatalogService } from 'src/app/services/catalog.service';
import { FuncionesService } from 'src/app/utils/funciones.service';

@Component({
  selector: 'app-new-catalog',
  templateUrl: './new-catalog.component.html',
  styleUrls: ['./new-catalog.component.scss']
})
export class NewCatalogComponent implements OnInit {
  form: FormGroup;
  types: [];
  lbl_insert : string;
  isLoading = false;
  code: FormControl;
  value: FormControl;
  valueold: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
              private dialogRef: MatDialogRef<NewCatalogComponent>,
              private fb: FormBuilder,
              private renderer: Renderer2,
              private funcionesService: FuncionesService,
              private catalogService: CatalogService) { }

  ngOnInit() {
    this.lbl_insert = this.data ? 'Actualizar datos del procedimiento' : 'Ingresar datos del procedimiento';
    this.valueold = this.data ? this.data.value : '';
    this.code = new FormControl({
      value: this.data ? this.data.code : '',
      disabled: true, // this.data ? true : this.isLoading,
    }, [Validators.required]);

    this.value = new FormControl({
      value: this.data ? this.data.value : '',
      disabled: this.isLoading,
    }, [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s$)(?!.*\s{2,}).*$/)]);

    this.form = this.fb.group({
      type: this.fb.control({
        value: this.data ? this.data.type : '',
        disabled: this.data ? true : this.isLoading,
      }, [Validators.required]),
      code: this.code,
      value: this.value
    });
    this.form.get('type').setValue('procedure');
    this.data ? '' : this.getLastCode();
  }

  getTypes = async () => {
    this.catalogService.gettypes().subscribe(resp => {
      this.types = resp;
    });
  }

  getLastCode = async () => {
    this.catalogService.nextcodeCatalog('procedure').subscribe(resp => {
      const res: string = resp;
      this.form.get('code').setValue(res);
    });
  }

  submit = () => {
    if (!this.form.valid) { return; }
    const formValue = this.form.getRawValue();

    this.isLoading = true;
    const promise = !this.data
      ? this.catalogService.createCatalog({
        type: formValue.type,
        code: formValue.code,
        value: formValue.value.toUpperCase().trim(),
      })
      : this.catalogService.updateCatalog({
        id: this.data.id,
        type: formValue.type,
        value: formValue.value.toUpperCase().trim(),
        valueold: this.valueold.toUpperCase().trim()
      });

    promise.subscribe(
      (res) => {
        this.isLoading = false;
        if (res.success) {
          this.funcionesService.mensajeOk(
            'Los datos del catálogo fueron registrados con éxito'
          );
          this.dialogRef.close(true);
        } else {
          this.funcionesService.mensajeError(res.error);
        }
      },
      (err) => {
        this.isLoading = false;
        console.log('Problemas del servicio', err);
      }
    );
  }
  eShowError = (input, error = null) => {
    if (error.required !== undefined) {
      return 'Campo requerido';
    } else if (error.pattern !== undefined) {
      return 'Formato no válido';
    } else if (error.minlength !== undefined) {
      return 'Se requiere ' + error.minlength.requiredLength + ' caracteres como mínimo' ;
    } else {
      return 'Campo inválido';
    }
  };

  cancel() {
    this.dialogRef.close();
  }

  quitarDobleEspacio(idInput: string, inputForm: FormControl, e: any) {
    const charCode = e.which ? e.which : e.keyCode;
    if (charCode > 32 && charCode!=32 && charCode!=34 && charCode!=42 && charCode!=45 && charCode!=46 && charCode!=95 && (charCode < 48 || charCode > 57)  && (charCode < 65 || charCode > 90) && (charCode < 97 || charCode > 122)  && (charCode < 129 || charCode > 154)  && (charCode < 160 || charCode > 165)) {  //32 space, 34 ", 42 *, 45 -,  46., 95 _
      return false;
    }
    let inicio = this.renderer.selectRootElement(`#${idInput}`).selectionStart;
    let fin = this.renderer.selectRootElement(`#${idInput}`).selectionEnd;
    let value : string = inputForm.value;
    if (e.metaKey || e.ctrlKey) {
      return true;
    }
    if(inicio == 0 && e.key === ' ') return false;
    if(e.key === 'Enter') return false;
    // inputForm.setValue(value.replace(/ {2,}/g, ' '));
    this.renderer.selectRootElement(`#${idInput}`).setSelectionRange(inicio, fin, 'none');
  }

}
