import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { AuthModule } from '../auth/auth.module';
@Module({ imports: [AuthModule], controllers: [TopicsController], providers: [TopicsService], exports: [TopicsService] })
export class TopicsModule {}
