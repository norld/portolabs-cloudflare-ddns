import axios, { AxiosInstance } from 'axios';
import { 
  DDNSConfig, 
  CloudflareZoneResponse, 
  CloudflareDNSResponse, 
  CloudflareDNSUpdateResponse,
  CloudflareDNSRecord,
  UpdateResult 
} from './types';
import { IPService } from './ip-service';

export class CloudflareDDNS {
  private readonly client: AxiosInstance;
  private readonly config: DDNSConfig;

  constructor(config: DDNSConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://api.cloudflare.com/client/v4',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async updateDDNS(): Promise<UpdateResult> {
    try {
      const currentIP = await IPService.getCurrentIP();
      console.log(`Current IP: ${currentIP}`);

      const zoneId = await this.getZoneId();
      console.log(`Zone ID: ${zoneId}`);

      const dnsRecord = await this.getDNSRecord(zoneId);

      if (dnsRecord) {
        if (dnsRecord.content === currentIP) {
          console.log(`IP hasn't changed. Current: ${currentIP}`);
          return { updated: false, ip: currentIP };
        }

        console.log(`Updating DNS record from ${dnsRecord.content} to ${currentIP}`);
        await this.updateDNSRecord(zoneId, dnsRecord.id, currentIP);
        console.log('DNS record updated successfully');
        return { updated: true, ip: currentIP, previousIP: dnsRecord.content };
      } else {
        console.log(`Creating new DNS record for ${this.config.recordName} with IP ${currentIP}`);
        await this.createDNSRecord(zoneId, currentIP);
        console.log('DNS record created successfully');
        return { updated: true, ip: currentIP };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('DDNS update failed:', errorMessage);
      throw new Error(`DDNS update failed: ${errorMessage}`);
    }
  }

  private async getZoneId(): Promise<string> {
    try {
      const response = await this.client.get<CloudflareZoneResponse>('/zones', {
        params: { name: this.config.domain }
      });

      if (!response.data.success || response.data.result.length === 0) {
        throw new Error(`Zone not found for domain: ${this.config.domain}`);
      }

      return response.data.result[0].id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get zone ID: ${error.response?.data?.errors?.[0]?.message || error.message}`);
      }
      throw new Error(`Failed to get zone ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getDNSRecord(zoneId: string): Promise<CloudflareDNSRecord | null> {
    try {
      const response = await this.client.get<CloudflareDNSResponse>(`/zones/${zoneId}/dns_records`, {
        params: {
          name: this.config.recordName,
          type: 'A'
        }
      });

      if (!response.data.success) {
        throw new Error(`Failed to fetch DNS records: ${response.data.errors.map(e => e.message).join(', ')}`);
      }

      return response.data.result.length > 0 ? response.data.result[0] : null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get DNS record: ${error.response?.data?.errors?.[0]?.message || error.message}`);
      }
      throw new Error(`Failed to get DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateDNSRecord(zoneId: string, recordId: string, newIP: string): Promise<CloudflareDNSRecord> {
    try {
      const response = await this.client.put<CloudflareDNSUpdateResponse>(`/zones/${zoneId}/dns_records/${recordId}`, {
        type: 'A',
        name: this.config.recordName,
        content: newIP,
        ttl: this.config.ttl || 1
      });

      if (!response.data.success) {
        throw new Error(`Update failed: ${response.data.errors.map(e => e.message).join(', ')}`);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to update DNS record: ${error.response?.data?.errors?.[0]?.message || error.message}`);
      }
      throw new Error(`Failed to update DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createDNSRecord(zoneId: string, newIP: string): Promise<CloudflareDNSRecord> {
    try {
      const response = await this.client.post<CloudflareDNSUpdateResponse>(`/zones/${zoneId}/dns_records`, {
        type: 'A',
        name: this.config.recordName,
        content: newIP,
        ttl: this.config.ttl || 1
      });

      if (!response.data.success) {
        throw new Error(`Creation failed: ${response.data.errors.map(e => e.message).join(', ')}`);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create DNS record: ${error.response?.data?.errors?.[0]?.message || error.message}`);
      }
      throw new Error(`Failed to create DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}