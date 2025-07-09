import { AccountManager } from '../../src/account-manager';
import * as path from 'path';

describe('AccountManager', () => {
  let accountManager: AccountManager;
  
  beforeEach(() => {
    const configPath = path.join(__dirname, '../test-accounts.json');
    accountManager = new AccountManager(configPath);
  });
  
  test('should load accounts correctly', () => {
    const accounts = accountManager.getAccountList();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].site).toBe('test.example.com');
  });
  
  test('should get default account', () => {
    expect(accountManager.getDefaultAccount()).toBe('test.example.com');
  });
  
  test('should get client for valid site', () => {
    const client = accountManager.getClient('test.example.com');
    expect(client).toBeDefined();
  });
  
  test('should throw error for invalid site', () => {
    expect(() => {
      accountManager.getClient('invalid.site.com');
    }).toThrow();
  });
  
  test('should find sites by pattern', () => {
    const sites = accountManager.findSitesByPattern('example');
    expect(sites).toHaveLength(1);
  });
});