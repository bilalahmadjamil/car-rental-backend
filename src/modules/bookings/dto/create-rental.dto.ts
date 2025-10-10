import { IsString, IsDateString, IsOptional, IsEnum, IsNumber, Min, IsBoolean, ValidateNested, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GuestInfoDto {
  @ApiProperty({ description: 'Guest first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Guest last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Guest email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Guest phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Guest address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Guest license number' })
  @IsString()
  licenseNumber: string;
}

export class CreateRentalDto {
  @ApiProperty({ description: 'Vehicle ID to rent' })
  @IsString()
  vehicleId: string;

  @ApiProperty({ description: 'Rental start date', example: '2024-01-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Rental end date', example: '2024-01-20' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Payment method', enum: ['card', 'cash', 'bank_transfer'], required: false })
  @IsOptional()
  @IsEnum(['card', 'cash', 'bank_transfer'])
  paymentMethod?: string;

  @ApiProperty({ description: 'Special requests or notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Agree to terms and conditions', default: false })
  @IsBoolean()
  agreeToTerms: boolean;

  @ApiProperty({ description: 'Guest information for non-authenticated users', required: false, type: GuestInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guestInfo?: GuestInfoDto;
}
