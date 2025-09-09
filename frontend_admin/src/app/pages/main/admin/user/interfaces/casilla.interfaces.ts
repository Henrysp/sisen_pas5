export interface ICasillaElectronica {
  //Candidato - Org
  tipoDocumento: number;
  documento: string;
  //Representante
  tipoDocumentoRep: number;
  documentoRep: string;
  // ----
  nombres: string;
  apPaterno: string;
  apMaterno: string;
  correo: string;
  telefono: string;
  celular: string;
  direccion: string;
  acreditacion: number;
  razonSocial: string;
}

// export class ITypeDocument {
//   id: string;
//   value: string;
// }
// export class TypeAccreditation {
//   code: string;
//   value: string;
// }
