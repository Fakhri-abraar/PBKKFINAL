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
      } as Express.Multer.File;

      const result = controller.uploadFile(mockFile);

      expect(result).toEqual({
        filePath: 'test-image.jpg',
      });
    });

    it('should throw BadRequestException if file is missing', () => {
      // [FIX] Gunakan 'as any' untuk mem-bypass pengecekan tipe statis TypeScript
      // karena kita sengaja ingin mengirim null/undefined untuk testing error
      expect(() => controller.uploadFile(null as any)).toThrow(BadRequestException);
    });
  });
});