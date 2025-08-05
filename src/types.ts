export interface DDNSConfig {
  apiToken: string;
  domain: string;
  recordNames: string[];
  ttl?: number;
  checkInterval?: number;
  newSubdomainPattern?: string;
  autoDiscoverLocal?: boolean;
  dnsPattern?: string;
}

export interface CloudflareZoneResponse {
  success: boolean;
  result: Array<{
    id: string;
    name: string;
  }>;
  errors: Array<{ message: string }>;
}

export interface CloudflareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
}

export interface CloudflareDNSResponse {
  success: boolean;
  result: CloudflareDNSRecord[];
  errors: Array<{ message: string }>;
}

export interface CloudflareDNSUpdateResponse {
  success: boolean;
  result: CloudflareDNSRecord;
  errors: Array<{ message: string }>;
}

export interface IPResponse {
  ip: string;
}

export interface UpdateResult {
  updated: boolean;
  ip: string;
  previousIP?: string;
  recordName: string;
}

export interface MultiUpdateResult {
  ip: string;
  results: UpdateResult[];
  totalUpdated: number;
}