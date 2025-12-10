import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { MailerService } from '@nestjs-modules/mailer'; // Import ini

describe('Todo List App (e2e)', () => {
  let app: NestExpressApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let categoryId: string;
  let uploadedImagePath: string;
  let taskId: string;

  const createTestImageBuffer = () => {
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    // [FIX] Override MailerService agar tidak butuh koneksi SMTP asli
    .overrideProvider(MailerService)
    .useValue({
      sendMail: jest.fn().mockResolvedValue(true),
    })
    .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });

    await app.init();
    prismaService = app.get<PrismaService>(PrismaService);

    // Clean DB
    await prismaService.task.deleteMany();
    await prismaService.category.deleteMany();
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    // Pastikan app ada sebelum diclose (mencegah error Cannot read properties of undefined)
    if (app) {
      await prismaService.task.deleteMany();
      await prismaService.category.deleteMany();
      await prismaService.user.deleteMany();
      await app.close();
    }
  });

  // --- 1. AUTHENTICATION FLOW ---
  describe('Auth Module', () => {
    const testUser = {
      username: 'e2e_user',
      email: 'e2e@test.com',
      password: 'password123',
    };

    it('/auth/register (POST) - Register successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.user.email).toEqual(testUser.email);
        });
    });

    it('/auth/login (POST) - Login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(201);

      authToken = response.body.access_token;
      expect(authToken).toBeDefined();
    });

    it('/auth/login (POST) - Fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  // --- 2. CATEGORY FLOW ---
  describe('Categories Module', () => {
    it('/categories (POST) - Create Category', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Work Project' })
        .expect(201);

      categoryId = response.body.id;
      expect(response.body.name).toEqual('Work Project');
    });

    it('/categories (GET) - Get All Categories', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  // --- 3. UPLOAD FLOW ---
  describe('Upload Module', () => {
    it('/upload (POST) - Upload Image', async () => {
      const response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'task-image.png')
        .expect(201);

      uploadedImagePath = response.body.imagePath;
      expect(uploadedImagePath).toBeDefined();
    });
  });

  // --- 4. TASK FLOW ---
  describe('Tasks Module', () => {
    it('/tasks (POST) - Create Task', async () => {
      const taskData = {
        title: 'E2E Task',
        description: 'Test',
        priority: 'High',
        dueDate: '2025-12-31',
        categoryId: categoryId,
        fileUrl: uploadedImagePath,
        isPublic: true,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      taskId = response.body.id;
      expect(response.body.title).toEqual(taskData.title);
    });

    it('/tasks (GET) - Get All Tasks', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);
    });

    it('/tasks/:id (GET) - Get One Task', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/tasks/:id (DELETE) - Delete Task', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});