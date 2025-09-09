import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidacionCorreoComponent } from './validacion-correo.component';

describe('ValidacionCorreoComponent', () => {
  let component: ValidacionCorreoComponent;
  let fixture: ComponentFixture<ValidacionCorreoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidacionCorreoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidacionCorreoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
