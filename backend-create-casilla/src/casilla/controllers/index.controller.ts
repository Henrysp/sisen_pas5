import { Controller, Get } from '@nestjs/common';
import { CasillaService } from '../services/casilla.service';

@Controller()
export class IndexController {
  constructor(private readonly casillaService: CasillaService) {
  }

  @Get()
  getHello(): string {
    console.log('saludando 123');
    return this.casillaService.saludar('Dyn ...');
  }
}
