import axios, { AxiosInstance } from 'axios';
import { 
  DDNSConfig, 
  CloudflareZoneResponse, 
  CloudflareDNSResponse, 
  CloudflareDNSUpdateResponse,
  CloudflareDNSRecord,
  UpdateResult,
  MultiUpdateResult 
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

  async getAllDNSRecords(): Promise<CloudflareDNSRecord[]> {
    try {
      const zoneId = await this.getZoneId();
      const response = await this.client.get<CloudflareDNSResponse>(`/zones/${zoneId}/dns_records`, {
        params: {
          type: 'A',
          per_page: 100
        }
      });

      if (!response.data.success) {
        throw new Error(`Failed to fetch DNS records: ${response.data.errors.map(e => e.message).join(', ')}`);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get all DNS records: ${error.response?.data?.errors?.[0]?.message || error.message}`);
      }
      throw new Error(`Failed to get all DNS records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findPatternSubdomains(): Promise<CloudflareDNSRecord[]> {
    const allRecords = await this.getAllDNSRecords();
    const pattern = new RegExp(`^${this.config.dnsPattern}\\.`, 'i');
    
    return allRecords.filter(record => pattern.test(record.name));
  }

  async updateAllPatternSubdomains(): Promise<MultiUpdateResult> {
    try {
      const currentIP = await IPService.getCurrentIP();
      console.log(`Current IP: ${currentIP}`);

      const patternRecords = await this.findPatternSubdomains();
      console.log(`Found ${patternRecords.length} ${this.config.dnsPattern}.* DNS records`);

      if (patternRecords.length === 0) {
        return {
          ip: currentIP,
          results: [],
          totalUpdated: 0
        };
      }

      const zoneId = await this.getZoneId();
      const results: UpdateResult[] = [];
      let totalUpdated = 0;

      for (const record of patternRecords) {
        try {
          if (record.content === currentIP) {
            console.log(`${record.name}: IP hasn't changed. Current: ${currentIP}`);
            results.push({ updated: false, ip: currentIP, recordName: record.name });
          } else {
            console.log(`${record.name}: Updating DNS record from ${record.content} to ${currentIP}`);
            await this.updateDNSRecord(zoneId, record.id, record.name, currentIP);
            console.log(`${record.name}: DNS record updated successfully`);
            results.push({ updated: true, ip: currentIP, previousIP: record.content, recordName: record.name });
            totalUpdated++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to update ${record.name}:`, errorMessage);
          results.push({
            updated: false,
            ip: currentIP,
            recordName: record.name,
            previousIP: record.content
          });
        }
      }

      return {
        ip: currentIP,
        results,
        totalUpdated
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to update ${this.config.dnsPattern} subdomains:`, errorMessage);
      throw new Error(`Failed to update ${this.config.dnsPattern} subdomains: ${errorMessage}`);
    }
  }

  async renameLocalSubdomains(newPattern: string): Promise<{ renamed: CloudflareDNSRecord[]; errors: string[] }> {
    try {
      const localRecords = await this.findPatternSubdomains();
      const renamed: CloudflareDNSRecord[] = [];
      const errors: string[] = [];

      console.log(`Found ${localRecords.length} local.*.portolabs.id records to rename`);

      for (const record of localRecords) {
        try {
          const oldName = record.name;
          const subdomain = oldName.replace(/^local\.(.*)\.portolabs\.id$/, '$1');
          const newName = `${newPattern}.${subdomain}.portolabs.id`;

          console.log(`Renaming: ${oldName} → ${newName}`);

          const zoneId = await this.getZoneId();
          const updatedRecord = await this.updateDNSRecord(zoneId, record.id, newName, record.content);
          renamed.push(updatedRecord);
        } catch (error) {
          const errorMsg = `Failed to rename ${record.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return { renamed, errors };
    } catch (error) {
      throw new Error(`Failed to rename local subdomains: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateDDNS(): Promise<MultiUpdateResult> {
    if (this.config.autoDiscoverLocal) {
      return this.updateAllPatternSubdomains();
    }

    try {
      const currentIP = await IPService.getCurrentIP();
      console.log(`Current IP: ${currentIP}`);

      const zoneId = await this.getZoneId();
      console.log(`Zone ID: ${zoneId}`);

      const results: UpdateResult[] = [];
      let totalUpdated = 0;

      for (const recordName of this.config.recordNames) {
        try {
          const result = await this.updateSingleRecord(zoneId, recordName, currentIP);
          results.push(result);
          if (result.updated) {
            totalUpdated++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to update ${recordName}:`, errorMessage);
          results.push({
            updated: false,
            ip: currentIP,
            recordName,
            previousIP: undefined
          });
        }
      }

      return {
        ip: currentIP,
        results,
        totalUpdated
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('DDNS update failed:', errorMessage);
      throw new Error(`DDNS update failed: ${errorMessage}`);
    }
  }

  private async updateSingleRecord(zoneId: string, recordName: string, currentIP: string): Promise<UpdateResult> {
    const dnsRecord = await this.getDNSRecord(zoneId, recordName);

    if (dnsRecord) {
      if (dnsRecord.content === currentIP) {
        console.log(`${recordName}: IP hasn't changed. Current: ${currentIP}`);
        return { updated: false, ip: currentIP, recordName };
      }

      console.log(`${recordName}: Updating DNS record from ${dnsRecord.content} to ${currentIP}`);
      await this.updateDNSRecord(zoneId, dnsRecord.id, recordName, currentIP);
      console.log(`${recordName}: DNS record updated successfully`);
      return { updated: true, ip: currentIP, previousIP: dnsRecord.content, recordName };
    } else {
      console.log(`${recordName}: Creating new DNS record with IP ${currentIP}`);
      await this.createDNSRecord(zoneId, recordName, currentIP);
      console.log(`${recordName}: DNS record created successfully`);
      return { updated: true, ip: currentIP, recordName };
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

  private async getDNSRecord(zoneId: string, recordName: string): Promise<CloudflareDNSRecord | null> {
    try {
      const response = await this.client.get<CloudflareDNSResponse>(`/zones/${zoneId}/dns_records`, {
        params: {
          name: recordName,
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

  private async updateDNSRecord(zoneId: string, recordId: string, recordName: string, newIP: string): Promise<CloudflareDNSRecord> {
    try {
      const response = await this.client.put<CloudflareDNSUpdateResponse>(`/zones/${zoneId}/dns_records/${recordId}`, {
        type: 'A',
        name: recordName,
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

  private async createDNSRecord(zoneId: string, recordName: string, newIP: string): Promise<CloudflareDNSRecord> {
    try {
      const response = await this.client.post<CloudflareDNSUpdateResponse>(`/zones/${zoneId}/dns_records`, {
        type: 'A',
        name: recordName,
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