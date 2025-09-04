// Hook for fetching and managing DEX data

import { useState, useEffect, useCallback } from 'react';
import { DexAggregatorService } from '../services/dexAggregator';
import { environmentService } from '../config/environment';
import { DexPriceData, StablecoinSymbol, LoadingState, AppError } from '../types';

interface UseDexDataReturn {
  priceData: DexPriceData[];
  liquidityData: DexPriceData[];
  loading: LoadingState;
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

// Singleton aggregator service
let aggregatorService: DexAggregatorService | null = null;

function getAggregatorService(): DexAggregatorService {
  if (!aggregatorService) {
    const { bitqueryApiKey } = environmentService.apiConfig;
    const rpcUrl = environmentService.getBestRpcUrl();
    
    aggregatorService = new DexAggregatorService(bitqueryApiKey, rpcUrl);
  }
  return aggregatorService;
}

export function useDexData(
  tokenIn: StablecoinSymbol,
  tokenOut: StablecoinSymbol,
  timeframe: '1h' | '24h' | '7d' = '24h'
): UseDexDataReturn {
  const [priceData, setPriceData] = useState<DexPriceData[]>([]);
  const [liquidityData, setLiquidityData] = useState<DexPriceData[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: undefined,
    lastUpdated: undefined,
  });

  const { enableRealData, mockData } = environmentService.featureFlags;

  // Mock data fallback
  const getMockData = useCallback((): DexPriceData[] => {
    return [
      {
        dex: 'uniswap-v3' as any,
        pair: `${tokenIn}/${tokenOut}`,
        price: 0.9998,
        liquidity: 2400000,
        volume24h: 12400000,
        fee: 0.05,
        lastUpdated: new Date(),
        confidence: 95,
      },
      {
        dex: 'aerodrome' as any,
        pair: `${tokenIn}/${tokenOut}`,
        price: 0.9997,
        liquidity: 1800000,
        volume24h: 8200000,
        fee: 0.04,
        lastUpdated: new Date(),
        confidence: 90,
      },
      {
        dex: 'baseswap' as any,
        pair: `${tokenIn}/${tokenOut}`,
        price: 0.9996,
        liquidity: 950000,
        volume24h: 3100000,
        fee: 0.25,
        lastUpdated: new Date(),
        confidence: 85,
      },
      {
        dex: 'sushiswap' as any,
        pair: `${tokenIn}/${tokenOut}`,
        price: 0.9995,
        liquidity: 650000,
        volume24h: 1800000,
        fee: 0.30,
        lastUpdated: new Date(),
        confidence: 80,
      },
    ];
  }, [tokenIn, tokenOut]);

  const fetchData = useCallback(async () => {
    if (!tokenIn || !tokenOut) return;

    setLoading(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      if (!enableRealData || mockData) {
        // Use mock data
        const mockPriceData = getMockData();
        setPriceData(mockPriceData);
        setLiquidityData(mockPriceData);
        
        setLoading({
          isLoading: false,
          error: undefined,
          lastUpdated: new Date(),
        });
        return;
      }

      // Fetch real data
      const aggregator = getAggregatorService();
      
      const [realPriceData, realLiquidityData] = await Promise.all([
        aggregator.getPriceData(tokenIn, tokenOut, timeframe),
        aggregator.getLiquidityData(tokenIn, tokenOut),
      ]);

      // If no real data available, fall back to mock data
      if (realPriceData.length === 0) {
        console.warn('No real price data available, using mock data');
        const mockPriceData = getMockData();
        setPriceData(mockPriceData);
        setLiquidityData(mockPriceData);
      } else {
        setPriceData(realPriceData);
        setLiquidityData(realLiquidityData.length > 0 ? realLiquidityData : realPriceData);
      }

      setLoading({
        isLoading: false,
        error: undefined,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error fetching DEX data:', error);
      
      const appError: AppError = {
        code: 'DEX_DATA_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch DEX data',
        details: error,
        timestamp: new Date(),
      };

      setLoading({
        isLoading: false,
        error: appError,
        lastUpdated: new Date(),
      });

      // Fall back to mock data on error
      const mockPriceData = getMockData();
      setPriceData(mockPriceData);
      setLiquidityData(mockPriceData);
    }
  }, [tokenIn, tokenOut, timeframe, enableRealData, mockData, getMockData]);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const clearCache = useCallback(() => {
    if (aggregatorService) {
      aggregatorService.clearCache();
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh data every 30 seconds if real data is enabled
  useEffect(() => {
    if (!enableRealData || mockData) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [enableRealData, mockData, fetchData]);

  return {
    priceData,
    liquidityData,
    loading,
    refreshData,
    clearCache,
  };
}
