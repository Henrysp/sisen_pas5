import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudDetailPjComponent } from './solicitud-detail-pj.component';

describe('SolicitudDetailPjComponent', () => {
  let component: SolicitudDetailPjComponent;
  let fixture: ComponentFixture<SolicitudDetailPjComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SolicitudDetailPjComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitudDetailPjComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
