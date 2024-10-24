import { Controller, Post, UseInterceptors, UploadedFile, Body, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(
    @Body('placa') placa: string,
    @Body('conductor') conductor: string,
    @Body('sucursal') sucursal: string,
    @Body('fechaRegistro') fechaRegistro: string,
    @Body('uniqueIdentifier') uniqueIdentifier: string,
    @UploadedFile() documento: Express.Multer.File,
  ) {
    const result = await this.appService.handleData(placa, conductor, sucursal, fechaRegistro, uniqueIdentifier, documento);

    return result;
  }

  @Get('get-data')
  async getData() {
    const data = await this.appService.getDataFromSheet();
    return data;
  }

}
