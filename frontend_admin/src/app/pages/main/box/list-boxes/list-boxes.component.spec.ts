import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListBoxesComponent } from './list-boxes.component';

describe('ListBoxesComponent', () => {
  let component: ListBoxesComponent;
  let fixture: ComponentFixture<ListBoxesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListBoxesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
