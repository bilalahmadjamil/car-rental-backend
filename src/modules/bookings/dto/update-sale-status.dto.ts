import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SaleStatus, PaymentStatus } from '@prisma/client';

export class UpdateSaleStatusDto {
  @ApiProperty({ description: 'New sale status', enum: SaleStatus })
  @IsEnum(SaleStatus)
  status: SaleStatus;

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
