import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appBlockCopyPaste]'
})
export class BlockCopyPasteDirective {
  constructor() { }

  @HostListener('paste', ['$event']) blockPaste(e: KeyboardEvent) {
    e.preventDefault();
  }

  @HostListener('copy', ['$event']) blockCopy(e: KeyboardEvent) {
    e.preventDefault();
  }

  @HostListener('cut', ['$event']) blockCut(e: KeyboardEvent) {
    e.preventDefault();
  }
  
  @HostListener('dragover', ['$event']) onDragOver(e: KeyboardEvent) {
    e.preventDefault();
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(e: KeyboardEvent) {
    e.preventDefault();
  }

  @HostListener('drop', ['$event']) public ondrop(e: KeyboardEvent) {
    e.preventDefault();
  }
  
}