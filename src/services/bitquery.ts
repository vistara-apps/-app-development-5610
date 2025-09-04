// Bitquery GraphQL API service for DEX data

import { ApiClient } from './apiClient';
import { DexLiquidityData, DexPriceData, SupportedDex, StablecoinSymbol } from '../types';

interface BitqueryDexTrade {
  dex: {
    smartContract: {
      address: {
        address: string;
      };
    };
    protocolName: string;
  };
  baseCurrency: {
    symbol: string;
    address: string;
  };
  quoteCurrency: {
    symbol: string;
    address: string;
  };
  trades: number;
  tradeAmount: number;
  volume: number;
  maximum_price: number;
  minimum_price: number;
  median_price: number;
}

interface BitqueryLiquidityPool {
  smartContract: {
    address: {
      address: string;
    };
  };
  currency0: {
    symbol: string;
    address: string;
  };
  currency1: {
    symbol: string;
    address: string;
  };
  reserve0: number;
  reserve1: number;
  totalSupply: number;
}

export class BitqueryService {
  private client: ApiClient;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new ApiClient('https://graphql.bitquery.io', {
      headers: {
        'X-API-KEY': apiKey,
      },
    });
  }

  // Get DEX trading data for stablecoin pairs
  async getDexTradingData(
    baseCurrency: StablecoinSymbol,
    quoteCurrency: StablecoinSymbol,
    timeframe: '1h' | '24h' | '7d' = '24h'
  ): Promise<DexPriceData[]> {
    const since = this.getTimeframeSince(timeframe);
    
    const query = `
      query GetDexTrades($baseCurrency: String!, $quoteCurrency: String!, $since: ISO8601DateTime!) {
        ethereum(network: base) {
          dexTrades(
            options: {limit: 100, desc: "trades"}
            date: {since: $since}
            baseCurrency: {is: $baseCurrency}
            quoteCurrency: {is: $quoteCurrency}
          ) {
            dex {
              smartContract {
                address {
                  address
                }
              }
              protocolName
            }
            baseCurrency {
              symbol
              address
            }
            quoteCurrency {
              symbol
              address
            }
            trades: count
            tradeAmount(in: USD)
            volume: tradeAmount(in: USD)
            maximum_price: maximum(of: price)
            minimum_price: minimum(of: price)
            median_price: median(of: price)
          }
        }
      }
    `;

    try {
      const response = await this.client.graphql<{ ethereum: { dexTrades: BitqueryDexTrade[] } }>(
        query,
        {
          baseCurrency: baseCurrency,
          quoteCurrency: quoteCurrency,
          since: since,
        }
      );

      return response.data.ethereum.dexTrades.map(trade => ({
        dex: this.mapProtocolNameToDex(trade.dex.protocolName),
        pair: `${trade.baseCurrency.symbol}/${trade.quoteCurrency.symbol}`,
        price: trade.median_price,
        liquidity: trade.tradeAmount,
        volume24h: trade.volume,
        fee: this.getDefaultFeeForDex(this.mapProtocolNameToDex(trade.dex.protocolName)),
        lastUpdated: new Date(),
        confidence: this.calculateConfidence(trade.trades, trade.volume),
      }));
    } catch (error) {
      console.error('Error fetching DEX trading data:', error);
      return [];
    }
  }

  // Get liquidity pool data
  async getLiquidityPools(
    token0: StablecoinSymbol,
    token1: StablecoinSymbol
  ): Promise<DexLiquidityData[]> {
    const query = `
      query GetLiquidityPools($token0: String!, $token1: String!) {
        ethereum(network: base) {
          smartContractCalls(
            options: {limit: 50}
            smartContractMethod: {name: {in: ["mint", "burn", "sync"]}}
            smartContractAddress: {in: [
              "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
              "0x420DD381b31aEf6683db6B902084cB0FFECe40Da",
              "0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB",
              "0x71524B4f93c58fcbF659783284E38825f0622859"
            ]}
          ) {
            smartContract {
              address {
                address
              }
            }
            smartContractMethod {
              name
            }
            arguments {
              argument
              value
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.graphql<any>(query, {
        token0: token0,
        token1: token1,
      });

      // This is a simplified implementation
      // In production, you'd need to parse the smart contract call data
      // to extract actual liquidity pool information
      return [];
    } catch (error) {
      console.error('Error fetching liquidity pools:', error);
      return [];
    }
  }

  // Get real-time price data for a specific pair across all DEXs
  async getRealTimePrices(
    baseCurrency: StablecoinSymbol,
    quoteCurrency: StablecoinSymbol
  ): Promise<DexPriceData[]> {
    const query = `
      query GetRealTimePrices($baseCurrency: String!, $quoteCurrency: String!) {
        ethereum(network: base) {
          dexTrades(
            options: {limit: 10, desc: "block.timestamp.time"}
            date: {since: "2024-01-01"}
            baseCurrency: {is: $baseCurrency}
            quoteCurrency: {is: $quoteCurrency}
          ) {
            block {
              timestamp {
                time
              }
            }
            dex {
              protocolName
            }
            price
            tradeAmount(in: USD)
            gasValue
          }
        }
      }
    `;

    try {
      const response = await this.client.graphql<any>(query, {
        baseCurrency: baseCurrency,
        quoteCurrency: quoteCurrency,
      });

      return response.data.ethereum.dexTrades.map((trade: any) => ({
        dex: this.mapProtocolNameToDex(trade.dex.protocolName),
        pair: `${baseCurrency}/${quoteCurrency}`,
        price: trade.price,
        liquidity: trade.tradeAmount,
        volume24h: trade.tradeAmount,
        fee: this.getDefaultFeeForDex(this.mapProtocolNameToDex(trade.dex.protocolName)),
        lastUpdated: new Date(trade.block.timestamp.time),
        confidence: 85, // Base confidence for real-time data
      }));
    } catch (error) {
      console.error('Error fetching real-time prices:', error);
      return [];
    }
  }

  private getTimeframeSince(timeframe: '1h' | '24h' | '7d'): string {
    const now = new Date();
    switch (timeframe) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private mapProtocolNameToDex(protocolName: string): SupportedDex {
    const lowerName = protocolName.toLowerCase();
    if (lowerName.includes('uniswap')) return SupportedDex.UNISWAP_V3;
    if (lowerName.includes('aerodrome')) return SupportedDex.AERODROME;
    if (lowerName.includes('baseswap')) return SupportedDex.BASESWAP;
    if (lowerName.includes('sushi')) return SupportedDex.SUSHISWAP;
    return SupportedDex.UNISWAP_V3; // Default fallback
  }

  private getDefaultFeeForDex(dex: SupportedDex): number {
    switch (dex) {
      case SupportedDex.UNISWAP_V3:
        return 0.05;
      case SupportedDex.AERODROME:
        return 0.04;
      case SupportedDex.BASESWAP:
        return 0.25;
      case SupportedDex.SUSHISWAP:
        return 0.30;
      default:
        return 0.30;
    }
  }

  private calculateConfidence(trades: number, volume: number): number {
    // Simple confidence calculation based on trade count and volume
    const tradeScore = Math.min(trades / 100, 1) * 50;
    const volumeScore = Math.min(volume / 1000000, 1) * 50;
    return Math.round(tradeScore + volumeScore);
  }
}
