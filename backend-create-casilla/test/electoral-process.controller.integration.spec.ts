import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Asegúrate de tener la ruta correcta

describe('ElectoralProcessController (Integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        MongooseModule.forRoot('mongodb://localhost/test', { useNewUrlParser: true, useUnifiedTopology: true }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/electoral-processes (GET)', () => {
    return request(app.getHttpServer())
      .get('/electoral-processes')
      .expect(200)
      .expect([]);
  });

  // Similar tests for other controller methods
});
