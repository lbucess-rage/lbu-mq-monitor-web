import { Module } from '@nestjs/common';
import { MqService } from './mq.service';
import { ConfigService } from '../config/config.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  providers: [MqService, ConfigService],
  exports: [MqService],
})
export class MqModule {}