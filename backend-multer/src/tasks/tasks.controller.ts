import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // 1. Create Task
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: { user: JwtPayloadDto },
  ) {
    return this.tasksService.create(createTaskDto, req.user.username);
  }

  // 2. Get All My Tasks (dengan Search & Filter)
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Request() req: { user: JwtPayloadDto },
    @Query('search') search?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string, // 'completed' atau 'incomplete'
    @Query('categoryId') categoryId?: string,
  ) {
    return this.tasksService.findAll(req.user.username, {
      search,
      priority,
      status,
      categoryId,
    });
  }

  // 3. Get Public Tasks of Other User (Requirement No. 7)
  // Endpoint ini bisa diakses siapa saja (atau kasih Guard jika harus login dulu)
  @UseGuards(JwtAuthGuard) 
  @Get('user/:username')
  async getUserPublicTasks(@Param('username') username: string) {
    return this.tasksService.findPublicTasksByUser(username);
  }

  // 4. Get Single Task Detail
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // 5. Update Task (Edit Content atau Mark as Complete)
  // Bisa pakai @Put atau @Patch
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: { user: JwtPayloadDto },
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.username);
  }

  // 6. Delete Task
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user: JwtPayloadDto },
  ) {
    return this.tasksService.remove(id, req.user.username);
  }
}