import { Directive, Input, ElementRef } from '@angular/core';

@Directive({
  selector: '[appFocus]'
})
export class FocusDirective {
  @Input() set appFocus(value: boolean) {
    if (value) {
      this.elementRef.nativeElement.focus();
    }
  }

  constructor(private elementRef: ElementRef) { }
}
