import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlacasModule } from './placas/placas.module';
import { InsRegistroSalidaModule } from './ins-registro-salida/ins-registro-salida.module';
import { HomeModule } from './home/home.module';

@Module({
  imports: [PlacasModule, InsRegistroSalidaModule, HomeModule],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService] 
})
export class AppModule {}
