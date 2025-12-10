import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import { NotFoundException, ForbiddenException, Logger } from '@nestjs/common';

// 1. Mock Data (Lengkap dengan fileUrl)
const mockUserId = 'testuser';
const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Desc',
  priority: 'Medium',
  dueDate: new Date(),
  isCompleted: false,
  isPublic: false,
  fileUrl: null, // [FIX] Wajib ada agar tidak error TS
  authorId: mockUserId,
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  author: { email: 'test@example.com', username: 'testuser' } // [FIX] Penting untuk test email
};

// 2. Mock Services
const mockPrismaService = {
  task: {
    create: jest.fn().mockResolvedValue(mockTask),
    findMany: jest.fn().mockResolvedValue([mockTask]),
    findUnique: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue({ ...mockTask, title: 'Updated' }),
    delete: jest.fn().mockResolvedValue(mockTask),
    count: jest.fn().mockResolvedValue(1),
  },
  $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
};

const mockMailerService = {
  sendMail: jest.fn().mockResolvedValue(true),
};

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;
  let mailer: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailerService, useValue: mockMailerService },
        Logger,
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
    mailer = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = {
        title: 'Test',
        priority: 'Medium' as any,
        dueDate: '2025-01-01',
      };
      const result = await service.create(dto, mockUserId);
      expect(result).toEqual(mockTask);
      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const result = await service.findAll(mockUserId, {
        page: 1,
        limit: 10,
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual([mockTask]);
      expect(result.meta.total).toBe(1);
    });

    it('should apply filters correctly', async () => {
      // Test logika filter yang kompleks
      await service.findAll(mockUserId, {
        page: 1,
        limit: 10,
        search: 'Test',
        priority: 'High',
        status: 'completed',
        categoryId: 'cat-1',
        startDate: '2025-01-01',
        endDate: '2025-01-02',
      });
      // Verifikasi bahwa transaksi dipanggil (artinya query dibuat)
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const result = await service.findOne('task-1');
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(prisma.task, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.findOne('wrong-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update task if user is owner', async () => {
      const result = await service.update('task-1', { title: 'Updated' }, mockUserId);
      expect(result.title).toBe('Updated');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(prisma.task, 'findUnique').mockResolvedValueOnce({
        ...mockTask,
        authorId: 'other-user',
      });
      await expect(
        service.update('task-1', { title: 'Up' }, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete task if user is owner', async () => {
      await service.remove('task-1', mockUserId);
      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(prisma.task, 'findUnique').mockResolvedValueOnce({
        ...mockTask,
        authorId: 'other-user',
      });
      await expect(service.remove('task-1', mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findPublicTasksByUser', () => {
    it('should return public tasks', async () => {
      await service.findPublicTasksByUser('targetUser');
      expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { authorId: 'targetUser', isPublic: true }
      }));
    });
  });

  describe('handleDailyEmailReminders', () => {
    it('should send emails for tasks due tomorrow', async () => {
      // Mock findMany return task yang punya author email
      jest.spyOn(prisma.task, 'findMany').mockResolvedValue([mockTask] as any);
      
      await service.handleDailyEmailReminders();
      
      expect(prisma.task.findMany).toHaveBeenCalled();
      expect(mailer.sendMail).toHaveBeenCalled();
    });

    it('should log if no tasks due', async () => {
      jest.spyOn(prisma.task, 'findMany').mockResolvedValue([]);
      await service.handleDailyEmailReminders();
      expect(mailer.sendMail).not.toHaveBeenCalled();
    });
  });
});