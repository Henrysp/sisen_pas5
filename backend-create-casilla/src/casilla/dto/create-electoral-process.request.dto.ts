import { IsInt, IsNotEmpty, Length, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateElectoralProcessRequestDto {
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

  @IsNotEmpty()
 // @IsInt()
  @MinLength(4)
  //@MaxLength(4)
  year: string; // año al que corresponde el proceso electoral
}
