import { IsInt, IsNotEmpty, Length, Matches } from 'class-validator';

export class UpdateElectoralProcessRequestDto {
  @IsNotEmpty()
  @Length(2, 300)
  @Matches('^[^{}<>%$]*$')
  id: string;

  @IsNotEmpty()
  @Length(2, 300)
  @Matches('^[^{}<>%$]*$')
  name: string;

  @IsNotEmpty()
  @Length(2, 100)
  shortName: string;

  @IsNotEmpty()
  @Length(2, 300)
  description: string;

  @IsNotEmpty() // año al que corresponde el proceso electoral
  @IsInt()
  @Length(4, 4)
  year: string;
}
