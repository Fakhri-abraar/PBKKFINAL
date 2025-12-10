import { Test, TestingModule } from '@nestjs/testing';
import { UploadModule } from './upload.module';
import { UploadController } from './upload.controller';

describe('UploadModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UploadModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(UploadController)).toBeDefined();
  });
});