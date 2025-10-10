import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RentalStatus, PaymentStatus } from '@prisma/client';

export class UpdateRentalStatusDto {
  @ApiProperty({ description: 'New rental status', enum: RentalStatus })
  @IsEnum(RentalStatus)
  status: RentalStatus;

  @ApiProperty({ description: 'New payment status', enum: PaymentStatus, required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ description: 'Admin notes for status change', required: false })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiProperty({ description: 'Reason for cancellation', required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
