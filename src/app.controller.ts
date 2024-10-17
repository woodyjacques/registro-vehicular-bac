import { Controller, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(
    @Body('placa') placa: string,
    @Body('conductor') conductor: string,
    @Body('sucursal') sucursal: string,
    @UploadedFile() documento: Express.Multer.File,
  ) {

    const result = this.appService.handleData(placa, conductor, sucursal);

    return result;
  }
}
