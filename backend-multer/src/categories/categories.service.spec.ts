import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // 1. Create Category
  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    try {
      return await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          user: {
            connect: { username: userId },
          },
        },
      });
    } catch (error) {
      // Menangani error unique constraint (jika user membuat nama kategori yang sama 2x)
      if (error.code === 'P2002') {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  // 2. Find All Categories (Milik User Login)
  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: {
        username: userId,
      },
      orderBy: {
        name: 'asc', // Urutkan abjad
      },
    });
  }

  // 3. Find One
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  // 4. Update Category
  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    const category = await this.findOne(id);

    // Pastikan user hanya bisa edit kategorinya sendiri
    if (category.username !== userId) {
      throw new ForbiddenException('You can only update your own categories');
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  // 5. Delete Category
  async remove(id: string, userId: string) {
    const category = await this.findOne(id);

    if (category.username !== userId) {
      throw new ForbiddenException('You can only delete your own categories');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}