import axios from 'axios';
import { IPResponse } from './types';

export class IPService {
  private static readonly IP_SERVICES = [
    'https://api.ipify.org?format=json',
    'https://api4.ipify.org?format=json',
    'https://ipinfo.io/json',
    'https://httpbin.org/ip'
  ];

  static async getCurrentIP(): Promise<string> {
    for (const service of this.IP_SERVICES) {
      try {
        const response = await axios.get<IPResponse | any>(service, {
          timeout: 5000
        });
        
        let ip: string;
        if (response.data.ip) {
          ip = response.data.ip;
        } else if (response.data.origin) {
          ip = response.data.origin;
        } else {
          continue;
        }

        if (this.isValidIPv4(ip)) {
          return ip;
        }
      } catch (error) {
        console.warn(`Failed to get IP from ${service}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }
    
    throw new Error('Failed to get current IP from all services');
  }

  private static isValidIPv4(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
}