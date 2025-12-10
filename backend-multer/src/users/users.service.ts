import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    // Jika ada search query, filter berdasarkan username
    const whereClause = search
      ? {
          username: {
            contains: search, // Mencari yang mengandung kata kunci (SQL LIKE)
          },
        }
      : undefined;

    return this.prisma.user.findMany({
      where: whereClause,
      take: 50, // Limit maksimal 50 user agar tidak memberatkan server
      orderBy: {
        username: 'asc',
      },
      // PENTING: Hanya pilih field yang aman untuk publik
      select: {
        username: true,
        email: true,
        // Password & Token TIDAK boleh dipilih
      },
    });
  }
}