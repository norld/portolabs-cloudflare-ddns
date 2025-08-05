#!/usr/bin/env node

import { ConfigManager } from './config';
import { DDNSScheduler } from './scheduler';
import { Logger, LogLevel } from './logger';

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting Cloudflare DDNS Service...');

    if (process.env.LOG_LEVEL) {
      Logger.setLevel(process.env.LOG_LEVEL as LogLevel);
    }

    const config = ConfigManager.loadConfig();
    ConfigManager.validateConfig(config);

    console.log(`📋 Configuration loaded:`);
    console.log(`   Domain: ${config.domain}`);
    console.log(`   Record: ${config.recordName}`);
    console.log(`   TTL: ${config.ttl}`);
    console.log(`   Check Interval: ${config.checkInterval! / 1000}s`);

    const scheduler = new DDNSScheduler(config);

    const args = process.argv.slice(2);
    if (args.includes('--once') || args.includes('-o')) {
      console.log('Running single update...');
      await scheduler.runOnce();
      console.log('Single update completed');
      process.exit(0);
    } else {
      scheduler.start();
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to start DDNS service:', errorMessage);
    
    if (errorMessage.includes('Missing required environment variables')) {
      console.log('\n📝 Please create a .env file with the following variables:');
      console.log('   CLOUDFLARE_API_TOKEN=your_token_here');
      console.log('   DOMAIN=your_domain.com');
      console.log('   RECORD_NAME=subdomain.your_domain.com');
      console.log('\nSee .env.example for more details.');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}