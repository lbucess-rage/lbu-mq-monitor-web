import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = '/apps/APP/mq-mon/logs';

    const dailyRotateFileTransport = new DailyRotateFile({
      filename: join(logDir, 'mq-monitor-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    });

    const errorFileTransport = new DailyRotateFile({
      filename: join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    });

    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${level}] ${context ? `[${context}]` : ''} ${message}`;
        }),
      ),
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [dailyRotateFileTransport, errorFileTransport, consoleTransport],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  logMqEvent(eventType: string, topic: string, message: string) {
    this.logger.info('MQ Event Received', {
      eventType,
      topic,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  logStationEvent(stationId: string, event: string, data: any) {
    this.logger.info('Station Event', {
      type: 'StationEvent',
      stationId,
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  logAgentStatus(agentId: string, status: string, data: any) {
    this.logger.info('Agent Status Change', {
      type: 'AgentStatus',
      agentId,
      status,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}