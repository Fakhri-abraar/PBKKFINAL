import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// PERHATIKAN IMPORT INI
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const { title, description, priority, dueDate, categoryId, isPublic, fileUrl } = createTaskDto;
    
    return this.prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: new Date(dueDate),
        isPublic: isPublic ?? false,
        fileUrl,
        author: { connect: { username: userId } },
        ...(categoryId && { category: { connect: { id: categoryId } } }),
      },
      include: { category: true },
    });
  }

  async findAll(userId: string, params: { search?: string; priority?: string; status?: string; categoryId?: string }) {
    const { search, priority, status, categoryId } = params;
    const whereClause: any = { authorId: userId };

    if (search) whereClause.title = { contains: search };
    if (priority) whereClause.priority = priority;
    if (status) whereClause.isCompleted = status === 'completed';
    if (categoryId) whereClause.categoryId = categoryId;

    return this.prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id);
    if (task.authorId !== userId) throw new ForbiddenException('You can only update your own tasks');

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

  async remove(id: string, userId: string) {
    const task = await this.findOne(id);
    if (task.authorId !== userId) throw new ForbiddenException('You can only delete your own tasks');
    return this.prisma.task.delete({ where: { id } });
  }

  async findPublicTasksByUser(targetUsername: string) {
    return this.prisma.task.findMany({
        where: { authorId: targetUsername, isPublic: true },
        orderBy: { createdAt: 'desc' }
    });
  }
}