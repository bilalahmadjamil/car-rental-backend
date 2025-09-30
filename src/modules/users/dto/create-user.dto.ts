import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, IsPhoneNumber, IsBoolean } from 'class-validator';
import { UserRole, CustomerTier } from '../../../common/enums/user.enums';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Hashed password',
    example: '$2b$12$...',
  })
  @IsString()
  passwordHash: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+61412345678',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('AU')
  phone?: string;

  @ApiProperty({
    description: 'User address',
    example: '123 Main Street, Sydney NSW 2000',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Driver license number',
    example: '123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Customer tier',
    enum: CustomerTier,
    default: CustomerTier.BRONZE,
  })
  @IsOptional()
  @IsEnum(CustomerTier)
  customerTier?: CustomerTier;

  @ApiProperty({
    description: 'Registration source',
    example: 'website',
    required: false,
  })
  @IsOptional()
  @IsString()
  registrationSource?: string;

  @ApiProperty({
    description: 'Is the user account active?',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
