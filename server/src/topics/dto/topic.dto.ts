import { Difficulty } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTopicDto { @IsString() subjectId!: string; @IsString() @MinLength(1) title!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() notes?: string; @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty; }
export class UpdateTopicDto { @IsOptional() @IsString() subjectId?: string; @IsOptional() @IsString() @MinLength(1) title?: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() notes?: string; @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty; }
