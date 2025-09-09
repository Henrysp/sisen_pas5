import { IsNotEmpty } from "class-validator";

export class EnviarCorreoVerificacionDto {
  tipoDocumento: string;
  numeroDocumento: string;
  correoElectronico: string;

  @IsNotEmpty()
  recaptcha: string;
}
