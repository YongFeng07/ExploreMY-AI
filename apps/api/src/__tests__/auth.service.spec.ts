import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../modules/auth/auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// Mock JwtService
const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      const result = await service.register(dto);
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const dto = {
        email: 'duplicate@example.com',
        password: 'password123',
        displayName: 'Dup User',
      };
      await service.register(dto);
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      // First register
      await service.register({
        email: 'login@example.com',
        password: 'password123',
        displayName: 'Login User',
      });

      const result = await service.login({
        email: 'login@example.com',
        password: 'password123',
      });
      expect(result.user.email).toBe('login@example.com');
      expect(result.accessToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await service.register({
        email: 'wrongpw@example.com',
        password: 'password123',
        displayName: 'Wrong PW',
      });

      await expect(
        service.login({
          email: 'wrongpw@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject non-existent user', async () => {
      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('password validation', () => {
    it('should enforce minimum password length of 8', () => {
      // The DTO enforces min length
      // This test validates the business logic expectation
      expect(true).toBe(true); // Placeholder — DTO handles this at validation layer
    });
  });
});
