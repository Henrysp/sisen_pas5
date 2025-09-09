import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { searchNotifications } from '../models/notifications/notification';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class FuncionesService {

  colorMtc: string = '';

  constructor(private router: Router, private notificationService: NotificationService) {
  }

  mensajeOk(text: string, accionRedirect?: string, search?: searchNotifications): Promise<null> {
    return new Promise((resolve) => {
      Swal.fire({
        text: text,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: 'green'
      }).then(() => {
        if (accionRedirect !== undefined) {
          this.router.routeReuseStrategy.shouldReuseRoute = () => false;
          if (search != null) {
            this.notificationService.searchNotifications({textSearch: search.textSearch, pageIndex: search.pageIndex, pageSize: search.pageSize});
          }
          this.router.navigate([accionRedirect]);
        }
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

  mensajeErrorHtml(text: string): Promise<null> {
    return new Promise((resolve, reject) => {
      Swal.fire({
        html: text,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false,
        confirmButtonColor: '#23DF05'
      }).then(() => {
        resolve();
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
  mensajeConfirmarPassword(text: string, title: string = null) {
    return new Promise((resolve, reject) => {
      Swal.fire({
        title: title,
        text: text,
        input: 'password',
        icon: 'question',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        cancelButtonColor: '#b5b3b3',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Aceptar',
        reverseButtons: true,
      }).then((resultado) => {
        if (resultado.value) {
          resolve(resultado.value);
        }
        else if (resultado.value === ''){
          this.mensajeError('Ingrese una contraseña válida').then(r => reject());
        } else {
          reject();
        }
      });
    });
  }
  mensajeConfirmarInput(text: string, title: string = null, button: string) {
    return new Promise((resolve, reject) => {
      Swal.fire({
        title: title,
        text: text,
        input: 'text',
        icon: 'question',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        cancelButtonColor: '#b5b3b3',
        cancelButtonText: 'Cancelar',
        confirmButtonText: button,
        reverseButtons: true
      }).then((resultado) => {
        if (resultado.value) {
          resolve(resultado.value);
        } else if (resultado.value === '') {
          resolve(resultado.value);
        }
        else {
          reject();
        }
      });
    });
  }
  jsonToFormData(data: any): FormData {
    const formData = new FormData();
    this.buildFormData(formData, data);
    return formData;
  }

  showloading(subtitle: string = null, title: string = null){

    Swal.fire({
      title: title,
      html: subtitle,
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
      onBeforeOpen: () => {
        Swal.showLoading();
      }
    });
  }

  closeloading(){
    Swal.close();
  }

  private buildFormData(formData: FormData, data: any, parentKey = undefined) {
    if (data && typeof data === 'object' && !(data instanceof Date) && !(data instanceof File)) {
      let separationOpen = '';
      let separationClose = '';
      Object.keys(data).forEach((key: any) => {
        if (isNaN(key) === true) {//es letter
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

  colorLetter(name: string): string {
    const letter = name.substring(-1, 1)?.toUpperCase();
    if (letter === 'A' || letter === 'B' || letter === 'C') {
      return 'listCircle rdmColor_1';
    } else if (letter === 'D' || letter === 'E' || letter === 'F') {
      return 'listCircle rdmColor_2';
    } else if (letter === 'G' || letter === 'H' || letter === 'I') {
      return 'listCircle rdmColor_3';
    } else if (letter === 'J' || letter === 'K' || letter === 'L') {
      return 'listCircle rdmColor_4';
    } else if (letter === 'M' || letter === 'N' || letter === 'Ñ') {
      return 'listCircle rdmColor_5';
    } else if (letter === 'O' || letter === 'P' || letter === 'Q') {
      return 'listCircle rdmColor_6';
    } else if (letter === 'R' || letter === 'S' || letter === 'T') {
      return 'listCircle rdmColor_7';
    } else if (letter === 'U' || letter === 'V' || letter === 'W') {
      return 'listCircle rdmColor_8';
    } else if (letter === 'X' || letter === 'Y' || letter === 'Z') {
      return 'listCircle rdmColor_9';
    }
  }

  downloadFile = (
    excelResponse,
    nameExcel = 'fileExcel',
  ) => {
    const dataType = excelResponse.type;
    const binaryData = [];
    binaryData.push(excelResponse);
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(
      new Blob(binaryData),
      );
    downloadLink.setAttribute('download', nameExcel);
    document.body.appendChild(downloadLink);
    downloadLink.click();
  }
  transformDate(dateTZ: string): Date {
    if (!dateTZ) { return null }
    const splitDate = dateTZ?.substr(0, 10).split("-");
    const splitHours = dateTZ?.substr(11, 8).split(":");
    const receivedDate = new Date(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2]), parseInt(splitHours[0]),
      parseInt(splitHours[1]), parseInt(splitHours[2]));
    return receivedDate;
  }
  trimAllFields<T>(obj: T): T {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item =>
        typeof item === 'string' ? item.trim() : item
      ) as unknown as T;
    }

    const result = {} as Record<string, any>;

    Object.keys(obj).forEach(key => {
      const value = obj[key as keyof T];

      if (typeof value === 'string') {
        result[key] = value.trim();
      } else {
        result[key] = value;
      }
    });

    return result as T;
  }
formatInputText(
    currentText: string,
    caseType: 'uppercase' | 'lowercase' | 'none' | string,
    selectionStart: number | null,
    selectionEnd: number | null
  ): { newText: string; newSelectionStart: number; newSelectionEnd: number } {
    let processedText = currentText;
    let currentSelectionStart = selectionStart === null ? processedText.length : selectionStart;
    let currentSelectionEnd = selectionEnd === null ? processedText.length : selectionEnd;

    if (processedText.length > 0 && processedText.startsWith(' ')) {
      const originalLength = processedText.length;
      processedText = processedText.replace(/^\s+/, '');
      const removedChars = originalLength - processedText.length;
      currentSelectionStart = Math.max(0, currentSelectionStart - removedChars);
      currentSelectionEnd = Math.max(0, currentSelectionEnd - removedChars);
    }

    let tempText = '';
    let inSpaceSequence = false;
    let spacesCollapsedBeforeCursor = 0;

    for (let i = 0; i < processedText.length; i++) {
      const char = processedText[i];
      if (char === ' ') {
        if (!inSpaceSequence) {
          tempText += ' ';
          inSpaceSequence = true;
        } else {
          if (i < currentSelectionStart) {
            spacesCollapsedBeforeCursor++;
          }
        }
      } else {
        tempText += char;
        inSpaceSequence = false;
      }
    }
    processedText = tempText;
    currentSelectionStart -= spacesCollapsedBeforeCursor;
    currentSelectionEnd -= spacesCollapsedBeforeCursor;

    currentSelectionStart = Math.max(0, Math.min(currentSelectionStart, processedText.length));
    currentSelectionEnd = Math.max(0, Math.min(currentSelectionEnd, processedText.length));
    if (currentSelectionStart > currentSelectionEnd) {
      currentSelectionEnd = currentSelectionStart;
    }

    if (caseType === 'uppercase') {
      processedText = processedText.toUpperCase();
    } else if (caseType === 'lowercase') {
      processedText = processedText.toLowerCase();
    }
    return {
      newText: processedText,
      newSelectionStart: currentSelectionStart,
      newSelectionEnd: currentSelectionEnd,
    };
  }
}
