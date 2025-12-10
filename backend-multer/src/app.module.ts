import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { UploadModule } from './upload/upload.module';
// Import CategoriesModule
import { CategoriesModule } from './categories/categories.module'; 

@Module({
  imports: [
    AuthModule,
    TasksModule,
    UploadModule,
    CategoriesModule, // <-- Tambahkan di sini
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}