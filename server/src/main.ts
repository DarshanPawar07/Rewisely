import { RequestMethod, ValidationPipe } from '@nestjs/common'; import { NestFactory } from '@nestjs/core'; import { AppModule } from './app.module';
function allowedClientOrigins() {
  const configured = process.env.CLIENT_URL?.split(',').map(value => value.trim()).filter(Boolean) ?? [];
  return configured.map(value => { try { return new URL(value).origin; } catch { return value.replace(/\/+$/, ''); } });
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', { exclude: [{ path: 'health', method: RequestMethod.GET }] });

  const origins = allowedClientOrigins();
  if (!origins.length && process.env.NODE_ENV === 'production') {
    throw new Error('CLIENT_URL must contain the allowed frontend origin(s) in production.');
  }
  app.enableCors({ origin: origins.length ? origins : ['http://localhost:5173'], credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT || 5000);
}

void bootstrap();
