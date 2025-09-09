import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudDetailValidComponent } from './solicitud-detail-valid.component';

describe('SolicitudDetailValidComponent', () => {
  let component: SolicitudDetailValidComponent;
  let fixture: ComponentFixture<SolicitudDetailValidComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SolicitudDetailValidComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitudDetailValidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
