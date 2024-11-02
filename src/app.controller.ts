import { Controller, Post, UseInterceptors, Body, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(
    @Body() body: any
  ) {
    const {
      placa,
      conductor,
      sucursal,
      tipoVehiculo,
      horaSalida,
      odometroSalida,
      fechaRegistro,
      uniqueIdentifier,
      llantasParte1,
      llantasParte2,
      fluidos,
      parametrosVisuales,
      luces,
      insumos,
      documentacion,
      danosCarroceria,
      revisiones
    } = body;

    const result = await this.appService.handleData(
      placa,
      conductor,
      sucursal,
      tipoVehiculo,
      horaSalida,
      odometroSalida,
      fechaRegistro,
      uniqueIdentifier,
      llantasParte1,
      llantasParte2,
      fluidos,
      parametrosVisuales,
      luces,
      insumos,
      documentacion,
      danosCarroceria,
      revisiones
    );

    return result;
  }

  @Get('get-data')
  async getData() {
    const data = await this.appService.getPlacasFromSheet();
    return data;
  }

}
