import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch, 
  Query,
  Request,
  UseGuards,
  NotFoundException, 
  DefaultValuePipe, 
  ParseIntPipe
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
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: { user: JwtPayloadDto }) {
    return this.tasksService.create(createTaskDto, req.user.username);
  }

  // 2. Get All Tasks (Personal)
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Request() req: { user: JwtPayloadDto },
    @Query('search') search?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    
    // Filter Tanggal
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string,     

    // Pagination
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.tasksService.findAll(req.user.username, {
      search,
      priority,
      status,
      categoryId,
      startDate, 
      endDate,   
      page,
      limit,
    });
  }


  @UseGuards(JwtAuthGuard)
  @Get('public/:username') 
  async findPublicTasks(@Param('username') username: string) {

    return this.tasksService.findPublicTasksByUser(username);
  }
 

  // 3. Get One Task Detail
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: { user: JwtPayloadDto }) {

  return this.tasksService.findOne(id, req.user.username);
  }

  // 4. Update Task
  @UseGuards(JwtAuthGuard)
  @Patch(':id') 
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: { user: JwtPayloadDto },
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.username);
  }

  // 5. Delete Task
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: { user: JwtPayloadDto }) {
    return this.tasksService.remove(id, req.user.username);
  }
}