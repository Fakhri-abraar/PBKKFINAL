import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create_task.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}
