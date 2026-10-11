import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './module';
async function main() {
 const app = await NestFactory.create(AppModule);
 app.use(helmet());
 app.setGlobalPrefix('api');
 app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
 app.enableCors({origin:(process.env.CORS_ORIGIN||'http://localhost:5173').split(',').map(s=>s.trim())});
 await app.listen(Number(process.env.PORT)||5000);
}
void main();
