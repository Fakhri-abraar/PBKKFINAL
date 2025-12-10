import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';

@Global() // Decorator ini membuat module & exports-nya tersedia di seluruh aplikasi
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'sandbox.smtp.mailtrap.io', // Sesuaikan dengan config Anda
        port: 2525,
        auth: {
          user: 'GANTI_DENGAN_USER_MAILTRAP',
          pass: 'GANTI_DENGAN_PASS_MAILTRAP',
        },
      },
      defaults: {
        from: '"No Reply" <noreply@example.com>',
      },
    }),
  ],
  exports: [MailerModule], // Export agar module lain bisa pakai MailerService
})
export class EmailModule {}