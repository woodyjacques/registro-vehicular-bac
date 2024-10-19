import { Module } from '@nestjs/common';
import { InspeccionService } from './inspeccion.service';
import { InspeccionController } from './inspeccion.controller';

@Module({
  controllers: [InspeccionController],
  providers: [InspeccionService],
})
export class InspeccionModule {}
