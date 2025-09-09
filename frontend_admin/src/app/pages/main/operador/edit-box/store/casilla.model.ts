import { ICasillaElectronica } from './casilla.interface';

export class CasillaElectronica implements ICasillaElectronica {
  //Candidato - Org
  tipoDocumento = null;
  documento = '';
  //Representante
  tipoDocumentoRep = null;
  documentoRep = '';
  // ----
  nombres = '';
  apPaterno = '';
  apMaterno = '';
  correo = '';
  telefono = '';
  celular = '';
  direccion = '';
  acreditacion = null;
  razonSocial = '';
}

export const listDoc = [
  { id: 'dni', value: 'DNI' },
  { id: 'ce', value: 'Carnet de Extranjería' },
  { id: 'ruc', value: 'RUC' },
];

export const listDocRep = [
  { id: 'dni', value: 'DNI' },
  { id: 'ce', value: 'Carnet de Extranjería' },
];
