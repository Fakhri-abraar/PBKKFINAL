import { handlePrismaError } from './prisma-error.handler';
import { Prisma } from '@prisma/client';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('handlePrismaError', () => {
  it('should throw ConflictException for P2002 (Unique Constraint)', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '1.0',
    });

    expect(() => handlePrismaError(error, 'test')).toThrow(ConflictException);
  });

  it('should throw NotFoundException for P2025 (Record Not Found)', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '1.0',
    });

    expect(() => handlePrismaError(error, 'test')).toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException for unknown errors', () => {
    const error = new Error('Random error');
    // Mock console.error agar tidak mengotori log test
    jest.spyOn(console, 'error').mockImplementation(() => {}); 
    
    expect(() => handlePrismaError(error, 'test')).toThrow(InternalServerErrorException);
  });
});