import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerTier } from '../../../common/enums/user.enums';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'Customer tier',
    enum: CustomerTier,
    required: false,
  })
  @IsOptional()
  @IsEnum(CustomerTier)
  customerTier?: CustomerTier;

  @ApiProperty({
    description: 'User active status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
