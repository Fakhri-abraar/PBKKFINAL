import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn().mockResolvedValue({ message: 'registered' }),
  login: jest.fn().mockResolvedValue({ access_token: 'token' }),
  refreshToken: jest.fn().mockResolvedValue({ access_token: 'new_token' }),
  logout: jest.fn().mockResolvedValue({ message: 'logged out' }),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should register user', async () => {
    expect(await controller.register({} as any)).toEqual({ message: 'registered' });
  });

  it('should login user', async () => {
    expect(await controller.login({} as any)).toEqual({ access_token: 'token' });
  });

  it('should refresh token', async () => {
    expect(await controller.refreshToken({} as any)).toEqual({ access_token: 'new_token' });
  });

  it('should logout', async () => {
    // [FIX] Tambahkan 'sub' agar sesuai dengan JwtPayloadDto
    const req = { user: { username: 'test', sub: 'user-id-123' } }; 
    expect(await controller.logout(req)).toEqual({ message: 'logged out' });
  });
});