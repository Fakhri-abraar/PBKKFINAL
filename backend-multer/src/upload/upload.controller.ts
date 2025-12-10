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
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // Limit 10MB
      },
      // [PERBAIKAN] Menambahkan fileFilter untuk validasi tipe file
      fileFilter: (req, file, callback) => {
        // Regex untuk mengizinkan jpg, jpeg, png, pdf, doc, dan docx
        // Huruf 'i' berarti case-insensitive (JPG sama dengan jpg)
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx)$/i)) {
          return callback(
            new BadRequestException(
              'Hanya file gambar (jpg, png) dan dokumen (pdf, docx) yang diperbolehkan!',
            ),
            false,
          );
        }
        callback(null, true);
      },
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
    // Validasi tambahan jika fileFilter menolak file (file akan undefined)
    if (!file) {
      throw new BadRequestException('File is required or invalid file type');
    }
    return {
      filePath: file.filename,
    };
  }
}