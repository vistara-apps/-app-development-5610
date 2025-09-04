// Main types export file
export * from './entities';
export * from './dex';

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: AppError;
  lastUpdated?: Date;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'price_update' | 'liquidity_update' | 'trade_update' | 'system_message';
  data: any;
  timestamp: Date;
}

export interface PriceUpdateMessage extends WebSocketMessage {
  type: 'price_update';
  data: {
    pair: string;
    dex: string;
    price: number;
    change24h: number;
  };
}

export interface LiquidityUpdateMessage extends WebSocketMessage {
  type: 'liquidity_update';
  data: {
    pair: string;
    dex: string;
    liquidity: number;
    volume24h: number;
  };
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  isLoading: boolean;
  error?: AppError;
  retry?: () => void;
}
