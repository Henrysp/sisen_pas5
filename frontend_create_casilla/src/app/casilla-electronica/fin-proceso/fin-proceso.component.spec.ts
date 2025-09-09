import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinProcesoComponent } from './fin-proceso.component';

describe('FinProcesoComponent', () => {
  let component: FinProcesoComponent;
  let fixture: ComponentFixture<FinProcesoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinProcesoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinProcesoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
