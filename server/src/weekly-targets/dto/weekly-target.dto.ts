import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWeeklyTargetDto {
  @IsString() @MinLength(1) name!: string;
  @IsDateString() weekStart!: string;
  @IsArray() tasks!: string[];
}

export class UpdateWeeklyTargetDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsDateString() weekStart?: string;
}

export class AddWeeklyTargetTaskDto { @IsString() @MinLength(1) title!: string; }
export class CompleteWeeklyTargetTaskDto { @IsBoolean() completed!: boolean; }
