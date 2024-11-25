import { Module } from '@nestjs/common';
import { FallaService } from './falla.service';
import { FallaController } from './falla.controller';

@Module({
  controllers: [FallaController],
  providers: [FallaService],
})
export class FallaModule {}
