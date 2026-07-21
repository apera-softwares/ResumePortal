import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use('/uploads', express.static('uploads'));

  app.use('/uploads', async (req, res, next) => {
    const fileKey = req.path.substring(1); // remove leading slash
    if (!fileKey) {
      return next();
    }

    try {
      const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

      const s3Client = new S3Client({
        region: "auto",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_ID!,
          secretAccessKey: process.env.SECRET_ACCESS_KEY!,
        },
      });

      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: fileKey,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      res.redirect(presignedUrl);
    } catch (err) {
      console.error(`Error redirecting /uploads/${fileKey} to R2/S3:`, err);
      next();
    }
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Resume Portal API')
    .setDescription('The Resume Portal API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 8094);
}
bootstrap();
