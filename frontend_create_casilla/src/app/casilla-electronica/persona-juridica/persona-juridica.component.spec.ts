import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonaJuridicaComponent } from './persona-juridica.component';

describe('PersonaJuridicaComponent', () => {
  let component: PersonaJuridicaComponent;
  let fixture: ComponentFixture<PersonaJuridicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PersonaJuridicaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonaJuridicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
