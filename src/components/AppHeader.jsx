import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Search, Settings, Bell } from 'lucide-react';

function AppHeader() {
  return (
    <header className="border-b border-gray-700/50 bg-black/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <h1 className="text-xl font-bold text-white">StableSwap Scout</h1>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-white hover:text-cyan-400 transition-colors">Swap</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Analytics</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Pools</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">History</a>
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  className="bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                />
              </div>
              
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;