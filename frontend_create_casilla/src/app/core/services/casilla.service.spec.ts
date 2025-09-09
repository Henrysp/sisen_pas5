import { TestBed } from '@angular/core/testing';

import { CasillaService } from './casilla.service';

describe('CasillaService', () => {
  let service: CasillaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CasillaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
