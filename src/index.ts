#!/usr/bin/env node

import { ConfigManager } from './config';
import { DDNSScheduler } from './scheduler';
import { Logger, LogLevel } from './logger';
import { CloudflareDDNS } from './cloudflare-ddns';

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
    if (config.autoDiscoverLocal) {
      console.log(`   Mode: Auto-discover ${config.dnsPattern}.* records`);
    } else {
      console.log(`   Records: ${config.recordNames.join(', ')}`);
    }
    console.log(`   TTL: ${config.ttl}`);
    console.log(`   Check Interval: ${config.checkInterval! / 1000}s`);

    const scheduler = new DDNSScheduler(config);

    const args = process.argv.slice(2);
    
    if (args.includes('--rename-local') || args.includes('-r')) {
      const newPattern = config.newSubdomainPattern;
      if (!newPattern) {
        console.error('❌ NEW_SUBDOMAIN_PATTERN environment variable is required for renaming');
        console.log('Example: NEW_SUBDOMAIN_PATTERN=dev');
        process.exit(1);
      }
      
      console.log(`🔄 Discovering and renaming all local.*.portolabs.id records to ${newPattern}.*.portolabs.id...`);
      
      const ddnsService = new CloudflareDDNS(config);
      
      try {
        const localRecords = await ddnsService.findPatternSubdomains();
        if (localRecords.length === 0) {
          console.log('ℹ️  No local.*.portolabs.id records found');
          process.exit(0);
        }
        
        console.log(`📋 Found ${localRecords.length} local.*.portolabs.id records:`);
        localRecords.forEach(record => console.log(`   ${record.name} → ${record.content}`));
        
        const result = await ddnsService.renameLocalSubdomains(newPattern);
        
        console.log(`✅ Successfully renamed ${result.renamed.length} records`);
        result.renamed.forEach(record => console.log(`   ✅ ${record.name}`));
        
        if (result.errors.length > 0) {
          console.log(`❌ ${result.errors.length} errors occurred:`);
          result.errors.forEach(error => console.log(`   ❌ ${error}`));
        }
        
        process.exit(0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Failed to rename local subdomains:', errorMessage);
        process.exit(1);
      }
    } else if (args.includes('--once') || args.includes('-o')) {
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
      console.log('   RECORD_NAMES=subdomain1.your_domain.com,subdomain2.your_domain.com');
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