import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWeeklyTargetDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(1) @MaxLength(80) name!: string;
  @IsDateString() weekStart!: string;
  @Transform(({ value }) => Array.isArray(value) ? value.map(item => typeof item === 'string' ? item.trim() : item) : value)
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) @MinLength(1, { each: true }) @MaxLength(160, { each: true }) tasks!: string[];
}

export class UpdateWeeklyTargetDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsOptional() @IsString() @MinLength(1) @MaxLength(80) name?: string;
  @IsOptional() @IsDateString() weekStart?: string;
}

export class AddWeeklyTargetTaskDto { @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(1) @MaxLength(160) title!: string; }
export class CompleteWeeklyTargetTaskDto { @IsBoolean() completed!: boolean; }
