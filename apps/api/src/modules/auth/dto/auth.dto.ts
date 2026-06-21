import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(1, { message: 'Display name is required' })
  @MaxLength(50)
  displayName: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @IsString()
  @MinLength(1, { message: 'New password is required' })
  @MaxLength(128)
  newPassword: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(1, { message: 'Verification token is required' })
  token: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1, { message: 'Reset token is required' })
  token: string;

  @IsString()
  @MinLength(1, { message: 'New password is required' })
  @MaxLength(128)
  newPassword: string;
}

export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName?: string;

  @IsString()
  @MaxLength(200)
  bio?: string;

  @IsString()
  @MaxLength(100)
  location?: string;
}
