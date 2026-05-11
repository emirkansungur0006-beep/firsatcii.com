import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateWorkerProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsInt()
  cityId?: number;

  @IsOptional()
  @IsInt()
  districtId?: number;

  @IsOptional()
  @IsString()
  aboutMe?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsArray()
  jobHistory?: any[];

  @IsOptional()
  @IsArray()
  references?: any[];

  @IsOptional()
  @IsArray()
  experiences?: any[];

  @IsOptional()
  @IsArray()
  sectorIds?: number[];

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  socialMedia?: any;

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsArray()
  portfolio?: any[];
}
