import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Vehicle ID to check availability for' })
  @IsString()
  vehicleId: string;

  @ApiProperty({ description: 'Start date to check availability', example: '2024-01-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date to check availability', example: '2024-01-20' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Exclude specific rental ID (for updates)', required: false })
  @IsOptional()
  @IsString()
  excludeRentalId?: string;
}
