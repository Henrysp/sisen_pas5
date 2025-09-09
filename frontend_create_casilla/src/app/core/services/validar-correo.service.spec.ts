import { TestBed } from '@angular/core/testing';

import { ValidarCorreoService } from './validar-correo.service';

describe('ValidarCorreoService', () => {
  let service: ValidarCorreoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidarCorreoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
