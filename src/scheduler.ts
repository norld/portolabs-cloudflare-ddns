import { CloudflareDDNS } from './cloudflare-ddns';
import { DDNSConfig } from './types';

export class DDNSScheduler {
  private ddnsService: CloudflareDDNS;
  private config: DDNSConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: DDNSConfig) {
    this.config = config;
    this.ddnsService = new CloudflareDDNS(config);
  }

  start(): void {
    if (this.isRunning) {
      console.log('DDNS scheduler is already running');
      return;
    }

    console.log(`Starting DDNS scheduler with ${this.config.checkInterval! / 1000}s interval`);
    this.isRunning = true;

    this.runUpdate();

    this.intervalId = setInterval(() => {
      this.runUpdate();
    }, this.config.checkInterval!);

    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping DDNS scheduler...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    process.exit(0);
  }

  async runOnce(): Promise<void> {
    await this.runUpdate();
  }

  private async runUpdate(): Promise<void> {
    try {
      const result = await this.ddnsService.updateDDNS();
      
      if (result.updated) {
        console.log(`✅ DNS updated successfully: ${result.previousIP || 'new'} → ${result.ip} at ${new Date().toISOString()}`);
      } else {
        console.log(`ℹ️  No update needed. IP remains: ${result.ip} at ${new Date().toISOString()}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Update failed at ${new Date().toISOString()}:`, errorMessage);
    }
  }
}