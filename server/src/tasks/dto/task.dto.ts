import { Priority, Recurrence, TaskCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(1) @MaxLength(160) title!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsEnum(TaskCategory) category?: TaskCategory;
  @IsOptional() @IsEnum(Recurrence) recurrenceType?: Recurrence;
}
export class UpdateTaskDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsOptional() @IsString() @MinLength(1) @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsEnum(TaskCategory) category?: TaskCategory;
  @IsOptional() @IsEnum(Recurrence) recurrenceType?: Recurrence;
}
export class CompleteTaskDto {
  @IsBoolean() completed!: boolean;
}
