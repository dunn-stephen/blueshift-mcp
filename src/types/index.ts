export interface AccountConfig {
  site: string;
  userApiKey: string;
  eventApiKey: string;
  region?: 'us' | 'eu';
}

export interface AccountsConfig {
  accounts: Record<string, AccountConfig>;
  defaultAccount?: string;
}

export interface BlueshiftError {
  code: string;
  message: string;
  details?: any;
}

export interface BlueshiftResponse<T = any> {
  data?: T;
  error?: BlueshiftError;
  success: boolean;
}