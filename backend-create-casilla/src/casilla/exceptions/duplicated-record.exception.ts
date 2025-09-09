import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicatedRecordException extends HttpException {
  constructor(message: string) {
    super(`${message} `, HttpStatus.BAD_REQUEST);
    //super(`${name} está en uso por otro registro, use otro`, HttpStatus.BAD_REQUEST);
  }
}
