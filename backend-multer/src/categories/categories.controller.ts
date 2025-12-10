import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';

@UseGuards(JwtAuthGuard) // Semua endpoint kategori butuh login
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto, @Request() req: { user: JwtPayloadDto }) {
    return this.categoriesService.create(createCategoryDto, req.user.username);
  }

  @Get()
  findAll(@Request() req: { user: JwtPayloadDto }) {
    return this.categoriesService.findAll(req.user.username);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req: { user: JwtPayloadDto },
  ) {
    return this.categoriesService.update(id, updateCategoryDto, req.user.username);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: JwtPayloadDto }) {
    return this.categoriesService.remove(id, req.user.username);
  }
}