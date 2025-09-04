import React, { useState } from 'react';
import AppHeader from './components/AppHeader';
import SwapInterface from './components/SwapInterface';
import MarketOverview from './components/MarketOverview';
import DexComparison from './components/DexComparison';
import LiquidityChart from './components/LiquidityChart';

function App() {
  const [selectedToken, setSelectedToken] = useState('USDC');

  return (
    <div className="min-h-screen text-white">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Swap Interface */}
          <div className="lg:col-span-2 space-y-8">
            <SwapInterface />
            <LiquidityChart selectedToken={selectedToken} />
            <DexComparison />
          </div>
          
          {/* Market Overview Sidebar */}
          <div className="lg:col-span-1">
            <MarketOverview onTokenSelect={setSelectedToken} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;