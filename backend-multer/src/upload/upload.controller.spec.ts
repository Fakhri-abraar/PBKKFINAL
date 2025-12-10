import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { BadRequestException } from '@nestjs/common';

describe('UploadController', () => {
  let controller: UploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should return file path on successful upload', () => {
      const mockFile = {
        filename: 'test-image.jpg',
        path: 'uploads/test-image.jpg',
      } as Express.Multer.File;

      const result = controller.uploadFile(mockFile);
      
      // [FIX] Gunakan 'imagePath' sesuai kode controller Anda
      expect(result).toEqual({
        imagePath: 'test-image.jpg',
      });
    });

    it('should throw BadRequestException if no file provided', () => {
      // [FIX] Menggunakan 'as any' untuk memaksa null saat testing
      expect(() => controller.uploadFile(null as any)).toThrow(BadRequestException);
    });
  });
});