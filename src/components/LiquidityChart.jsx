import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

const CHART_DATA = [
  { time: '00:00', price: 1.0001, volume: 12.5 },
  { time: '04:00', price: 1.0003, volume: 18.2 },
  { time: '08:00', price: 0.9998, volume: 25.7 },
  { time: '12:00', price: 1.0001, volume: 34.1 },
  { time: '16:00', price: 1.0005, volume: 28.9 },
  { time: '20:00', price: 1.0002, volume: 22.3 },
  { time: '24:00', price: 1.0001, volume: 19.6 },
];

function LiquidityChart({ selectedToken }) {
  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Liquidity Analysis</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">Token: {selectedToken}</span>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-cyan-600 text-white text-xs rounded-lg">24H</button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600">7D</button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600">30D</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Chart */}
        <div className="bg-gray-800/30 rounded-xl p-4">
          <h3 className="text-lg font-medium text-white mb-4">Price Movement</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  domain={['dataMin - 0.0005', 'dataMax + 0.0005']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Chart */}
        <div className="bg-gray-800/30 rounded-xl p-4">
          <h3 className="text-lg font-medium text-white mb-4">Trading Volume</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-800/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">$89.2M</div>
          <div className="text-sm text-gray-400">Total Liquidity</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">0.01%</div>
          <div className="text-sm text-gray-400">Avg Slippage</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">142.5M</div>
          <div className="text-sm text-gray-400">24h Volume</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">8</div>
          <div className="text-sm text-gray-400">Active Pools</div>
        </div>
      </div>
    </div>
  );
}

export default LiquidityChart;