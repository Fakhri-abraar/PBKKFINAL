import { Test } from '@nestjs/testing';
import { Module, Global } from '@nestjs/common';
import { TasksModule } from './tasks.module';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MailerService } from '@nestjs-modules/mailer';

// 1. Buat Mock Global Module untuk MailerService
@Global()
@Module({
  providers: [
    {
      provide: MailerService,
      useValue: { sendMail: jest.fn() }, // Mock fungsi sendMail
    },
  ],
  exports: [MailerService],
})
class MockGlobalMailerModule {}

describe('TasksModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [
        TasksModule,
        MockGlobalMailerModule, // 2. Import module mock global di sini
      ],
    }).compile();

    // 3. Verifikasi module dan provider berhasil di-load
    expect(module).toBeDefined();
    expect(module.get(TasksService)).toBeDefined();
    expect(module.get(TasksController)).toBeDefined();
  });
});