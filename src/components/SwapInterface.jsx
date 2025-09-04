import React, { useState } from 'react';
import { ArrowDown, Settings, Zap } from 'lucide-react';
import { usePaymentContext } from '../hooks/usePaymentContext';

const STABLECOINS = [
  { symbol: 'USDC', name: 'USD Coin', balance: '1,234.56' },
  { symbol: 'USDT', name: 'Tether', balance: '2,567.89' },
  { symbol: 'DAI', name: 'Dai Stablecoin', balance: '789.12' },
  { symbol: 'USDB', name: 'USD Base', balance: '456.78' },
];

function SwapInterface() {
  const [fromToken, setFromToken] = useState(STABLECOINS[0]);
  const [toToken, setToToken] = useState(STABLECOINS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showFromSelect, setShowFromSelect] = useState(false);
  const [showToSelect, setShowToSelect] = useState(false);
  const [paid, setPaid] = useState(false);
  
  const { createSession } = usePaymentContext();

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleFromAmountChange = (value) => {
    setFromAmount(value);
    // Mock exchange rate calculation
    const rate = 1.001; // Small spread for stablecoins
    setToAmount(value ? (parseFloat(value) * rate).toFixed(6) : '');
  };

  const handleExecuteSwap = async () => {
    try {
      await createSession();
      setPaid(true);
      // Here you would execute the actual swap
      alert('Swap executed successfully!');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment required to execute swap');
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Swap Stablecoins</h2>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Zap className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {/* From Token */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">From</span>
            <span className="text-sm text-gray-400">Balance: {fromToken.balance}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setShowFromSelect(!showFromSelect)}
                className="flex items-center space-x-2 bg-gray-700/50 rounded-lg px-3 py-2 hover:bg-gray-700 transition-colors"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                <span className="font-medium text-white">{fromToken.symbol}</span>
                <ArrowDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showFromSelect && (
                <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 p-2 z-10 min-w-48">
                  {STABLECOINS.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        setFromToken(token);
                        setShowFromSelect(false);
                      }}
                      className="w-full flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                      <div className="text-left">
                        <div className="text-white font-medium">{token.symbol}</div>
                        <div className="text-gray-400 text-xs">{token.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className="flex-1 bg-transparent text-white text-right text-xl font-medium placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button 
            onClick={handleSwapTokens}
            className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowDown className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        {/* To Token */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">To</span>
            <span className="text-sm text-gray-400">Balance: {toToken.balance}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setShowToSelect(!showToSelect)}
                className="flex items-center space-x-2 bg-gray-700/50 rounded-lg px-3 py-2 hover:bg-gray-700 transition-colors"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                <span className="font-medium text-white">{toToken.symbol}</span>
                <ArrowDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showToSelect && (
                <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 p-2 z-10 min-w-48">
                  {STABLECOINS.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        setToToken(token);
                        setShowToSelect(false);
                      }}
                      className="w-full flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                      <div className="text-left">
                        <div className="text-white font-medium">{token.symbol}</div>
                        <div className="text-gray-400 text-xs">{token.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="flex-1 bg-transparent text-white text-right text-xl font-medium placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Swap Details */}
      {fromAmount && (
        <div className="mt-4 p-4 bg-gray-800/30 rounded-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Exchange Rate</span>
            <span className="text-white">1 {fromToken.symbol} = 1.001 {toToken.symbol}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Best Route</span>
            <span className="text-white">Aerodrome → Uniswap V3</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Price Impact</span>
            <span className="text-green-400">0.01%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Gas Fee</span>
            <span className="text-white">~$0.12</span>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <button 
        onClick={handleExecuteSwap}
        disabled={!fromAmount || parseFloat(fromAmount) <= 0}
        className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200"
      >
        {!fromAmount ? 'Enter an amount' : 'Execute Swap'}
      </button>
    </div>
  );
}

export default SwapInterface;