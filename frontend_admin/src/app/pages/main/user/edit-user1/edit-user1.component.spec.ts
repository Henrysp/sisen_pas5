import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditUser1Component } from './edit-user1.component';

describe('EditUser1Component', () => {
  let component: EditUser1Component;
  let fixture: ComponentFixture<EditUser1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditUser1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditUser1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
