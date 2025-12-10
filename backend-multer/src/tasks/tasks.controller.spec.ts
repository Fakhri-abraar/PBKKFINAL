import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

const mockTasksService = {
  create: jest.fn().mockResolvedValue({ id: '1', title: 'Task' }),
  findAll: jest.fn().mockResolvedValue({ data: [], meta: {} }),
  findOne: jest.fn().mockResolvedValue({ id: '1' }),
  update: jest.fn().mockResolvedValue({ id: '1', title: 'Updated' }),
  remove: jest.fn().mockResolvedValue({ id: '1' }),
  findPublicTasksByUser: jest.fn().mockResolvedValue([]),
};

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a task', async () => {
    const dto = { title: 'Test', priority: 'Medium', dueDate: '2025-01-01' } as any;
    expect(await controller.create(dto, { user: { username: 'test' } } as any)).toBeDefined();
  });

  it('should find all tasks', async () => {
    expect(await controller.findAll({ user: { username: 'test' } } as any)).toBeDefined();
  });
});