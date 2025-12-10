import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module'; // Ubah import ini
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    AuthModule, 
    TasksModule, // Ganti PostsModule jadi TasksModule
    UploadModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}