import { IsNotEmpty } from 'class-validator';

export class EnviarSMSVerificacionDto {
  tipoDocumento: string;
  numeroDocumento: string;
  numeroCelular: string;

  @IsNotEmpty()
  recaptcha: string;
}
