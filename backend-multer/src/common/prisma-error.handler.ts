import { 
  HttpException, 
  HttpStatus, 
  ConflictException, 
  NotFoundException, 
  BadRequestException, 
  InternalServerErrorException 
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: any, operation: string): never {
  // 1. Jika error sudah berupa HttpException (misal dari controller), lempar ulang (Fungsi ini tetap ada)
  if (error instanceof HttpException) {
    throw error;
  }

  // 2. Cek Error Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // HttpStatus.CONFLICT (409) -> ConflictException
        throw new ConflictException('A record with this data already exists');
        
      case 'P2025':
        // HttpStatus.NOT_FOUND (404) -> NotFoundException
        throw new NotFoundException('Record not found');
        
      case 'P2003':
        // HttpStatus.BAD_REQUEST (400) -> BadRequestException
        throw new BadRequestException('Foreign key constraint failed');
        
      case 'P2004':
        // HttpStatus.BAD_REQUEST (400) -> BadRequestException
        throw new BadRequestException('Constraint failed on the database');
    }
  }

  // 3. Log error asli untuk debugging (Fungsi ini tetap ada)
  console.error(error);

  // 4. Default Error: Internal Server Error (500)
  throw new InternalServerErrorException(`Failed to ${operation}`);
}