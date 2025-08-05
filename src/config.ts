import { config } from 'dotenv';
import { DDNSConfig } from './types';

config();

export class ConfigManager {
  static loadConfig(): DDNSConfig {
    const autoDiscoverLocal = process.env.AUTO_DISCOVER_LOCAL === 'true';
    
    // If auto-discover is enabled, RECORD_NAMES is optional
    const requiredEnvVars = autoDiscoverLocal 
      ? ['CLOUDFLARE_API_TOKEN', 'DOMAIN'] 
      : ['CLOUDFLARE_API_TOKEN', 'DOMAIN', 'RECORD_NAMES'];
    
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    let recordNames: string[] = [];
    if (!autoDiscoverLocal) {
      const recordNamesStr = process.env.RECORD_NAMES!;
      recordNames = recordNamesStr.split(',').map(name => name.trim()).filter(name => name.length > 0);
      
      if (recordNames.length === 0) {
        throw new Error('RECORD_NAMES must contain at least one valid record name');
      }
    }

    return {
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      domain: process.env.DOMAIN!,
      recordNames,
      ttl: process.env.TTL ? parseInt(process.env.TTL, 10) : 1,
      checkInterval: process.env.CHECK_INTERVAL ? parseInt(process.env.CHECK_INTERVAL, 10) * 1000 : 300000, // 5 minutes default
      newSubdomainPattern: process.env.NEW_SUBDOMAIN_PATTERN,
      autoDiscoverLocal,
      dnsPattern: process.env.DNS_PATTERN || 'local'
    };
  }

  static validateConfig(config: DDNSConfig): void {
    if (!config.apiToken || typeof config.apiToken !== 'string') {
      throw new Error('Invalid API token');
    }

    if (!config.domain || typeof config.domain !== 'string') {
      throw new Error('Invalid domain');
    }

    if (!config.autoDiscoverLocal) {
      if (!config.recordNames || !Array.isArray(config.recordNames) || config.recordNames.length === 0) {
        throw new Error('Invalid record names - must be a non-empty array');
      }

      for (const recordName of config.recordNames) {
        if (!recordName || typeof recordName !== 'string') {
          throw new Error(`Invalid record name: ${recordName}`);
        }
      }
    }

    if (config.ttl && (config.ttl < 1 || config.ttl > 86400)) {
      throw new Error('TTL must be between 1 and 86400 seconds');
    }

    if (config.checkInterval && config.checkInterval < 60000) {
      throw new Error('Check interval must be at least 60 seconds');
    }
  }
}