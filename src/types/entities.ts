// Core entity types as specified in the PRD data model

export interface User {
  userId: string;
  walletAddress: string;
  preferredStablecoins: string[];
  tradeHistory: Trade[];
  createdAt: Date;
  lastActiveAt: Date;
}

export interface MarketData {
  timestamp: Date;
  dexName: string;
  stablecoinPair: string;
  buyPrice: number;
  sellPrice: number;
  liquidityDepth: number;
  volume24h?: number;
  fee?: number;
}

export interface Trade {
  tradeId: string;
  userId: string;
  stablecoinIn: string;
  stablecoinOut: string;
  amountIn: number;
  amountOut: number;
  executionPrice: number;
  dexUsed: string;
  timestamp: Date;
  transactionHash?: string;
  status: TradeStatus;
  gasUsed?: number;
  gasCost?: number;
  slippage?: number;
}

export interface DexInfo {
  name: string;
  displayName: string;
  logo: string;
  contractAddress: string;
  routerAddress: string;
  factoryAddress: string;
  isActive: boolean;
  supportedPairs: string[];
  defaultFee: number;
}

export interface LiquidityPool {
  address: string;
  dexName: string;
  token0: TokenInfo;
  token1: TokenInfo;
  reserve0: number;
  reserve1: number;
  totalLiquidity: number;
  volume24h: number;
  fee: number;
  apy?: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isStablecoin: boolean;
}

export interface SwapQuote {
  dexName: string;
  inputAmount: number;
  outputAmount: number;
  price: number;
  priceImpact: number;
  fee: number;
  gasEstimate: number;
  route: string[];
  liquiditySource: string;
  confidence: number; // 0-100 confidence score
}

export interface SwapRoute {
  quotes: SwapQuote[];
  bestQuote: SwapQuote;
  totalGasCost: number;
  estimatedTime: number; // in seconds
  slippageTolerance: number;
}

export interface UserPreferences {
  userId: string;
  slippageTolerance: number; // percentage
  gasPrice: 'slow' | 'standard' | 'fast';
  preferredDexes: string[];
  autoSlippage: boolean;
  notifications: {
    trades: boolean;
    priceAlerts: boolean;
    system: boolean;
  };
}

export enum TradeStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum StablecoinSymbol {
  USDC = 'USDC',
  USDT = 'USDT',
  DAI = 'DAI',
  FRAX = 'FRAX',
  LUSD = 'LUSD',
  BUSD = 'BUSD'
}

export enum SupportedDex {
  UNISWAP_V3 = 'uniswap-v3',
  AERODROME = 'aerodrome',
  BASESWAP = 'baseswap',
  SUSHISWAP = 'sushiswap'
}
