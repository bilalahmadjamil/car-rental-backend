import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelBookingDto {
  @ApiProperty({ 
    description: 'Reason for cancelling the booking', 
    example: 'Change of plans',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Cancellation reason must not exceed 500 characters' })
  cancellationReason: string;
}
