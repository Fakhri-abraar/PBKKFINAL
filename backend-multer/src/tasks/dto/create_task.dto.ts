import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsDateString() 
  dueDate: string; // Dikirim sebagai string ISO (YYYY-MM-DD)

  @IsString()
  @IsOptional()
  categoryId?: string; // ID Kategori jika ada

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}