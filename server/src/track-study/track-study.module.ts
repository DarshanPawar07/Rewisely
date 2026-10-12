import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StudyController } from './track-study.controller';
import { StudyService } from './track-study.service';

@Module({ imports: [AuthModule], controllers: [StudyController], providers: [StudyService] })
export class StudyModule {}
