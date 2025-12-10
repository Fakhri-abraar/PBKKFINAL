import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    // [UBAH] Ganti 'image' jadi 'file' dan hapus fileFilter
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // [OPSIONAL] Saya naikkan limit jadi 10MB untuk file dokumen
      },
      // fileFilter dihapus agar semua jenis file bisa masuk
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            'file-' + Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      // [UBAH] Return filePath agar lebih umum (bukan imagePath)
      filePath: file.filename,
    };
  }
}