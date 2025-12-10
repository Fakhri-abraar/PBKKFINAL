import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // Wajib login untuk melihat daftar user lain
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users?search=nama
  @Get()
  async findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }
}