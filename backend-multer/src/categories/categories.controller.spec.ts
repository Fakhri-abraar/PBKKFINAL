import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

const mockCategoriesService = {
  create: jest.fn().mockResolvedValue({ id: '1', name: 'Work' }),
  findAll: jest.fn().mockResolvedValue([{ id: '1', name: 'Work' }]),
  findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Work' }),
  update: jest.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
  remove: jest.fn().mockResolvedValue({ id: '1', name: 'Work' }),
};

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService, // Inject Mock Service
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create category', async () => {
    expect(await controller.create({ name: 'Work' }, { user: { username: 'test' } } as any)).toEqual({ id: '1', name: 'Work' });
  });

  it('should find all categories', async () => {
    expect(await controller.findAll({ user: { username: 'test' } } as any)).toEqual([{ id: '1', name: 'Work' }]);
  });
});