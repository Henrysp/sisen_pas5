import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ubigeo, UbigeoDocument } from '../schemas/ubigeo.schema';

export class UbigeosService {
  constructor(
    @InjectModel(Ubigeo.name)
    private ubigeoModel: Model<UbigeoDocument>,
  ) {}

  listaDepartamentos() {
    return this.ubigeoModel
      .find(
        {
          ubprv: '00',
          estubi: '1',
        },
        {
          _id: 0,
          ubdep: 1,
          nodep: 1,
        },
      )
      .sort({ ubdep: 1 });
  }

  listaProvincias(codigoDepartamento: string) {
    console.log('lista de provincias ', codigoDepartamento, 'no funciona');
    return this.ubigeoModel
      .find(
        {
          ubdep: codigoDepartamento,
          ubdis: '00',
          estubi: '1',
          noprv: { $exists: true },
        },
        {
          _id: 0,
          ubdep: 1,
          ubprv: 1,
          noprv: 1,
        },
      )
      .sort({ noprv: 1 });
  }

  listaDistritos(codigoDepartamento: string, codigoProvincia: string) {
    console.log('lista distritos', codigoDepartamento, codigoProvincia);
    return this.ubigeoModel
      .find(
        {
          ubdep: codigoDepartamento,
          ubprv: codigoProvincia,
          estubi: '1',
          nodis: { $exists: true },
        },
        {
          _id: 0,
          ubdep: 1,
          ubprv: 1,
          ubdis: 1,
          nodis: 1,
        },
      )
      .sort({ nodis: 1 });
  }
}
