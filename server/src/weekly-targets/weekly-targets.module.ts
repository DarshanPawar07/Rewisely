import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WeeklyTargetsController } from './weekly-targets.controller';
import { WeeklyTargetsService } from './weekly-targets.service';
@Module({ imports: [AuthModule], controllers: [WeeklyTargetsController], providers: [WeeklyTargetsService] })
export class WeeklyTargetsModule {}
