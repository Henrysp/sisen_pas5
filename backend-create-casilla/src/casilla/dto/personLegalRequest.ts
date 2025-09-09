import { IsEmail, IsNotEmpty, IsNumber, IsNumberString, IsOptional, Length, Matches, MaxLength } from 'class-validator';

export class PersonLegalRequest {
  @IsNotEmpty({ message: 'El RUC no debe estar vacia' })
  @Length(11, 11, { message: 'El RUC debe tener 11 caracteres' })
  @IsNumberString({}, { message: 'El RUC debe ser numérico' })
  // @Matches(/^2[0-9]*$/gm, { message: 'El primer dígito del  RUC debe ser 2' })
  @Matches('^20[0-9]*$')
  ruc: string;

  @IsNotEmpty({ message: 'El recaptcha no debe estar vacia' })
  recaptcha: string;
}

export class ValidPersonLegalRequest {
  @IsNotEmpty()
  docType: string;

  //@Matches('^[0-9]*$')
  @IsNotEmpty()
  doc: string;

  @IsNotEmpty()
  @Length(1, 200)
  @Matches('^[^{}<>%$]*$')
  organizationName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Matches('^[0-9]*$')
  cellphone: string;

  @IsOptional()
  phone: string;

  @IsNotEmpty()
  ubigeo: string;

  @IsNotEmpty()
  address: string;

  @IsOptional()
  webSite: string;

  @IsNotEmpty()
  recaptcha: string;
}

export class RepresentativeRequest {
  @IsNotEmpty({ message: 'El DNI no debe estar vacia' })
  @Length(8, 8, { message: 'El DNI debe tener 8 caracteres' })
  @IsNumberString({}, { message: 'El DNI debe ser numérico' })
  dni: string;

  @IsNotEmpty({ message: 'El recaptcha no debe estar vacia' })
  recaptcha: string;
}

export class ValidateRepresentativeRequest {
  @IsNotEmpty()
  ruc: string;

  @Length(2, 3)
  @IsNotEmpty()
  @Matches('^(dni|DNI|ce|CE)$')
  docType: string;

  @Length(8, 9)
  @IsNotEmpty()
  @Matches('^[0-9]*$')
  doc: string;

  @IsOptional()
  @Matches('^[^{}<>%$]*$')
  asientoRegistralRep: string;

  @Length(1, 100)
  @IsNotEmpty()
  @Matches('^[^{}0<>%$]*$')
  names: string;

  @MaxLength(100)
  @IsOptional()
  @Matches('^[^{}<>%$]*$')
  lastname: string;

  @Length(5, 50)
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Length(9, 9)
  @IsNotEmpty()
  @Matches('^[0-9]*$')
  cellphone: string;

  @IsOptional()
  phone: string;

  ubigeo: string;

  address: string;

  @IsOptional()
  position: string;

  @IsOptional()
  documentTypeAttachment: string;

  @MaxLength(100)
  @IsOptional()
  documentNameAttachment: string;

  @IsNotEmpty({ message: 'El recaptcha no debe estar vacia' })
  recaptcha: string;
}

export class InboxPersonLegalRequest {
  @Length(2, 3)
  @IsNotEmpty()
  docType: string;

  //@Matches('^[0-9]*$')
  @IsNotEmpty()
  @Length(2, 50)
  doc: string;

  @IsNotEmpty()
  @Length(1, 200)
  @Matches('^[^{}<>%$]*$')
  organizationName: string;

  @Length(5, 100)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Length(9, 9)
  @Matches('^[0-9]*$')
  cellphone: string;

  @IsOptional()
  phone: string;

  @IsNotEmpty()
  ubigeo: string;

  @IsNotEmpty()
  address: string;

  @IsOptional()
  webSite: string;

  @IsNotEmpty()
  rep: string;

  @IsNotEmpty()
  @Matches('^(pn|pj)$')
  personType: string;

  @IsNotEmpty()
  recaptcha: string;
}
