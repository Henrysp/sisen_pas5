import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnInit {

  @Input() label = ''
  @Input() title = ''
  @Input() description = ''
  @Output() fileDropped = new EventEmitter<any>();

  message = 'No se ha cargado ningún archivo'

  constructor() {
  }

  ngOnInit(): void {
  }

  onFileDropped(event: any) {
    this.prepareFilesList(event);
  }

  fileBrowseHandler(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    this.prepareFilesList(files);
  }

  prepareFilesList(fileList: FileList) {
    this.message = 'Archivo cargado'
    const files = Array.from(fileList)
    if (files.length > 0) {
      this.fileDropped.emit(files[0])
    }
  }
}
