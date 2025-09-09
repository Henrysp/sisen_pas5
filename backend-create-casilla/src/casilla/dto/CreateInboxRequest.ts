import { IsEmail, IsNotEmpty, IsOptional, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateInboxRequest {
  @IsNotEmpty()
  @Length(2, 3)
  @Matches('^(dni|DNI|ce|CE)$')
  docType: string;

  @Length(8, 9)
  @IsNotEmpty()
  @Matches('^[0-9]*$')
  doc: string;

  // @Length(9, 200)
  // @IsNotEmpty()
  // @IsOptional()
  // @Matches('^[^{}<>%$]*$')
  // razonSocial: string;

  @Length(1, 100)
  @IsNotEmpty()
  @Matches('^[^{}<>%$]*$')
  name: string;

  @MaxLength(100)
  @IsOptional()
  @Matches('^[^{}<>%$]*$')
  lastname: string;

  @MaxLength(100)
  @IsOptional()
  @Matches('^[^{}<>%$]*$')
  second_lastname: string;

  @Length(5, 100)
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Length(9, 9)
  @IsNotEmpty()
  @Matches('^[0-9]*$')
  cellphone: string;

  @IsOptional()
  phone: string;

  @IsNotEmpty()
  ubigeo: string;

  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @IsNotEmpty()
  @Matches('^(pn|pj)$')
  personType: string;

  @IsNotEmpty()
  recaptcha: string;
}
