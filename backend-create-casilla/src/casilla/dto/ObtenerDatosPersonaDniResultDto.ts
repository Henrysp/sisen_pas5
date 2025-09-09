export class ObtenerDatosPersonaDniResultDto {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

export class ResponseValidateData{
  status !: boolean;
  mensaje !: string;
}

export class requestGlobal {
  correoElectronico !: string;
  numeroCelular!: string;
  telefono!: string;
  domicilioFisico!: string;
  nombres!: string;
  apePaterno: string;
  apeMaterno: string;
  tipoDocumento!: string;
  numeroDocumento!: string;
  razonSocial!: string;
  file!: File;

  TipoPersona !: string;
  departamento!: string;
  provincia!: string;
  distrito!: string;
}


