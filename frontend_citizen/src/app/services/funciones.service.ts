import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class FuncionesService {

  colorMtc: string = '';

  constructor() {
  }
  mensajeOk(text: string): Promise<null> {
    return new Promise((resolve) => {
      Swal.fire({
        text: text,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: 'green'
      }).then(() => {
        resolve();
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
        resolve();
      });
    });

  }

  mensajeConfirmar(text: string, title: string = null) {
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
          resolve();
        else
          reject();
      });
    });
  }

  jsonToFormData(data: any): FormData {
    const formData = new FormData();
    this.buildFormData(formData, data);
    return formData;
  }


  private buildFormData(formData: FormData, data: any, parentKey = undefined) {
    if (data && typeof data === 'object' && !(data instanceof Date) && !(data instanceof File)) {
      let separationOpen = '';
      let separationClose = '';
      Object.keys(data).forEach((key: any) => {
        if (isNaN(key) === true) {//es letra
          separationOpen = '.';
          separationClose = '';
        } else {//es número
          separationOpen = '[';
          separationClose = ']';
        }
        this.buildFormData(formData, data[key], parentKey ? `${parentKey}${separationOpen}${key}${separationClose}` : key);
      });
    } else {
      const value = data == null ? '' : data;

      formData.append(parentKey, value);
    }
  }

  downloadFile = (
    excelResponse,
    nameExcel = 'pdf',
  ) => {
    const dataType = excelResponse.type;
    const binaryData = [];
    binaryData.push(excelResponse);
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(
      new Blob(binaryData, { type: dataType }),
    );
    downloadLink.setAttribute('download', nameExcel);
    document.body.appendChild(downloadLink);
    downloadLink.click();
  };

  transformDate(dateTZ: string): Date {
    if (!dateTZ) { return null }
    const splitDate = dateTZ?.substr(0, 10).split("-");
    const splitHours = dateTZ?.substr(11, 8).split(":");
    const receivedDate = new Date(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2]), parseInt(splitHours[0]),
      parseInt(splitHours[1]), parseInt(splitHours[2]));
    return receivedDate;
  }
}
