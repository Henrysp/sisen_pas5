import { UbigeosService } from '../services/ubigeos.service';
import { Controller, Get, Param } from '@nestjs/common';

@Controller()
export class UbigeosController {
  constructor(private readonly ubigeosService: UbigeosService) {}

  @Get('departamento')
  listaDepartamentos() {
    return this.ubigeosService.listaDepartamentos();
  }

  @Get('departamento/:codigod')
  listaProvinciasDepartamento(@Param('codigod') codigoDep: string) {
    return this.ubigeosService.listaProvincias(codigoDep);
  }

  @Get('departamento/:codigod/:codigop')
  listaDistritosProvincia(
    @Param('codigod') codigoDep: string,
    @Param('codigop') codigoProv: string,
  ) {
    return this.ubigeosService.listaDistritos(codigoDep, codigoProv);
  }
}
