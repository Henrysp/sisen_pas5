import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { HttpExceptionFilter } from './http-exception.filter'; // Importa el filtro de excepción

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Configurar helmet para establecer las cabeceras de seguridad
  //Update para el documento de vulnerabilidad
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 año en segundos
        includeSubDomains: true,
        preload: true,
      },
    })
  );
  // Restringir Origin y Referer
  app.use((req : any, res: any, next: any) => {
    const origin = req.headers.origin;
    // const referer = req.headers.referer;
    const allowedOrigin = process.env.CORS_ORIGIN_URL;
    if (!origin && req.headers.host && req.method === 'GET' && req.headers['sec-fetch-mode'] === 'navigate') {
      return next();
    }
    if (!origin) {
      // if (!origin || !referer) {
      return res.status(403).json({ error: 'Se requiere el encabezado Origin' });
    }
    const isValidOrigin = origin === allowedOrigin;
    // const isValidReferer = referer.startsWith(allowedOrigin);
    if (!isValidOrigin) {
      return res.status(403).json({ error: 'No tiene permisos para acceder a este recurso' });
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ origin: process.env.CORS_ORIGIN_URL != undefined ? process.env.CORS_ORIGIN_URL : '*' });

  // Usar el filtro de excepción global
  // Update para el documento de vulnerabilidad
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT);
  console.log('server running: http://localhost:' + process.env.PORT);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
