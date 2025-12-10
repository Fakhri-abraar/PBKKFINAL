import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  // Mock object untuk PrismaService
  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users if no search provided', async () => {
      const expectedUsers = [
        { username: 'alice', email: 'alice@test.com' },
        { username: 'bob', email: 'bob@test.com' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(expectedUsers);

      const result = await service.findAll();

      // Verifikasi query Prisma yang dipanggil
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: undefined, // Tidak ada klausa where
        take: 50,
        orderBy: { username: 'asc' },
        select: {
          username: true,
          email: true,
        },
      });
      expect(result).toEqual(expectedUsers);
    });

    it('should return filtered users if search is provided', async () => {
      const search = 'ali';
      const expectedUsers = [{ username: 'alice', email: 'alice@test.com' }];

      mockPrismaService.user.findMany.mockResolvedValue(expectedUsers);

      const result = await service.findAll(search);

      // Verifikasi bahwa search masuk ke klausa 'where'
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          username: {
            contains: search,
          },
        },
        take: 50,
        orderBy: { username: 'asc' },
        select: {
          username: true,
          email: true,
        },
      });
      expect(result).toEqual(expectedUsers);
    });
  });
});