// Base RPC service for direct blockchain interactions

import { createPublicClient, http, formatUnits, parseUnits, Address } from 'viem';
import { base } from 'viem/chains';
import { DexQuoteParams, DexQuoteResponse, STABLECOIN_ADDRESSES, DEX_CONFIGS } from '../types';

// Uniswap V3 Quoter ABI (simplified)
const UNISWAP_V3_QUOTER_ABI = [
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'sqrtPriceLimitX96', type: 'uint160' }
    ],
    name: 'quoteExactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// ERC20 ABI (simplified)
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Uniswap V2 Pair ABI (for other DEXs)
const UNISWAP_V2_PAIR_ABI = [
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export class BaseRpcService {
  private client: ReturnType<typeof createPublicClient>;
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
    this.client = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    });
  }

  // Get quote from Uniswap V3
  async getUniswapV3Quote(params: DexQuoteParams): Promise<DexQuoteResponse> {
    try {
      const config = DEX_CONFIGS.UNISWAP_V3;
      const tokenInAddress = STABLECOIN_ADDRESSES[params.tokenIn as keyof typeof STABLECOIN_ADDRESSES];
      const tokenOutAddress = STABLECOIN_ADDRESSES[params.tokenOut as keyof typeof STABLECOIN_ADDRESSES];

      if (!tokenInAddress || !tokenOutAddress) {
        throw new Error('Unsupported token pair');
      }

      // Get token decimals
      const [tokenInDecimals, tokenOutDecimals] = await Promise.all([
        this.getTokenDecimals(tokenInAddress as Address),
        this.getTokenDecimals(tokenOutAddress as Address),
      ]);

      const amountInWei = parseUnits(params.amountIn, tokenInDecimals);

      // Call Uniswap V3 Quoter
      const amountOut = await this.client.readContract({
        address: config.quoterAddress as Address,
        abi: UNISWAP_V3_QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [
          tokenInAddress as Address,
          tokenOutAddress as Address,
          500, // 0.05% fee tier
          amountInWei,
          0n // No price limit
        ],
      });

      const amountOutFormatted = formatUnits(amountOut, tokenOutDecimals);
      const price = parseFloat(amountOutFormatted) / parseFloat(params.amountIn);

      return {
        dex: params.dex,
        amountOut: amountOutFormatted,
        price,
        priceImpact: 0.02, // Estimated
        fee: 0.05,
        gasEstimate: 150000,
        route: [params.tokenIn, params.tokenOut],
        confidence: 95,
      };
    } catch (error) {
      console.error('Error getting Uniswap V3 quote:', error);
      return {
        dex: params.dex,
        amountOut: '0',
        price: 0,
        priceImpact: 0,
        fee: 0.05,
        gasEstimate: 0,
        route: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get quote from Uniswap V2-style DEXs (Aerodrome, BaseSwap, SushiSwap)
  async getUniswapV2Quote(params: DexQuoteParams, pairAddress: string): Promise<DexQuoteResponse> {
    try {
      const tokenInAddress = STABLECOIN_ADDRESSES[params.tokenIn as keyof typeof STABLECOIN_ADDRESSES];
      const tokenOutAddress = STABLECOIN_ADDRESSES[params.tokenOut as keyof typeof STABLECOIN_ADDRESSES];

      if (!tokenInAddress || !tokenOutAddress) {
        throw new Error('Unsupported token pair');
      }

      // Get pair reserves
      const [reserves, token0Address, token1Address] = await Promise.all([
        this.client.readContract({
          address: pairAddress as Address,
          abi: UNISWAP_V2_PAIR_ABI,
          functionName: 'getReserves',
        }),
        this.client.readContract({
          address: pairAddress as Address,
          abi: UNISWAP_V2_PAIR_ABI,
          functionName: 'token0',
        }),
        this.client.readContract({
          address: pairAddress as Address,
          abi: UNISWAP_V2_PAIR_ABI,
          functionName: 'token1',
        }),
      ]);

      const [reserve0, reserve1] = reserves;
      
      // Determine which token is which
      const isToken0Input = tokenInAddress.toLowerCase() === token0Address.toLowerCase();
      const reserveIn = isToken0Input ? reserve0 : reserve1;
      const reserveOut = isToken0Input ? reserve1 : reserve0;

      // Get token decimals
      const [tokenInDecimals, tokenOutDecimals] = await Promise.all([
        this.getTokenDecimals(tokenInAddress as Address),
        this.getTokenDecimals(tokenOutAddress as Address),
      ]);

      const amountInWei = parseUnits(params.amountIn, tokenInDecimals);

      // Calculate output using constant product formula (x * y = k)
      // amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
      const numerator = amountInWei * reserveOut;
      const denominator = reserveIn + amountInWei;
      const amountOutWei = numerator / denominator;

      const amountOutFormatted = formatUnits(amountOutWei, tokenOutDecimals);
      const price = parseFloat(amountOutFormatted) / parseFloat(params.amountIn);

      // Calculate price impact
      const priceImpact = this.calculatePriceImpact(
        parseFloat(params.amountIn),
        parseFloat(amountOutFormatted),
        Number(formatUnits(reserveIn, tokenInDecimals)),
        Number(formatUnits(reserveOut, tokenOutDecimals))
      );

      return {
        dex: params.dex,
        amountOut: amountOutFormatted,
        price,
        priceImpact,
        fee: DEX_CONFIGS[params.dex].defaultSlippage / 100,
        gasEstimate: 120000,
        route: [params.tokenIn, params.tokenOut],
        confidence: 90,
      };
    } catch (error) {
      console.error(`Error getting ${params.dex} quote:`, error);
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

  // Get token balance
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const balance = await this.client.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as Address],
      });

      const decimals = await this.getTokenDecimals(tokenAddress as Address);
      return formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }

  // Get token decimals
  async getTokenDecimals(tokenAddress: Address): Promise<number> {
    try {
      const decimals = await this.client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      return decimals;
    } catch (error) {
      console.error('Error getting token decimals:', error);
      return 18; // Default to 18 decimals
    }
  }

  // Get token symbol
  async getTokenSymbol(tokenAddress: Address): Promise<string> {
    try {
      const symbol = await this.client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      });
      return symbol;
    } catch (error) {
      console.error('Error getting token symbol:', error);
      return 'UNKNOWN';
    }
  }

  // Get current gas price
  async getGasPrice(): Promise<bigint> {
    try {
      return await this.client.getGasPrice();
    } catch (error) {
      console.error('Error getting gas price:', error);
      return 1000000000n; // 1 gwei fallback
    }
  }

  // Estimate gas for a transaction
  async estimateGas(transaction: any): Promise<bigint> {
    try {
      return await this.client.estimateGas(transaction);
    } catch (error) {
      console.error('Error estimating gas:', error);
      return 150000n; // Default gas limit
    }
  }

  private calculatePriceImpact(
    amountIn: number,
    amountOut: number,
    reserveIn: number,
    reserveOut: number
  ): number {
    // Calculate the price without slippage
    const priceWithoutSlippage = reserveOut / reserveIn;
    
    // Calculate the actual price
    const actualPrice = amountOut / amountIn;
    
    // Calculate price impact as percentage
    const priceImpact = Math.abs((actualPrice - priceWithoutSlippage) / priceWithoutSlippage) * 100;
    
    return Math.min(priceImpact, 100); // Cap at 100%
  }

  // Get the best quote across all supported DEXs
  async getBestQuote(params: DexQuoteParams): Promise<DexQuoteResponse[]> {
    const quotes: Promise<DexQuoteResponse>[] = [];

    // Add Uniswap V3 quote
    quotes.push(this.getUniswapV3Quote({ ...params, dex: 'uniswap-v3' as any }));

    // Add other DEX quotes (would need actual pair addresses)
    // This is simplified - in production you'd need to discover pair addresses
    // quotes.push(this.getUniswapV2Quote({ ...params, dex: 'aerodrome' as any }, 'PAIR_ADDRESS'));

    try {
      const results = await Promise.allSettled(quotes);
      return results
        .filter((result): result is PromiseFulfilledResult<DexQuoteResponse> => 
          result.status === 'fulfilled' && !result.value.error
        )
        .map(result => result.value)
        .sort((a, b) => parseFloat(b.amountOut) - parseFloat(a.amountOut));
    } catch (error) {
      console.error('Error getting best quote:', error);
      return [];
    }
  }
}
