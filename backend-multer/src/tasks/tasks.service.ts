import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService, // Inject MailerService
  ) {}

  // 1. Create Task
  async create(createTaskDto: CreateTaskDto, userId: string) {
    const {
      title,
      description,
      priority,
      dueDate,
      categoryId,
      isPublic,
      fileUrl,
    } = createTaskDto;

    return this.prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: new Date(dueDate), // Konversi string ke Date
        isPublic: isPublic ?? false,
        fileUrl,
        author: {
          connect: { username: userId },
        },
        // Jika categoryId ada, hubungkan relasinya
        ...(categoryId && {
          category: {
            connect: { id: categoryId },
          },
        }),
      },
      include: {
        category: true,
      },
    });
  }

  // 2. Find All Tasks (Pagination + Filter)
  async findAll(
    userId: string,
    params: {
      search?: string;
      priority?: string;
      status?: string;
      categoryId?: string;
      startDate?: string; // [Baru]
      endDate?: string;   // [Baru]
      page: number;
      limit: number;
    },
  ) {
    const { search, priority, status, categoryId, startDate, endDate, page, limit } = params;
    const skip = (page - 1) * limit;

    // Base query: milik user yang login
    const whereClause: any = {
      authorId: userId,
    };

    // --- Filter Logic ---
    if (search) {
      whereClause.title = { contains: search };
    }
    if (priority) {
      whereClause.priority = priority;
    }
    if (status) {
      whereClause.isCompleted = status === 'completed';
    }
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // [Baru] Filter Rentang Tanggal (Due Date)
    if (startDate || endDate) {
      whereClause.dueDate = {};
      
      // Filter "Dari Tanggal X"
      if (startDate) {
        whereClause.dueDate.gte = new Date(startDate); // Greater than or equal
      }

      // Filter "Sampai Tanggal Y"
      if (endDate) {
        // Kita set jam ke 23:59:59 agar mencakup seluruh hari tersebut
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.dueDate.lte = end; // Less than or equal
      }
    }

    // Jalankan Query Transaction
    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
        },
      }),
      this.prisma.task.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  // 3. Find One Task
  async findOne(id: string, requesterId?: string) { // Tambahkan parameter opsional
     const task = await this.prisma.task.findUnique({
     where: { id },
      include: { category: true, author: true },
  });

  if (!task) {
    throw new NotFoundException(`Task with ID ${id} not found`);
  }

  // [SECURITY FIX]
  // Jika requesterId diberikan, lakukan pengecekan hak akses
  if (requesterId) {
    const isOwner = task.authorId === requesterId;
    const isPublic = task.isPublic;

    // Jika bukan pemilik DAN bukan task public, tolak akses
    if (!isOwner && !isPublic) {
      throw new ForbiddenException('You do not have permission to view this private task');
    }
  }

  return task;
 }

  // 4. Update Task
  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id);

    // Authorization Check
    if (task.authorId !== userId) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    // Siapkan data update (handle Date conversion)
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

  // 6. View Other User's Public Tasks
  async findPublicTasksByUser(targetUsername: string) {
    return this.prisma.task.findMany({
      where: {
        authorId: targetUsername,
        isPublic: true, // Wajib Public
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
      },
    });
  }

  // 7. CRON JOB: Email Reminder (Setiap hari jam 09:00)
  // Requirement No. 8
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyEmailReminders() {
    this.logger.log('Running daily email reminder job...');

    // Tentukan range waktu BESOK (00:00 - 23:59)
    const today = new Date();
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(today.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Cari task yang due date-nya besok dan belum selesai
    const tasksDueTomorrow = await this.prisma.task.findMany({
      where: {
        isCompleted: false,
        dueDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: {
        author: true,
      },
    });

    if (tasksDueTomorrow.length === 0) {
      this.logger.log('No tasks due tomorrow.');
      return;
    }

    // Loop kirim email
    for (const task of tasksDueTomorrow) {
      if (task.author.email) {
        try {
          await this.mailerService.sendMail({
            to: task.author.email,
            subject: `Reminder: Task "${task.title}" is due tomorrow!`,
            text: `Hi ${task.author.username},\n\nJangan lupa task "${task.title}" deadline-nya besok (${task.dueDate.toDateString()}).\nPrioritas: ${task.priority}\n\nSemangat!`,
          });
          this.logger.log(
            `Email sent to ${task.author.email} for task ${task.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send email to ${task.author.email}`,
            error.stack,
          );
        }
      }
    }
  }
}