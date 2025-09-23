import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { ConfigService, MqConfig } from '../config/config.service';
import { EventGateway } from '../websocket/event.gateway';
import { EventDto } from './dto/event.dto';

@Injectable()
export class MqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqService.name);
  private client: mqtt.MqttClient;
  private mqConfig: MqConfig;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_DELAY = 5000;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventGateway: EventGateway,
  ) {}

  async onModuleInit() {
    // Wait a bit for ConfigService to initialize
    setTimeout(() => {
      this.mqConfig = this.configService.getMqConfig();
      if (this.mqConfig) {
        this.logger.log('MQ configuration retrieved successfully');
        this.connect();
      } else {
        this.logger.error('MQ configuration is not available');
      }
    }, 100);
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
    }
  }

  private connect() {
    const mqttUrl = `mqtt://${this.mqConfig.url}:${this.mqConfig.port}`;

    this.client = mqtt.connect(mqttUrl, {
      username: this.mqConfig.user,
      password: this.mqConfig.password,
      clientId: `mq-monitor-${Date.now()}`,
      clean: true,
      reconnectPeriod: this.RECONNECT_DELAY,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker at ${mqttUrl}`);
      this.reconnectAttempts = 0;
      this.subscribeToTopics();
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload);
    });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT connection error: ${error.message}`);
      this.handleReconnect();
    });

    this.client.on('close', () => {
      this.logger.warn('MQTT connection closed');
      this.handleReconnect();
    });

    this.client.on('disconnect', () => {
      this.logger.warn('MQTT client disconnected');
    });

    this.client.on('offline', () => {
      this.logger.warn('MQTT client is offline');
    });
  }

  private subscribeToTopics() {
    // Subscribe to signal/* for station events and agent/* for agent status
    const topics = ['signal/+', 'signal/#', 'agent/+', 'agent/#'];

    topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${topic}: ${err.message}`);
        } else {
          this.logger.log(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  private handleMessage(topic: string, payload: Buffer) {
    try {
      const message = payload.toString();
      const timestamp = new Date();

      // Determine event type based on topic: signal/* = StationEvent, agent/* = AgentStatus
      let eventType: 'StationEvent' | 'AgentStatus';
      if (topic.toLowerCase().startsWith('agent/')) {
        eventType = 'AgentStatus';
      } else if (topic.toLowerCase().startsWith('signal/')) {
        eventType = 'StationEvent';
      } else {
        // Default fallback
        eventType = topic.toLowerCase().includes('agent') ? 'AgentStatus' : 'StationEvent';
      }

      const eventData: EventDto = {
        type: eventType,
        topic,
        message,
        timestamp,
      };

      this.logger.log(`Received ${eventType} on topic ${topic}: ${message.substring(0, 100)}...`);

      this.eventGateway.sendEvent(eventData);

      this.logToFile(eventData);
    } catch (error) {
      this.logger.error(`Error handling message from topic ${topic}: ${error.message}`);
    }
  }

  private logToFile(event: EventDto) {
    const logMessage = `[${event.timestamp.toISOString()}] ${event.type} - Topic: ${event.topic} - Message: ${event.message}`;
    this.logger.log(logMessage);
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      this.logger.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);

      setTimeout(() => {
        if (!this.client.connected) {
          this.client.reconnect();
        }
      }, this.RECONNECT_DELAY);
    } else {
      this.logger.error('Maximum reconnection attempts reached. Please check the MQTT broker.');
    }
  }

  publishMessage(topic: string, message: string) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message, { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`Failed to publish message: ${err.message}`);
        } else {
          this.logger.log(`Message published to ${topic}`);
        }
      });
    } else {
      this.logger.error('MQTT client is not connected');
    }
  }

  getConnectionStatus(): boolean {
    return this.client && this.client.connected;
  }
}