import { Controller, Post, UseInterceptors, Body, Get, UploadedFile } from '@nestjs/common';
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
      placa, conductor, sucursal, tipoVehiculo, odometroSalida,
        llantasParte1, llantasParte2, observacionGeneralLlantas,fluidos, observacionGeneralFluido
    } = body;


    const result = await this.appService.handleData(
      placa, conductor, sucursal, tipoVehiculo, odometroSalida,
      llantasParte1, llantasParte2, observacionGeneralLlantas, fluidos, observacionGeneralFluido
    );

    // llantasParte1, llantasParte2, fluidos, parametrosVisuales, luces,
    // insumos, documentacion, danosCarroceria

    return result;
  }

  @Post('reporte')
  @UseInterceptors(FileInterceptor('file'))
  async enviarReporte(@UploadedFile() file: Express.Multer.File) {
    await this.appService.sendDocumentAsEmailAttachment(file);
    return { message: 'Correo enviado con éxito.' };
  }

  @Post('registrar-alerta')
  async registrarAlerta(@Body() body: any) {
    const { placa, conductor, fechaSalida, sucursal, horaSalida, alerta } = body;

    const result = await this.appService.handleDataSalida(placa, conductor, fechaSalida, sucursal, horaSalida, alerta);

    return result;
  }

  @Get('get-data')
  async getData() {
    const data = await this.appService.getPlacasFromSheet();
    return data;
  }

  @Get('get-salidas')
  async getDataSalidas() {
    const data = await this.appService.getDataSalidas();
    return data;
  }

}
