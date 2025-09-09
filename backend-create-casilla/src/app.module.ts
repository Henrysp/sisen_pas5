import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { CasillaModule } from './casilla/casilla.module';
import { SoapModule } from 'nestjs-soap';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    CasillaModule
    // ,
    // SoapModule.register(
    //   { clientName: 'MY_DUMMY_CLIENT', uri: 'https://ws3.pide.gob.pe/Rest/Sunat/DatosPrincipales' }
    // )


  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
