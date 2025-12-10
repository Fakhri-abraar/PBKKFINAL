import { Test, TestingModule } from '@nestjs/testing';
import { EmailModule } from './email.module';
import { MailerService } from '@nestjs-modules/mailer';

describe('EmailModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide MailerService', () => {
    // Karena EmailModule exports MailerModule, service ini harus tersedia
    const service = module.get<MailerService>(MailerService);
    expect(service).toBeDefined();
  });
});