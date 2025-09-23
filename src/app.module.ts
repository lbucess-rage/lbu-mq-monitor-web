import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MqModule } from './mq/mq.module';
import { WebsocketModule } from './websocket/websocket.module';
import { LoggerModule } from './logger/logger.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MqModule,
    WebsocketModule,
    LoggerModule,
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppModule {}