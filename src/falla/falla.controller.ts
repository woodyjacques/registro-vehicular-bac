import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FallaService } from './falla.service';

@ApiTags("registro-falla");
@Controller('registro-falla')
export class FallaController {
  constructor(private readonly fallaService: FallaService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(
    @Body() body: any
  ) {

    const { revisiones, observacion, lastPlacaInfo } = body;
    const result = await this.insRegistroEntradaService.processRegistroEntrada(revisiones, observacion, lastPlacaInfo);

    return result;
  }
  
}
