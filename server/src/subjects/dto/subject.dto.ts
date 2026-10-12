import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSubjectDto { @IsString() @MinLength(1) name!: string; @IsOptional() @IsString() description?: string; }
export class UpdateSubjectDto { @IsOptional() @IsString() @MinLength(1) name?: string; @IsOptional() @IsString() description?: string; }
