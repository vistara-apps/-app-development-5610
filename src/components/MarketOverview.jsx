import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MARKET_DATA = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    price: '$1.0001',
    change: '+0.01%',
    volume: '$142.5M',
    liquidity: '$89.2M',
    isPositive: true
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    price: '$0.9998',
    change: '-0.02%',
    volume: '$256.7M',
    liquidity: '$156.8M',
    isPositive: false
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    price: '$1.0003',
    change: '+0.03%',
    volume: '$78.9M',
    liquidity: '$45.6M',
    isPositive: true
  },
  {
    symbol: 'USDB',
    name: 'USD Base',
    price: '$1.0000',
    change: '0.00%',
    volume: '$23.4M',
    liquidity: '$12.8M',
    isPositive: true
  }
];

function MarketOverview({ onTokenSelect }) {
  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Market Overview</h2>
        <span className="text-sm text-gray-400">Last updated: 2s ago</span>
      </div>

      <div className="space-y-4">
        {MARKET_DATA.map((token) => (
          <div 
            key={token.symbol}
            onClick={() => onTokenSelect(token.symbol)}
            className="p-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 transition-all cursor-pointer border border-gray-700/50 hover:border-gray-600/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-white">{token.symbol}</div>
                  <div className="text-xs text-gray-400">{token.name}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium text-white">{token.price}</div>
                <div className={`text-xs flex items-center ${token.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {token.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {token.change}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-400">24h Volume</div>
                <div className="text-white font-medium">{token.volume}</div>
              </div>
              <div>
                <div className="text-gray-400">Liquidity</div>
                <div className="text-white font-medium">{token.liquidity}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-800/30 rounded-lg">
            <div className="text-2xl font-bold text-cyan-400">$501.5M</div>
            <div className="text-xs text-gray-400">Total Liquidity</div>
          </div>
          <div className="text-center p-3 bg-gray-800/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">24</div>
            <div className="text-xs text-gray-400">Active DEXs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketOverview;