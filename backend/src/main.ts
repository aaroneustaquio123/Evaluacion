import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global 'api' -> http://localhost:3000/api/inventario/upload
  app.setGlobalPrefix('api');

  // Habilitar CORS para permitir llamadas desde Angular (http://localhost:4200)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend NestJS escuchando en: http://localhost:${port}/api`);
}
bootstrap();
