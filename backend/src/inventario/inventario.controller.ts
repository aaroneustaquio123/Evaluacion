import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { InventarioService } from './inventario.service';
import { InventarioUploadResponseDto } from './dto/inventario-upload-response.dto';

@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<InventarioUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Por favor seleccione un archivo para subir.');
    }

    // Validar extensión .xlsx o tipo MIME de Excel
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExt = validExtensions.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext),
    );

    if (!hasValidExt) {
      throw new BadRequestException(
        'Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx).',
      );
    }

    return this.inventarioService.procesarExcel(file);
  }
}
