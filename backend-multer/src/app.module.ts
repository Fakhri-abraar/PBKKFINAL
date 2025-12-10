import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
// Pastikan import TasksModule ada
import { TasksModule } from './tasks/tasks.module'; 

@Module({
  imports: [AuthModule, UploadModule, TasksModule], // Daftarkan di sini
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}