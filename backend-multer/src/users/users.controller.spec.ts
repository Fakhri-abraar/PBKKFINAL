import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  // Mock object untuk UsersService
  const mockUsersService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call usersService.findAll with search query', async () => {
      const search = 'test';
      const result = [{ username: 'testuser', email: 'test@example.com' }];
      
      mockUsersService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(search);

      expect(service.findAll).toHaveBeenCalledWith(search);
      expect(response).toEqual(result);
    });

    it('should call usersService.findAll without search query', async () => {
      const result = [{ username: 'user1', email: 'user1@example.com' }];
      
      mockUsersService.findAll.mockResolvedValue(result);

      const response = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(response).toEqual(result);
    });
  });
});