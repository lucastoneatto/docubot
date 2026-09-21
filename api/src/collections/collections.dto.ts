import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CollectionSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  greeting?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  customPrompt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  maxFiles?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxFileSizeMb?: number;
}

export class CreateCollectionDto {
  @IsString()
  @MaxLength(120)
  name!: string;
}

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CollectionSettingsDto)
  settings?: CollectionSettingsDto;

  // monthlyMessageLimit and monthlyBudgetUsd are NOT exposed here on purpose:
  // they are platform operator quotas and are only edited from /admin.
}
