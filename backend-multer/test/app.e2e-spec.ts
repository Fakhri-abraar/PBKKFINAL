import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';
import * as fs from 'fs';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;
  let createdTaskId: string;

  // Data User Dummy
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  const testTask = {
    title: 'E2E Test Task',
    priority: 'High',
    dueDate: '2025-12-31',
    isPublic: true,
  };

  // --- 1. Setup Aplikasi & Database ---
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); // Penting: aktifkan validasi DTO
    
    // Ambil instance Prisma untuk membersihkan DB
    prisma = app.get(PrismaService);
    
    await app.init();
  });

  // Bersihkan database sebelum setiap test agar terisolasi
  beforeEach(async () => {
    // Hapus data urut dari child ke parent (Task -> User)
    await prisma.task.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- 2. Authentication Tests ---
  describe('Authentication', () => {
    it('/auth/register (POST) - Register successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => { 
          expect(res.body.message).toBeDefined(); 
          expect(res.body.user).toBeDefined();

          expect(res.body.user.username).toEqual(testUser.username);
          expect(res.body.user.email).toEqual(testUser.email);

        });
    });

    it('/auth/login (POST) - should login and return JWT', async () => {
      // Register dulu
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      // Login
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: testUser.username, password: testUser.password })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          jwtToken = res.body.access_token; // Simpan token untuk test berikutnya
        });
    });

    it('/auth/login (POST) - should fail with wrong password', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: testUser.username, password: 'wrongpassword' })
        .expect(401); // Unauthorized
    });
  });

  // --- 3. Task CRUD Tests ---
  describe('Tasks', () => {
    // Helper: Login user sebelum test task dijalankan
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: testUser.username, password: testUser.password });
      jwtToken = res.body.access_token;
    });

    it('/tasks (POST) - should create a task', async () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`) // Pakai Token
        .send(testTask)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toEqual(testTask.title);
          expect(res.body.isPublic).toEqual(true);
          createdTaskId = res.body.id; // Simpan ID untuk update/delete
        });
    });

    it('/tasks (POST) - should fail without title', async () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ ...testTask, title: '' }) // Judul kosong
        .expect(400); // Bad Request (Validation Error)
    });

    it('/tasks (GET) - should get all tasks', async () => {
      // Buat 1 task dulu
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(testTask);

      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('/tasks/:id (GET) - should get task detail', async () => {
      // Buat task
      const createRes = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(testTask);
      const taskId = createRes.body.id;

      return request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(taskId);
        });
    });

    it('/tasks/:id (PATCH) - should update task status', async () => {
      // Buat task
      const createRes = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(testTask);
      const taskId = createRes.body.id;

      return request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ isCompleted: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.isCompleted).toBe(true);
        });
    });

    it('/tasks/:id (DELETE) - should delete task', async () => {
      // Buat task
      const createRes = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(testTask);
      const taskId = createRes.body.id;

      return request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });

  // --- 4. File Upload Tests ---
  describe('File Upload', () => {
    beforeEach(async () => {
      // Login flow
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: testUser.username, password: testUser.password });
      jwtToken = res.body.access_token;
    });

    it('/upload (POST) - should upload a file', async () => {
      // Buat buffer dummy sebagai file gambar
      const fileBuffer = Buffer.from('fake image content');

      return request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${jwtToken}`)
        .attach('file', fileBuffer, 'test-image.jpg') // 'file' sesuai nama field di Controller
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('filePath');
        });
    });

    it('/upload (POST) - should fail without token', async () => {
      return request(app.getHttpServer())
        .post('/upload')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(401); // Unauthorized
    });
  });
});