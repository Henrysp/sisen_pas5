import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatosRepresentanteComponent } from './datos-representante.component';

describe('DatosRepresentanteComponent', () => {
  let component: DatosRepresentanteComponent;
  let fixture: ComponentFixture<DatosRepresentanteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DatosRepresentanteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatosRepresentanteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
