import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InspeccionModule } from './inspeccion/inspeccion.module';
import { SalidasModule } from './salidas/salidas.module';

@Module({
  imports: [InspeccionModule, SalidasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
