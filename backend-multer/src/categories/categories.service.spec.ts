import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

const mockCategory = {
  id: 'cat-1',
  name: 'Work',
  username: 'testuser',
};

const mockPrismaService = {
  category: {
    create: jest.fn().mockResolvedValue(mockCategory),
    findMany: jest.fn().mockResolvedValue([mockCategory]),
    findUnique: jest.fn().mockResolvedValue(mockCategory),
    update: jest.fn().mockResolvedValue({ ...mockCategory, name: 'Updated' }),
    delete: jest.fn().mockResolvedValue(mockCategory),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const result = await service.create({ name: 'Work' }, 'testuser');
      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException on duplicate name', async () => {
      jest.spyOn(prisma.category, 'create').mockRejectedValueOnce({ code: 'P2002' });
      await expect(service.create({ name: 'Work' }, 'testuser')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return array of categories', async () => {
      const result = await service.findAll('testuser');
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('findOne', () => {
    it('should return a category', async () => {
      const result = await service.findOne('cat-1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(prisma.category, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.findOne('cat-99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update category if owner', async () => {
      const result = await service.update('cat-1', { name: 'Updated' }, 'testuser');
      expect(result.name).toBe('Updated');
    });

    it('should throw ForbiddenException if not owner', async () => {
      jest.spyOn(prisma.category, 'findUnique').mockResolvedValueOnce({ ...mockCategory, username: 'other' });
      await expect(service.update('cat-1', { name: 'Up' }, 'testuser')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete category if owner', async () => {
      const result = await service.remove('cat-1', 'testuser');
      expect(result).toEqual(mockCategory);
    });
  });
});