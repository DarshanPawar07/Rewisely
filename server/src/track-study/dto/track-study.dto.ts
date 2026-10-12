import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateStudySubjectDto {
  @IsString() @MaxLength(80) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class CreateStudyChapterDto {
  @IsString() @MaxLength(160) title!: string;
  @IsOptional() @IsString() @MaxLength(10000) notes?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export class UpdateStudyChapterDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(10000) notes?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export class UpdateChapterStepDto {
  @IsOptional() @IsBoolean() done?: boolean;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) score?: number | null;
  @IsOptional() @IsString() @MaxLength(10000) notes?: string | null;
}

export class StudyStepInputDto {
  @IsOptional() @IsString() @MaxLength(64) id?: string;
  @IsString() @MaxLength(40) name!: string;
  @IsString() @IsIn(['#4f8ef7', '#f59e0b', '#8b5cf6', '#14b8a6', '#f43f5e', '#84934a']) colour!: string;
}

export class SaveStudyStepsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => StudyStepInputDto)
  steps!: StudyStepInputDto[];
  @IsOptional() @IsIn(['subject', 'all']) scope: 'subject' | 'all' = 'subject';
}
