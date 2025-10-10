import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, IsNotEmpty } from 'class-validator';

export enum VehicleType {
  RENTAL = 'rental',
  SALE = 'sale',
  BOTH = 'both',
}

export class CreateVehicleDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsNumber()
  year: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsOptional()
  @IsNumber()
  dailyRate?: number;

  @IsOptional()
  @IsNumber()
  weeklyRate?: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
