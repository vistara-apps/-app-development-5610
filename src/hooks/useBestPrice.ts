// Hook for getting the best price across all DEXs

import { useState, useEffect, useCallback } from 'react';
import { DexAggregatorService } from '../services/dexAggregator';
import { environmentService } from '../config/environment';
import { SwapRoute, StablecoinSymbol, LoadingState, AppError } from '../types';

interface UseBestPriceReturn {
  swapRoute: SwapRoute | null;
  loading: LoadingState;
  refreshQuote: () => Promise<void>;
  isStale: boolean;
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

export function useBestPrice(
  tokenIn: StablecoinSymbol | null,
  tokenOut: StablecoinSymbol | null,
  amountIn: string,
  slippageTolerance?: number
): UseBestPriceReturn {
  const [swapRoute, setSwapRoute] = useState<SwapRoute | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: undefined,
    lastUpdated: undefined,
  });
  const [isStale, setIsStale] = useState(false);

  const { enableRealData, mockData } = environmentService.featureFlags;
  const { defaultSlippage } = environmentService.dexConfig;

  // Mock swap route for development
  const getMockSwapRoute = useCallback((): SwapRoute => {
    const inputAmount = parseFloat(amountIn) || 1000;
    const outputAmount = inputAmount * 0.9998; // Simulate small slippage
    
    return {
      quotes: [
        {
          dexName: 'uniswap-v3',
          inputAmount,
          outputAmount,
          price: 0.9998,
          priceImpact: 0.02,
          fee: 0.05,
          gasEstimate: 150000,
          route: [tokenIn!, tokenOut!],
          liquiditySource: 'uniswap-v3',
          confidence: 95,
        },
        {
          dexName: 'aerodrome',
          inputAmount,
          outputAmount: inputAmount * 0.9997,
          price: 0.9997,
          priceImpact: 0.03,
          fee: 0.04,
          gasEstimate: 120000,
          route: [tokenIn!, tokenOut!],
          liquiditySource: 'aerodrome',
          confidence: 90,
        },
      ],
      bestQuote: {
        dexName: 'uniswap-v3',
        inputAmount,
        outputAmount,
        price: 0.9998,
        priceImpact: 0.02,
        fee: 0.05,
        gasEstimate: 150000,
        route: [tokenIn!, tokenOut!],
        liquiditySource: 'uniswap-v3',
        confidence: 95,
      },
      totalGasCost: 0.0025, // ~$2.50 in ETH
      estimatedTime: 15,
      slippageTolerance: slippageTolerance || defaultSlippage,
    };
  }, [tokenIn, tokenOut, amountIn, slippageTolerance, defaultSlippage]);

  const fetchBestPrice = useCallback(async () => {
    if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) <= 0) {
      setSwapRoute(null);
      return;
    }

    setLoading(prev => ({ ...prev, isLoading: true, error: undefined }));
    setIsStale(false);

    try {
      if (!enableRealData || mockData) {
        // Use mock data
        const mockRoute = getMockSwapRoute();
        setSwapRoute(mockRoute);
        
        setLoading({
          isLoading: false,
          error: undefined,
          lastUpdated: new Date(),
        });
        return;
      }

      // Fetch real best price
      const aggregator = getAggregatorService();
      const route = await aggregator.getBestSwapRoute(
        tokenIn,
        tokenOut,
        amountIn,
        slippageTolerance || defaultSlippage
      );

      setSwapRoute(route);
      setLoading({
        isLoading: false,
        error: undefined,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error fetching best price:', error);
      
      const appError: AppError = {
        code: 'BEST_PRICE_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch best price',
        details: error,
        timestamp: new Date(),
      };

      setLoading({
        isLoading: false,
        error: appError,
        lastUpdated: new Date(),
      });

      // Fall back to mock data on error
      const mockRoute = getMockSwapRoute();
      setSwapRoute(mockRoute);
    }
  }, [tokenIn, tokenOut, amountIn, slippageTolerance, enableRealData, mockData, defaultSlippage, getMockSwapRoute]);

  const refreshQuote = useCallback(async () => {
    await fetchBestPrice();
  }, [fetchBestPrice]);

  // Initial fetch
  useEffect(() => {
    fetchBestPrice();
  }, [fetchBestPrice]);

  // Auto-refresh quotes every 15 seconds if real data is enabled
  useEffect(() => {
    if (!enableRealData || mockData || !tokenIn || !tokenOut || !amountIn) return;

    const interval = setInterval(() => {
      setIsStale(true);
      fetchBestPrice();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [enableRealData, mockData, tokenIn, tokenOut, amountIn, fetchBestPrice]);

  // Mark quotes as stale after 30 seconds
  useEffect(() => {
    if (!loading.lastUpdated) return;

    const timeout = setTimeout(() => {
      setIsStale(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timeout);
  }, [loading.lastUpdated]);

  return {
    swapRoute,
    loading,
    refreshQuote,
    isStale,
  };
}
