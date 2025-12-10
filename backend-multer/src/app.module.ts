import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <--- Import ini
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { UploadModule } from './upload/upload.module';
import { CategoriesModule } from './categories/categories.module';
import { EmailModule } from './email/email.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Tambahkan ConfigModule.forRoot() agar .env terbaca secara global
    ConfigModule.forRoot({
      isGlobal: true, // Agar tidak perlu di-import lagi di module lain
    }),

    ScheduleModule.forRoot(),
    EmailModule,
    AuthModule,
    TasksModule,
    UploadModule,
    CategoriesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}