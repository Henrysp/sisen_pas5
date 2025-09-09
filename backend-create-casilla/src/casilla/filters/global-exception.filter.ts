import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      //message: exception.message?.message || exception.message || 'Internal Server Error',
      message: exception.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      //path: request.url,
      path: 'GlobalExceptionFilter',
    });
  }
}
