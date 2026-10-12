import { Priority, Recurrence, TaskCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString() @MinLength(1) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsEnum(TaskCategory) category?: TaskCategory;
  @IsOptional() @IsEnum(Recurrence) recurrenceType?: Recurrence;
}
export class UpdateTaskDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsEnum(TaskCategory) category?: TaskCategory;
  @IsOptional() @IsEnum(Recurrence) recurrenceType?: Recurrence;
}
export class CompleteTaskDto {
  @Transform(({ value }) => value === true || value === 'true') @IsBoolean() completed!: boolean;
}
