// Environment configuration and validation

interface EnvironmentConfig {
  // API Configuration
  bitqueryApiKey: string;
  quicknodeRpcUrl: string;
  walletConnectProjectId: string;
  
  // Fallback RPC URLs
  ankrRpcUrl: string;
  publicRpcUrl: string;
  
  // Application Settings
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  
  // Feature Flags
  enableRealData: boolean;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  
  // Cache Settings
  priceCacheTimeout: number;
  liquidityCacheTimeout: number;
  
  // DEX Settings
  defaultSlippage: number;
  maxSlippage: number;
  gasMultiplier: number;
  
  // Payment Settings
  paymentApiUrl: string;
  tradeFee: number;
  
  // Monitoring
  sentryDsn?: string;
  mixpanelToken?: string;
  
  // Development
  debugMode: boolean;
  mockData: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

class EnvironmentService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // API Configuration
      bitqueryApiKey: import.meta.env.VITE_BITQUERY_API_KEY || '',
      quicknodeRpcUrl: import.meta.env.VITE_QUICKNODE_RPC_URL || '',
      walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '9f4bd472c01ba49282b42e5e1874c2af',
      
      // Fallback RPC URLs
      ankrRpcUrl: import.meta.env.VITE_ANKR_RPC_URL || 'https://rpc.ankr.com/base',
      publicRpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL || 'https://mainnet.base.org',
      
      // Application Settings
      appName: import.meta.env.VITE_APP_NAME || 'StableSwap Scout',
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: (import.meta.env.VITE_ENVIRONMENT as any) || 'development',
      
      // Feature Flags
      enableRealData: import.meta.env.VITE_ENABLE_REAL_DATA === 'true',
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
      
      // Cache Settings
      priceCacheTimeout: parseInt(import.meta.env.VITE_PRICE_CACHE_TIMEOUT || '30000'),
      liquidityCacheTimeout: parseInt(import.meta.env.VITE_LIQUIDITY_CACHE_TIMEOUT || '60000'),
      
      // DEX Settings
      defaultSlippage: parseFloat(import.meta.env.VITE_DEFAULT_SLIPPAGE || '0.5'),
      maxSlippage: parseFloat(import.meta.env.VITE_MAX_SLIPPAGE || '5.0'),
      gasMultiplier: parseFloat(import.meta.env.VITE_GAS_MULTIPLIER || '1.2'),
      
      // Payment Settings
      paymentApiUrl: import.meta.env.VITE_PAYMENT_API_URL || 'https://payments.vistara.dev',
      tradeFee: parseFloat(import.meta.env.VITE_TRADE_FEE || '0.001'),
      
      // Monitoring
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
      mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN,
      
      // Development
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      mockData: import.meta.env.VITE_MOCK_DATA === 'true',
      logLevel: (import.meta.env.VITE_LOG_LEVEL as any) || 'info',
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate required fields for production
    if (this.config.environment === 'production') {
      if (!this.config.bitqueryApiKey) {
        errors.push('VITE_BITQUERY_API_KEY is required in production');
      }
      
      if (!this.config.quicknodeRpcUrl) {
        errors.push('VITE_QUICKNODE_RPC_URL is required in production');
      }
      
      if (!this.config.walletConnectProjectId) {
        errors.push('VITE_WALLETCONNECT_PROJECT_ID is required');
      }
    }

    // Validate numeric ranges
    if (this.config.defaultSlippage < 0 || this.config.defaultSlippage > 100) {
      errors.push('VITE_DEFAULT_SLIPPAGE must be between 0 and 100');
    }
    
    if (this.config.maxSlippage < 0 || this.config.maxSlippage > 100) {
      errors.push('VITE_MAX_SLIPPAGE must be between 0 and 100');
    }
    
    if (this.config.gasMultiplier < 1 || this.config.gasMultiplier > 5) {
      errors.push('VITE_GAS_MULTIPLIER must be between 1 and 5');
    }

    // Validate URLs
    if (this.config.quicknodeRpcUrl && !this.isValidUrl(this.config.quicknodeRpcUrl)) {
      errors.push('VITE_QUICKNODE_RPC_URL must be a valid URL');
    }
    
    if (this.config.paymentApiUrl && !this.isValidUrl(this.config.paymentApiUrl)) {
      errors.push('VITE_PAYMENT_API_URL must be a valid URL');
    }

    if (errors.length > 0) {
      console.error('Environment configuration errors:', errors);
      if (this.config.environment === 'production') {
        throw new Error(`Invalid environment configuration: ${errors.join(', ')}`);
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Getters for configuration values
  get apiConfig() {
    return {
      bitqueryApiKey: this.config.bitqueryApiKey,
      quicknodeRpcUrl: this.config.quicknodeRpcUrl,
      walletConnectProjectId: this.config.walletConnectProjectId,
      ankrRpcUrl: this.config.ankrRpcUrl,
      publicRpcUrl: this.config.publicRpcUrl,
    };
  }

  get appConfig() {
    return {
      name: this.config.appName,
      version: this.config.appVersion,
      environment: this.config.environment,
    };
  }

  get featureFlags() {
    return {
      enableRealData: this.config.enableRealData,
      enableAnalytics: this.config.enableAnalytics,
      enableErrorReporting: this.config.enableErrorReporting,
    };
  }

  get cacheConfig() {
    return {
      priceCacheTimeout: this.config.priceCacheTimeout,
      liquidityCacheTimeout: this.config.liquidityCacheTimeout,
    };
  }

  get dexConfig() {
    return {
      defaultSlippage: this.config.defaultSlippage,
      maxSlippage: this.config.maxSlippage,
      gasMultiplier: this.config.gasMultiplier,
    };
  }

  get paymentConfig() {
    return {
      apiUrl: this.config.paymentApiUrl,
      tradeFee: this.config.tradeFee,
    };
  }

  get monitoringConfig() {
    return {
      sentryDsn: this.config.sentryDsn,
      mixpanelToken: this.config.mixpanelToken,
    };
  }

  get developmentConfig() {
    return {
      debugMode: this.config.debugMode,
      mockData: this.config.mockData,
      logLevel: this.config.logLevel,
    };
  }

  // Get the best available RPC URL
  getBestRpcUrl(): string {
    if (this.config.quicknodeRpcUrl) {
      return this.config.quicknodeRpcUrl;
    }
    
    if (this.config.ankrRpcUrl) {
      return this.config.ankrRpcUrl;
    }
    
    return this.config.publicRpcUrl;
  }

  // Check if we're in development mode
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  // Check if we're in production mode
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  // Get full configuration (for debugging)
  getFullConfig(): EnvironmentConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const environmentService = new EnvironmentService();
export type { EnvironmentConfig };
