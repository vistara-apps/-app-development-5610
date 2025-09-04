// DEX-specific types and configurations

import { SupportedDex, StablecoinSymbol } from './entities';

export interface DexConfig {
  name: SupportedDex;
  displayName: string;
  logo: string;
  color: string;
  routerAddress: string;
  factoryAddress: string;
  quoterAddress?: string; // For Uniswap V3
  isActive: boolean;
  supportedTokens: StablecoinSymbol[];
  defaultSlippage: number;
  maxSlippage: number;
  gasMultiplier: number;
}

export interface DexPriceData {
  dex: SupportedDex;
  pair: string;
  price: number;
  liquidity: number;
  volume24h: number;
  fee: number;
  lastUpdated: Date;
  confidence: number;
}

export interface DexLiquidityData {
  dex: SupportedDex;
  pair: string;
  totalLiquidity: number;
  reserve0: number;
  reserve1: number;
  token0: string;
  token1: string;
  apy?: number;
  volume24h: number;
  fees24h: number;
}

export interface DexSwapParams {
  dex: SupportedDex;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  recipient: string;
  deadline: number;
  slippageTolerance: number;
}

export interface DexQuoteParams {
  dex: SupportedDex;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance?: number;
}

export interface DexQuoteResponse {
  dex: SupportedDex;
  amountOut: string;
  price: number;
  priceImpact: number;
  fee: number;
  gasEstimate: number;
  route: string[];
  confidence: number;
  error?: string;
}

// Base chain stablecoin addresses
export const STABLECOIN_ADDRESSES: Record<StablecoinSymbol, string> = {
  [StablecoinSymbol.USDC]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [StablecoinSymbol.USDT]: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  [StablecoinSymbol.DAI]: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  [StablecoinSymbol.FRAX]: '0x4158734D47Fc9692176B5085E0F52ee0Da5d47F1',
  [StablecoinSymbol.LUSD]: '0x368181499736d0c0CC614DBB145E2EC1AC86b8c6',
  [StablecoinSymbol.BUSD]: '0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39'
};

// DEX configurations for Base chain
export const DEX_CONFIGS: Record<SupportedDex, DexConfig> = {
  [SupportedDex.UNISWAP_V3]: {
    name: SupportedDex.UNISWAP_V3,
    displayName: 'Uniswap V3',
    logo: '🦄',
    color: '#FF007A',
    routerAddress: '0x2626664c2603336E57B271c5C0b26F421741e481',
    factoryAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    quoterAddress: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    isActive: true,
    supportedTokens: [
      StablecoinSymbol.USDC,
      StablecoinSymbol.USDT,
      StablecoinSymbol.DAI,
      StablecoinSymbol.FRAX
    ],
    defaultSlippage: 0.5,
    maxSlippage: 5.0,
    gasMultiplier: 1.2
  },
  [SupportedDex.AERODROME]: {
    name: SupportedDex.AERODROME,
    displayName: 'Aerodrome',
    logo: '✈️',
    color: '#4ECDC4',
    routerAddress: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    factoryAddress: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
    isActive: true,
    supportedTokens: [
      StablecoinSymbol.USDC,
      StablecoinSymbol.USDT,
      StablecoinSymbol.DAI
    ],
    defaultSlippage: 0.3,
    maxSlippage: 3.0,
    gasMultiplier: 1.1
  },
  [SupportedDex.BASESWAP]: {
    name: SupportedDex.BASESWAP,
    displayName: 'BaseSwap',
    logo: '🔷',
    color: '#45B7D1',
    routerAddress: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
    factoryAddress: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
    isActive: true,
    supportedTokens: [
      StablecoinSymbol.USDC,
      StablecoinSymbol.USDT,
      StablecoinSymbol.DAI
    ],
    defaultSlippage: 0.5,
    maxSlippage: 5.0,
    gasMultiplier: 1.15
  },
  [SupportedDex.SUSHISWAP]: {
    name: SupportedDex.SUSHISWAP,
    displayName: 'SushiSwap',
    logo: '🍣',
    color: '#96CEB4',
    routerAddress: '0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891',
    factoryAddress: '0x71524B4f93c58fcbF659783284E38825f0622859',
    isActive: true,
    supportedTokens: [
      StablecoinSymbol.USDC,
      StablecoinSymbol.USDT,
      StablecoinSymbol.DAI
    ],
    defaultSlippage: 0.5,
    maxSlippage: 5.0,
    gasMultiplier: 1.2
  }
};

export const STABLECOIN_INFO: Record<StablecoinSymbol, {
  name: string;
  decimals: number;
  logoURI: string;
}> = {
  [StablecoinSymbol.USDC]: {
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png'
  },
  [StablecoinSymbol.USDT]: {
    name: 'Tether USD',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/325/thumb/Tether-logo.png'
  },
  [StablecoinSymbol.DAI]: {
    name: 'Dai Stablecoin',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/9956/thumb/4943.png'
  },
  [StablecoinSymbol.FRAX]: {
    name: 'Frax',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/13422/thumb/frax_logo.png'
  },
  [StablecoinSymbol.LUSD]: {
    name: 'Liquity USD',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/14666/thumb/Group_3.png'
  },
  [StablecoinSymbol.BUSD]: {
    name: 'Binance USD',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/9576/thumb/BUSD.png'
  }
};
