import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TopicsModule } from './topics/topics.module';
import { RevisionsModule } from './revisions/revisions.module';
import { TasksModule } from './tasks/tasks.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AccountModule } from './account/account.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WeeklyTargetsModule } from './weekly-targets/weekly-targets.module';
import { StudyModule } from './track-study/track-study.module';
@Module({ imports: [PrismaModule, AuthModule, SubjectsModule, TopicsModule, RevisionsModule, TasksModule, DashboardModule, AccountModule, AnalyticsModule, WeeklyTargetsModule, StudyModule] })
export class AppModule {}
