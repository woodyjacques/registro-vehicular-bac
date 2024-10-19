import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InspeccionModule } from './inspeccion/inspeccion.module';

@Module({
  imports: [InspeccionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
