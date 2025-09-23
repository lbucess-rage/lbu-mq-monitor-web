import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventDto } from '../mq/dto/event.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
})
export class EventGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventGateway.name);
  private connectedClients = new Map<string, { id: string; connectedAt: Date }>();
  private eventHistory: EventDto[] = [];
  private readonly MAX_HISTORY = 1000;

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const clientInfo = {
      id: client.id,
      connectedAt: new Date(),
    };
    this.connectedClients.set(client.id, clientInfo);
    this.logger.log(`Client connected: ${client.id} (Total clients: ${this.connectedClients.size})`);

    client.emit('connected', {
      message: 'Connected to MQ Monitor',
      clientId: client.id,
      timestamp: new Date(),
    });

    if (this.eventHistory.length > 0) {
      const recentEvents = this.eventHistory.slice(-100);
      client.emit('history', recentEvents);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (Total clients: ${this.connectedClients.size})`);
  }

  sendEvent(event: EventDto) {
    this.addToHistory(event);

    this.server.emit('mqEvent', event);

    if (event.type === 'StationEvent') {
      this.server.emit('stationEvent', event);
    } else if (event.type === 'AgentStatus') {
      this.server.emit('agentStatus', event);
    }

    this.logger.log(`Broadcasted ${event.type} to ${this.connectedClients.size} clients`);
  }

  private addToHistory(event: EventDto) {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory = this.eventHistory.slice(-this.MAX_HISTORY);
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { eventType?: 'StationEvent' | 'AgentStatus' },
    @ConnectedSocket() client: Socket,
  ) {
    const room = data.eventType || 'all';
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to: ${room}`);

    return {
      event: 'subscribed',
      data: {
        room,
        message: `Successfully subscribed to ${room} events`,
      },
    };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { eventType?: 'StationEvent' | 'AgentStatus' },
    @ConnectedSocket() client: Socket,
  ) {
    const room = data.eventType || 'all';
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from: ${room}`);

    return {
      event: 'unsubscribed',
      data: {
        room,
        message: `Successfully unsubscribed from ${room} events`,
      },
    };
  }

  @SubscribeMessage('getStatus')
  handleGetStatus() {
    return {
      event: 'status',
      data: {
        connectedClients: this.connectedClients.size,
        eventHistoryCount: this.eventHistory.length,
        timestamp: new Date(),
      },
    };
  }

  @SubscribeMessage('clearHistory')
  handleClearHistory(@ConnectedSocket() client: Socket) {
    this.eventHistory = [];
    this.server.emit('historyCleared', {
      clearedBy: client.id,
      timestamp: new Date(),
    });
    this.logger.log(`Event history cleared by client: ${client.id}`);

    return {
      event: 'historyCleared',
      data: {
        message: 'Event history has been cleared',
      },
    };
  }

  getConnectedClients() {
    return Array.from(this.connectedClients.values());
  }

  getEventHistory(limit?: number) {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return this.eventHistory;
  }
}