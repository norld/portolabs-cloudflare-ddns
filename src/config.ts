import { config } from 'dotenv';
import { DDNSConfig } from './types';

config();

export class ConfigManager {
  static loadConfig(): DDNSConfig {
    const requiredEnvVars = ['CLOUDFLARE_API_TOKEN', 'DOMAIN', 'RECORD_NAME'];
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return {
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      domain: process.env.DOMAIN!,
      recordName: process.env.RECORD_NAME!,
      ttl: process.env.TTL ? parseInt(process.env.TTL, 10) : 1,
      checkInterval: process.env.CHECK_INTERVAL ? parseInt(process.env.CHECK_INTERVAL, 10) * 1000 : 300000 // 5 minutes default
    };
  }

  static validateConfig(config: DDNSConfig): void {
    if (!config.apiToken || typeof config.apiToken !== 'string') {
      throw new Error('Invalid API token');
    }

    if (!config.domain || typeof config.domain !== 'string') {
      throw new Error('Invalid domain');
    }

    if (!config.recordName || typeof config.recordName !== 'string') {
      throw new Error('Invalid record name');
    }

    if (config.ttl && (config.ttl < 1 || config.ttl > 86400)) {
      throw new Error('TTL must be between 1 and 86400 seconds');
    }

    if (config.checkInterval && config.checkInterval < 60000) {
      throw new Error('Check interval must be at least 60 seconds');
    }
  }
}