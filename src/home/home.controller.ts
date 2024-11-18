import { Controller, Post, Body } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {

  constructor(private readonly homeService: HomeService) { }

  @Post('register-placa')
  async registerPlaca(@Body() body: any) {
    const { placa } = body;
    const result = await this.homeService.checkPlaca(placa);
    return result;
  }
}
