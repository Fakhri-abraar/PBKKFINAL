import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException // [Fix] Tambahkan import ini
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto'; // [Fix] Pastikan import ini ada

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private generateTokens(username: string) {
    const payload = { username, sub: username };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Add a unique identifier (jti) to ensure each refresh token is unique
    const refreshPayload = {
      ...payload,
      jti: `${username}-${Date.now()}-${Math.random()}`,
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(username: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { username },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Cek apakah username atau email sudah ada
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan ke database
    const user = await this.prisma.user.create({
      data: {
        username,
        email, 
        password: hashedPassword,
      },
    });

    return {
      message: 'User registered successfully',
      user: { username: user.username, email: user.email },
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Cari user
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Cek password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate Token (Gunakan method generateTokens agar konsisten)
    const tokens = this.generateTokens(user.username);
    await this.updateRefreshToken(user.username, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  // [Fix] Method refreshToken sekarang berada DI DALAM class (sebelumnya di luar)
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(refreshToken) as {
        username: string;
        sub: string;
        jti: string;
      };
      const user = await this.prisma.user.findUnique({
        where: { username: payload.username },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify the entire refresh token matches the stored hash
      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens with rotation
      const { accessToken, refreshToken: newRefreshToken } =
        this.generateTokens(user.username);
      await this.updateRefreshToken(user.username, newRefreshToken);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(username: string) {
    await this.prisma.user.update({
      where: { username },
      data: { refreshToken: null },
    });

    return {
      message: 'Logged out successfully',
    };
  }
}