import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FotoDniComponent } from './foto-dni.component';

describe('FotoDniComponent', () => {
  let component: FotoDniComponent;
  let fixture: ComponentFixture<FotoDniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FotoDniComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FotoDniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
