import { Module } from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';

@Module({
  controllers: [SalidasController],
  providers: [SalidasService],
})
export class SalidasModule {}
