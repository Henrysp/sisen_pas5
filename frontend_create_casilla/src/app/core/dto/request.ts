import { ElectoralProcessDTO } from "./electotral-process.dto";

export class requestGlobal{
  correoElectronico !: string;
  numeroCelular!: string;
  telefono!: string;
  domicilioFisico!: string;
  nombres!: string;
  apePaterno !: string;
  apeMaterno !: string;
  tipoDocumento!: string;
  tipoDocumentoDes!: string;
  numeroDocumento!: string;
  fechaNacimiento!: string;
  razonSocial!: string;
  numeroPartida!: string;
  asientoRegistral!: string;
  file!: File;
  fileDocument !: File[];
  TipoPersona !: string;
  paginaWeb !: string;
  representante : RequestRepresentante = new RequestRepresentante();
  tesorero : RequestRepresentante = new RequestRepresentante();
  repre : RequestRepresentante = new RequestRepresentante();
  presidente : RequestRepresentante = new RequestRepresentante();
  perfilOP : RequestRepresentante = new RequestRepresentante();
  departamento!: string;
  provincia!: string;
  distrito!: string;
  recaptcha!: string;
  fileDocumentPJ!:File[];
  statusCandidateElectoralProcess!: 'Sí' | 'No';
  electoralProcess!: ElectoralProcessDTO;
  orgPol!: string;
}


export class RequestPersonaNatural{
  tipoDocumento!: string;
  numeroDocumento!: string;
  apePaterno !: string;
  apeMaterno !: string;
  nombres!: string;
  nombrePadre!: string;
  nombreMadre!: string;
  fechaNacimento!: Date;
  digitoVerificacion!: string;
  correoElectronico!: string;
  numeroCelular!: string;
  // departamento!: string;
  // provincia!: string;
  // distrito!: string;
  domicilioFisico!: string;
}



export class RequestPersonaJuridica{
  tipoDocumento!: string;
  numeroDocumento!: string;
  razonSocial!: string;
  correoElectronico!: string;
  telefono!: string;
  // departamento!: string;
  // provincia!: string;
  // distrito!: string;
  direccion!: string;
  paginaWeb!: string;
}

export class RequestRepresentante{
  documentTypeAttachment!: string;
  documentNameAttachment!: string;
  asientoRegistralRep!: string;
  // documentoArchivo: ['', Validators.required],
  docType!: string;
  doc!: string;
  //nombreCompleto !: string;
  names !: string;
  lastname!: string;
  second_lastname !: string;
  email!: string;
  cellphone!: string;
  address!: string;
  position!: string;
  positionName!: string;
  phone!: string;
  alterno!: boolean;
  // file!: File;
  // departamento !: string;
  // provincia !: string;
  // distrito !: string;
  ubigeo !: string;
}

export class RequestTerminos{
  terminosCondiciones!: boolean;
  //politicasDatos!: boolean;
  autorizacionNotificaciones!: boolean;
}
