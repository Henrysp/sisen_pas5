import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { DuplicatedRecordException } from '../exceptions/duplicated-record.exception';

@Catch(DuplicatedRecordException)
export class DuplicatedRecordFilter implements ExceptionFilter {
  catch(exception: DuplicatedRecordException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.getStatus()).json({
      statusCode: exception.getStatus(),
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: 'DuplicatedRecordFilter',
    });
  }
}
