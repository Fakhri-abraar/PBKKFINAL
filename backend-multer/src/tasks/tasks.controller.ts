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
  ) {
    return this.tasksService.findAll(req.user.username, { search, priority, status, categoryId });
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