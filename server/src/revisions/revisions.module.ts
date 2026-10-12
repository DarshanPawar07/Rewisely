import { Module } from '@nestjs/common';
import { RevisionsController } from './revisions.controller';
import { RevisionsService } from './revisions.service';
import { AuthModule } from '../auth/auth.module';
@Module({ imports: [AuthModule], controllers: [RevisionsController], providers: [RevisionsService] })
export class RevisionsModule {}
