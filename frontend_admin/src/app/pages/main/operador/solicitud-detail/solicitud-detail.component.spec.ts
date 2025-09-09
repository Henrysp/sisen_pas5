import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudDetailComponent } from './solicitud-detail.component';

describe('SolicitudDetailComponent', () => {
  let component: SolicitudDetailComponent;
  let fixture: ComponentFixture<SolicitudDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SolicitudDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitudDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
