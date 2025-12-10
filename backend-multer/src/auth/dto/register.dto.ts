import { IsNotEmpty, IsString, MinLength, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail() // Validasi format email
  @IsNotEmpty()
  email: string; // Field baru

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}