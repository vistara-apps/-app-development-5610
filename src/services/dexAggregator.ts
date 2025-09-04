// DEX aggregation service that combines multiple data sources

import { BitqueryService } from './bitquery';
import { BaseRpcService } from './baseRpc';
import { 
  SwapQuote, 
  SwapRoute, 
  DexQuoteParams, 
  DexQuoteResponse, 
  StablecoinSymbol, 
  SupportedDex,
  DexPriceData,
  DEX_CONFIGS
} from '../types';

export class DexAggregatorService {
  private bitqueryService: BitqueryService;
  private baseRpcService: BaseRpcService;
  private priceCache: Map<string, { data: DexPriceData[]; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor(bitqueryApiKey: string, baseRpcUrl: string) {
    this.bitqueryService = new BitqueryService(bitqueryApiKey);
    this.baseRpcService = new BaseRpcService(baseRpcUrl);
  }

  // Get the best swap route across all DEXs
  async getBestSwapRoute(
    tokenIn: StablecoinSymbol,
    tokenOut: StablecoinSymbol,
    amountIn: string,
    slippageTolerance: number = 0.5
  ): Promise<SwapRoute> {
    try {
      // Get quotes from all supported DEXs
      const quotes = await this.getAllQuotes(tokenIn, tokenOut, amountIn, slippageTolerance);
      
      if (quotes.length === 0) {
        throw new Error('No quotes available for this pair');
      }

      // Sort quotes by output amount (best first)
      const sortedQuotes = quotes
        .filter(quote => !quote.error && parseFloat(quote.amountOut) > 0)
        .sort((a, b) => parseFloat(b.amountOut) - parseFloat(a.amountOut));

      if (sortedQuotes.length === 0) {
        throw new Error('No valid quotes available');
      }

      const bestQuote = sortedQuotes[0];
      
      // Convert to SwapQuote format
      const swapQuotes: SwapQuote[] = sortedQuotes.map(quote => ({
        dexName: quote.dex,
        inputAmount: parseFloat(amountIn),
        outputAmount: parseFloat(quote.amountOut),
        price: quote.price,
        priceImpact: quote.priceImpact,
        fee: quote.fee,
        gasEstimate: quote.gasEstimate,
        route: quote.route,
        liquiditySource: quote.dex,
        confidence: quote.confidence,
      }));

      // Estimate total gas cost
      const gasPrice = await this.baseRpcService.getGasPrice();
      const totalGasCost = Number(gasPrice) * bestQuote.gasEstimate / 1e18; // Convert to ETH

      return {
        quotes: swapQuotes,
        bestQuote: swapQuotes[0],
        totalGasCost,
        estimatedTime: this.estimateExecutionTime(bestQuote.dex),
        slippageTolerance,
      };
    } catch (error) {
      console.error('Error getting best swap route:', error);
      throw error;
    }
  }

  // Get quotes from all supported DEXs
  private async getAllQuotes(
    tokenIn: StablecoinSymbol,
    tokenOut: StablecoinSymbol,
    amountIn: string,
    slippageTolerance: number
  ): Promise<DexQuoteResponse[]> {
    const quotePromises: Promise<DexQuoteResponse>[] = [];

    // Get quotes from each supported DEX
    Object.values(SupportedDex).forEach(dex => {
      const config = DEX_CONFIGS[dex];
      if (config.isActive && 
          config.supportedTokens.includes(tokenIn) && 
          config.supportedTokens.includes(tokenOut)) {
        
        const params: DexQuoteParams = {
          dex,
          tokenIn,
          tokenOut,
          amountIn,
          slippageTolerance,
        };

        if (dex === SupportedDex.UNISWAP_V3) {
          quotePromises.push(this.baseRpcService.getUniswapV3Quote(params));
        } else {
          // For other DEXs, we'd need to implement specific quote methods
          // This is a simplified version
          quotePromises.push(this.getEstimatedQuote(params));
        }
      }
    });

    try {
      const results = await Promise.allSettled(quotePromises);
      return results
        .filter((result): result is PromiseFulfilledResult<DexQuoteResponse> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    } catch (error) {
      console.error('Error getting all quotes:', error);
      return [];
    }
  }

  // Get estimated quote for DEXs without direct RPC integration
  private async getEstimatedQuote(params: DexQuoteParams): Promise<DexQuoteResponse> {
    try {
      // Use historical data from Bitquery to estimate current price
      const historicalData = await this.getPriceData(
        params.tokenIn,
        params.tokenOut,
        '1h'
      );

      const dexData = historicalData.find(data => data.dex === params.dex);
      
      if (!dexData) {
        return {
          dex: params.dex,
          amountOut: '0',
          price: 0,
          priceImpact: 0,
          fee: DEX_CONFIGS[params.dex].defaultSlippage / 100,
          gasEstimate: 120000,
          route: [],
          confidence: 0,
          error: 'No historical data available',
        };
      }

      const estimatedOutput = parseFloat(params.amountIn) * dexData.price;
      const priceImpact = this.estimatePriceImpact(parseFloat(params.amountIn), dexData.liquidity);

      return {
        dex: params.dex,
        amountOut: estimatedOutput.toFixed(6),
        price: dexData.price,
        priceImpact,
        fee: dexData.fee,
        gasEstimate: 120000,
        route: [params.tokenIn, params.tokenOut],
        confidence: Math.max(dexData.confidence - 20, 50), // Reduce confidence for estimates
      };
    } catch (error) {
      console.error(`Error getting estimated quote for ${params.dex}:`, error);
      return {
        dex: params.dex,
        amountOut: '0',
        price: 0,
        priceImpact: 0,
        fee: DEX_CONFIGS[params.dex].defaultSlippage / 100,
        gasEstimate: 0,
        route: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get price data with caching
  async getPriceData(
    tokenIn: StablecoinSymbol,
    tokenOut: StablecoinSymbol,
    timeframe: '1h' | '24h' | '7d' = '24h'
  ): Promise<DexPriceData[]> {
    const cacheKey = `${tokenIn}-${tokenOut}-${timeframe}`;
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Try to get real-time data first
      let priceData = await this.bitqueryService.getRealTimePrices(tokenIn, tokenOut);
      
      // If no real-time data, fall back to historical data
      if (priceData.length === 0) {
        priceData = await this.bitqueryService.getDexTradingData(tokenIn, tokenOut, timeframe);
      }

      // Cache the results
      this.priceCache.set(cacheKey, {
        data: priceData,
        timestamp: Date.now(),
      });

      return priceData;
    } catch (error) {
      console.error('Error getting price data:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      
      return [];
    }
  }

  // Get liquidity data across all DEXs
  async getLiquidityData(
    tokenIn: StablecoinSymbol,
    tokenOut: StablecoinSymbol
  ): Promise<DexPriceData[]> {
    try {
      return await this.bitqueryService.getDexTradingData(tokenIn, tokenOut, '24h');
    } catch (error) {
      console.error('Error getting liquidity data:', error);
      return [];
    }
  }

  // Get user token balances
  async getUserBalances(userAddress: string): Promise<Record<StablecoinSymbol, string>> {
    const balances: Record<StablecoinSymbol, string> = {} as any;

    try {
      const balancePromises = Object.entries(StablecoinSymbol).map(async ([key, symbol]) => {
        const tokenAddress = (await import('../types')).STABLECOIN_ADDRESSES[symbol];
        if (tokenAddress) {
          const balance = await this.baseRpcService.getTokenBalance(tokenAddress, userAddress);
          return [symbol, balance] as const;
        }
        return [symbol, '0'] as const;
      });

      const results = await Promise.allSettled(balancePromises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const [symbol, balance] = result.value;
          balances[symbol] = balance;
        }
      });

      return balances;
    } catch (error) {
      console.error('Error getting user balances:', error);
      return balances;
    }
  }

  // Estimate price impact based on trade size and liquidity
  private estimatePriceImpact(tradeSize: number, liquidity: number): number {
    if (liquidity === 0) return 100;
    
    // Simple price impact estimation: larger trades relative to liquidity have higher impact
    const impact = (tradeSize / liquidity) * 100;
    return Math.min(impact, 100); // Cap at 100%
  }

  // Estimate execution time based on DEX
  private estimateExecutionTime(dex: SupportedDex): number {
    switch (dex) {
      case SupportedDex.UNISWAP_V3:
        return 15; // seconds
      case SupportedDex.AERODROME:
        return 12;
      case SupportedDex.BASESWAP:
        return 18;
      case SupportedDex.SUSHISWAP:
        return 20;
      default:
        return 15;
    }
  }

  // Clear price cache
  clearCache(): void {
    this.priceCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.priceCache.size,
      keys: Array.from(this.priceCache.keys()),
    };
  }
}
