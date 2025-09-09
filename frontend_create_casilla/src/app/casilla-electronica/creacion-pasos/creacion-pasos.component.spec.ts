import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreacionPasosComponent } from './creacion-pasos.component';

describe('CreacionCasillaElectronicaStepsComponent', () => {
  let component: CreacionPasosComponent;
  let fixture: ComponentFixture<CreacionPasosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreacionPasosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreacionPasosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
