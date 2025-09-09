import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificacionNavegadorComponent } from './verificacion-navegador.component';

describe('VerificacionNavegadorComponent', () => {
  let component: VerificacionNavegadorComponent;
  let fixture: ComponentFixture<VerificacionNavegadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VerificacionNavegadorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerificacionNavegadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
