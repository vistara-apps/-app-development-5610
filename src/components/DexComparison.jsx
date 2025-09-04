import React from 'react';
import { ExternalLink, Star } from 'lucide-react';

const DEX_DATA = [
  {
    name: 'Aerodrome',
    logo: '🛩️',
    rate: '1.0012',
    liquidity: '$89.2M',
    fee: '0.05%',
    slippage: '0.01%',
    rating: 4.8,
    isBest: true
  },
  {
    name: 'Uniswap V3',
    logo: '🦄',
    rate: '1.0010',
    liquidity: '$156.8M',
    fee: '0.05%',
    slippage: '0.02%',
    rating: 4.9,
    isBest: false
  },
  {
    name: 'BaseSwap',
    logo: '🔵',
    rate: '1.0008',
    liquidity: '$45.6M',
    fee: '0.30%',
    slippage: '0.03%',
    rating: 4.5,
    isBest: false
  },
  {
    name: 'SushiSwap',
    logo: '🍣',
    rate: '1.0005',
    liquidity: '$23.4M',
    fee: '0.30%',
    slippage: '0.05%',
    rating: 4.3,
    isBest: false
  }
];

function DexComparison() {
  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">DEX Comparison</h2>
        <span className="text-sm text-gray-400">USDC → USDT</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="text-left text-gray-400 font-medium py-3 px-2">Exchange</th>
              <th className="text-left text-gray-400 font-medium py-3 px-2">Rate</th>
              <th className="text-left text-gray-400 font-medium py-3 px-2">Liquidity</th>
              <th className="text-left text-gray-400 font-medium py-3 px-2">Fee</th>
              <th className="text-left text-gray-400 font-medium py-3 px-2">Slippage</th>
              <th className="text-left text-gray-400 font-medium py-3 px-2">Rating</th>
              <th className="text-left text-gray-400 font-medium py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {DEX_DATA.map((dex, index) => (
              <tr key={dex.name} className={`border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors ${dex.isBest ? 'bg-cyan-900/20' : ''}`}>
                <td className="py-4 px-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{dex.logo}</span>
                    <div>
                      <div className="font-medium text-white">{dex.name}</div>
                      {dex.isBest && (
                        <div className="text-xs text-cyan-400 font-medium">Best Rate</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2">
                  <span className="text-white font-medium">{dex.rate}</span>
                </td>
                <td className="py-4 px-2">
                  <span className="text-white">{dex.liquidity}</span>
                </td>
                <td className="py-4 px-2">
                  <span className="text-white">{dex.fee}</span>
                </td>
                <td className="py-4 px-2">
                  <span className={`${parseFloat(dex.slippage) <= 0.02 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {dex.slippage}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white">{dex.rating}</span>
                  </div>
                </td>
                <td className="py-4 px-2">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        * Rates and liquidity data updated every 30 seconds
      </div>
    </div>
  );
}

export default DexComparison;