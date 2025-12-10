import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch, // Ganti Put jadi Patch
  Query,
  Request,
  UseGuards,
  NotFoundException, // Tambahan
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
// PERHATIKAN IMPORT INI: pastikan sesuai nama file baru
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { DefaultValuePipe, ParseIntPipe } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: { user: JwtPayloadDto }) {
    return this.tasksService.create(createTaskDto, req.user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Request() req: { user: JwtPayloadDto },
    @Query('search') search?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    
    // [Baru] Filter Tanggal
    @Query('startDate') startDate?: string, // Format: YYYY-MM-DD
    @Query('endDate') endDate?: string,     // Format: YYYY-MM-DD

    // Pagination
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.tasksService.findAll(req.user.username, {
      search,
      priority,
      status,
      categoryId,
      startDate, // Kirim ke service
      endDate,   // Kirim ke service
      page,
      limit,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id') // Gunakan Patch untuk update sebagian
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: { user: JwtPayloadDto },
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: { user: JwtPayloadDto }) {
    return this.tasksService.remove(id, req.user.username);
  }
}