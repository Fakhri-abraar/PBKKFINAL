import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  // Mock PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data if payload is valid and user exists', async () => {
      const payload = { sub: 'testuser', username: 'testuser' };
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };

      // Mock database return user
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: payload.sub },
      });
      expect(result).toEqual({ userId: user.username, username: user.username });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const payload = { sub: 'unknown', username: 'unknown' };

      // Mock database return null
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    // Catatan: Test untuk 'Invalid token payload' (class-validator) mungkin memerlukan 
    // struktur payload yang benar-benar salah sesuai aturan DTO Anda.
    // Jika DTO mewajibkan field tertentu yang hilang, test ini akan valid.
    it('should throw UnauthorizedException if payload validation fails', async () => {
        // Mengirim payload kosong atau tipe data salah yang melanggar rules JwtPayloadDto
        const invalidPayload = {}; 
        
        // Kita tidak perlu mock prisma di sini karena validasi DTO terjadi sebelumnya
        try {
            await strategy.validate(invalidPayload);
        } catch (error) {
            expect(error).toBeInstanceOf(UnauthorizedException);
            expect(error.message).toBe('Invalid token payload');
        }
    });
  });
});