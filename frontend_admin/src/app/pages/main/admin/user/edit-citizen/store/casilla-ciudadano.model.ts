import { Profile } from 'src/app/transversal/enums/global.enum';
import { ICasillaElectronica } from './../../interfaces/casilla.interfaces';

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

export const listProfile = [
  { id: Profile.RegistryOperator, value: 'Registrador' },
  { id: Profile.Notifier, value: 'Notificador' },
  { id: Profile.Administrador, value: 'Administrador' },
];

export const listDocRep = [
  { id: 'dni', value: 'DNI' },
  { id: 'ce', value: 'Carnet de Extranjería' },
];
