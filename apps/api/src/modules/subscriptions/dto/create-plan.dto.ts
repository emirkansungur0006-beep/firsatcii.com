import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsNumber()
  @IsOptional()
  durationDays?: number;
}
