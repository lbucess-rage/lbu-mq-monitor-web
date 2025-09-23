import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as ini from 'ini';
import { join } from 'path';

export interface MqConfig {
  url: string;
  port: number;
  user: string;
  password: string;
}

@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name);
  private config: any;
  private mqConfig: MqConfig;

  onModuleInit() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const configPath = '/apps/APP/conf/ivr.ini';
      const configFile = fs.readFileSync(configPath, 'utf-8');
      this.config = ini.parse(configFile);

      if (this.config.MQ) {
        this.mqConfig = {
          url: this.config.MQ.URL || '127.0.0.1',
          port: parseInt(this.config.MQ.PORT) || 1884,
          user: this.config.MQ.USER || 'bluebay',
          password: this.config.MQ.PASSWORD || 'bluecti_pw',
        };
        this.logger.log(`MQ Configuration loaded - URL: ${this.mqConfig.url}:${this.mqConfig.port}`);
      } else {
        this.logger.error('MQ configuration not found in ivr.ini');
      }
    } catch (error) {
      this.logger.error(`Failed to load configuration: ${error.message}`);
      throw error;
    }
  }

  getMqConfig(): MqConfig {
    return this.mqConfig;
  }

  getConfig(section: string, key?: string) {
    if (!this.config || !this.config[section]) {
      return null;
    }
    return key ? this.config[section][key] : this.config[section];
  }
}