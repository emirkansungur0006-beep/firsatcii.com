// apps/api/src/modules/jobs/dto/create-job.dto.ts
import {
  IsString, IsNumber, IsOptional, IsInt, Min, Max, MinLength, MaxLength, IsDateString, IsBoolean
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MinLength(10, { message: 'İş başlığı en az 10 karakter olmalı.' })
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(30, { message: 'İş açıklaması en az 30 karakter olmalı.' })
  description: string;

  @IsInt()
  categoryId: number;

  @IsInt()
  cityId: number;

  @IsInt()
  districtId: number;

  @IsOptional()
  @IsInt()
  neighborhoodId?: number;

  @IsNumber()
  @Min(-90) @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180) @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @IsDateString()
  auctionEnd: string;

  @IsOptional()
  @IsString()
  targetWorkerId?: string;

  @IsOptional()
  @IsDateString()
  workStartDate?: string;

  @IsOptional()
  @IsBoolean()
  isFlash?: boolean;
}
