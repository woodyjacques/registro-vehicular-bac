import { Body, Controller, Post } from '@nestjs/common';
import { SalidasService } from './salidas.service';

@Controller('salidas')
export class SalidasController {
  constructor(private readonly salidasService: SalidasService) {}
  @Post()
  async registrarSalida(@Body() body: { placa: string; fechaSalida: string }) {
    const { placa, fechaSalida } = body;
    return await this.salidasService.registrarSalida(placa, fechaSalida);
  }
}
