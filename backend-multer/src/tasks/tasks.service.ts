import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // 1. Create Task
  async create(createTaskDto: CreateTaskDto, userId: string) {
    const { title, description, priority, dueDate, categoryId, isPublic, fileUrl } = createTaskDto;

    return this.prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: new Date(dueDate), // Pastikan convert string ke Date
        isPublic: isPublic ?? false, // Default private jika tidak dikirim
        fileUrl, // Optional file attachment
        author: {
          connect: { username: userId },
        },
        // Jika ada categoryId, hubungkan relasinya
        ...(categoryId && {
          category: {
            connect: { id: categoryId },
          },
        }),
      },
      include: {
        category: true, // Return data kategori juga
      },
    });
  }

  // 2. Find All Tasks (Milik User yang Login) + Filtering & Searching
  async findAll(
    userId: string,
    params: {
      search?: string;
      priority?: string;
      status?: string; // 'completed' | 'incomplete'
      categoryId?: string;
    },
  ) {
    const { search, priority, status, categoryId } = params;

    // Base query: hanya ambil task milik user yang login
    const whereClause: any = {
      authorId: userId,
    };

    // Filter by Title (Search)
    if (search) {
      whereClause.title = {
        contains: search,
        // mode: 'insensitive', // Uncomment jika pakai PostgreSQL, SQLite defaultnya case-sensitive tergantung setup
      };
    }

    // Filter by Priority
    if (priority) {
      whereClause.priority = priority;
    }

    // Filter by Status (isCompleted)
    if (status) {
      // Jika status 'completed', cari yang true. Jika tidak, cari yang false.
      whereClause.isCompleted = status === 'completed';
    }

    // Filter by Category
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    return this.prisma.task.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc', // Urutkan dari yang terbaru
      },
      include: {
        category: true,
      },
    });
  }

  // 3. Find One Task
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { category: true, author: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  // 4. Update Task (Termasuk Mark as Complete)
  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    // Cek dulu apakah task ada
    const task = await this.findOne(id);

    // Cek kepemilikan (Authorization manual selain Guard)
    if (task.authorId !== userId) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    // Handle konversi tanggal jika ada update dueDate
    const dataToUpdate: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      dataToUpdate.dueDate = new Date(updateTaskDto.dueDate);
    }

    return this.prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: { category: true },
    });
  }

  // 5. Delete Task
  async remove(id: string, userId: string) {
    const task = await this.findOne(id);

    if (task.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }

  // 6. View Other User's Public Tasks (Requirement No. 7)
  async findPublicTasksByUser(targetUsername: string) {
    return this.prisma.task.findMany({
      where: {
        authorId: targetUsername,
        isPublic: true, // WAJIB: Hanya tampilkan yang public
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
      },
    });
  }
}