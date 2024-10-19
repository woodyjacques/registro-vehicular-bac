import { Controller, Post, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InspeccionService } from './inspeccion.service';
import { CreateInspeccionDto } from './dto/create-inspeccion.dto';

@Controller('inspeccion')
export class InspeccionController {
  constructor(private readonly inspeccionService: InspeccionService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('documentos', 10)) 
  create(
    @Body() createInspeccionDto: CreateInspeccionDto,
    @UploadedFiles() documentos: Array<Express.Multer.File>,
  ) {
    return this.inspeccionService.handleData(createInspeccionDto, documentos);
  }
}
