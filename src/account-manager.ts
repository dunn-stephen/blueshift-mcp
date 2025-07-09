import * as fs from 'fs';
import * as path from 'path';
import { BlueshiftClient } from './blueshift-client';
import { AccountConfig, AccountsConfig } from './types';
import { Logger } from './utils/logger';

export class AccountManager {
  private config: AccountsConfig;
  private clients: Map<string, BlueshiftClient> = new Map();
  
  constructor(configPath: string) {
    try {
      const fullPath = path.resolve(configPath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Configuration file not found: ${fullPath}`);
      }
      
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      this.config = JSON.parse(fileContent);
      
      this.validateConfig();
      
      Logger.info(`Loaded ${Object.keys(this.config.accounts).length} Blueshift accounts`);
    } catch (error) {
      Logger.error('Failed to load accounts configuration', error);
      throw error;
    }
  }
  
  private validateConfig() {
    if (!this.config.accounts || typeof this.config.accounts !== 'object') {
      throw new Error('Invalid configuration: "accounts" must be an object');
    }
    
    const accountCount = Object.keys(this.config.accounts).length;
    if (accountCount === 0) {
      throw new Error('No accounts found in configuration');
    }
    
    // Validate each account
    for (const [site, account] of Object.entries(this.config.accounts)) {
      if (!account.userApiKey || !account.eventApiKey) {
        throw new Error(`Account ${site} is missing required API keys`);
      }
      
      if (site !== account.site) {
        Logger.warn(`Account key "${site}" doesn't match site name "${account.site}"`);
      }
    }
    
    // Validate default account if specified
    if (this.config.defaultAccount && !this.config.accounts[this.config.defaultAccount]) {
      throw new Error(`Default account "${this.config.defaultAccount}" not found in accounts`);
    }
  }
  
  getAccountList(): Array<{ site: string; region: string; isDefault: boolean }> {
    const defaultAccount = this.config.defaultAccount;
    
    return Object.entries(this.config.accounts).map(([site, account]) => ({
      site: account.site,
      region: account.region || 'us',
      isDefault: site === defaultAccount
    }));
  }
  
  getDefaultAccount(): string | undefined {
    return this.config.defaultAccount;
  }
  
  getClient(site?: string): BlueshiftClient {
    const targetSite = site || this.config.defaultAccount;
    
    if (!targetSite) {
      throw new Error('No site specified and no default account configured');
    }
    
    // Check exact match first
    let accountConfig = this.config.accounts[targetSite];
    
    // If no exact match, try partial matching
    if (!accountConfig) {
      const sites = Object.keys(this.config.accounts);
      const matches = sites.filter(s => 
        s.toLowerCase().includes(targetSite.toLowerCase()) ||
        targetSite.toLowerCase().includes(s.toLowerCase())
      );
      
      if (matches.length === 1) {
        accountConfig = this.config.accounts[matches[0]];
        Logger.debug(`Matched site "${targetSite}" to "${matches[0]}"`);
      } else if (matches.length > 1) {
        throw new Error(
          `Multiple sites match "${targetSite}": ${matches.join(', ')}. ` +
          'Please be more specific.'
        );
      } else {
        throw new Error(
          `Site "${targetSite}" not found. Available sites: ${sites.join(', ')}`
        );
      }
    }
    
    // Return cached client if exists
    const cacheKey = accountConfig.site;
    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey)!;
    }
    
    // Create new client
    const client = new BlueshiftClient({
      userApiKey: accountConfig.userApiKey,
      eventApiKey: accountConfig.eventApiKey,
      region: accountConfig.region
    });
    
    this.clients.set(cacheKey, client);
    return client;
  }
  
  findSitesByPattern(pattern: string): string[] {
    const sites = Object.keys(this.config.accounts);
    const lowercasePattern = pattern.toLowerCase();
    
    return sites.filter(site => 
      site.toLowerCase().includes(lowercasePattern)
    );
  }
  
  getSitesByDomain(domain: string): string[] {
    const sites = Object.keys(this.config.accounts);
    return sites.filter(site => site.endsWith(domain));
  }
  
  validateSite(site: string): boolean {
    return this.config.accounts.hasOwnProperty(site);
  }
}