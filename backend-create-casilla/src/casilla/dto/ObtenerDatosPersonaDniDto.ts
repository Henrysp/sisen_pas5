import { IsEmail, IsNotEmpty, Matches } from "class-validator";

export class ObtenerDatosPersonaDniDto {
  dni: string;
  recaptcha: string;
}

export class RequestValidateData {
  @IsNotEmpty()
  tipoDocumento: string;

  @IsNotEmpty()
  @Matches('^[0-9]*$')
  nroDocumento: string;

  @IsNotEmpty()
  fechaNacimiento: string;

  @IsNotEmpty()
  codigoVerifi: string;

  @IsEmail()
  correo: string;

  @IsNotEmpty()
  recaptcha: string;
}
