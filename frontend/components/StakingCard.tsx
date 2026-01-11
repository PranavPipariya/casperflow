'use client'

import { useState } from 'react'

export default function StakingCard({
  walletConnected,
  onStake,
  onUnstake,
}: {
  walletConnected: boolean
  onStake: (amount: number) => void
  onUnstake: () => void
}) {
  const [amount, setAmount] = useState('')
  const [selectedStrategy, setSelectedStrategy] = useState('balanced')

  const strategies = [
    {
      id: 'conservative',
      name: 'Conservative',
      apy: '10.5%',
      risk: 'Low',
      description: 'Top 10 validators, minimal risk',
    },
    {
      id: 'balanced',
      name: 'Balanced',
      apy: '12.8%',
      risk: 'Medium',
      description: 'Top 30 validators, balanced approach',
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      apy: '15.2%',
      risk: 'Higher',
      description: 'High-performance validators, max yield',
    },
  ]

  const handleStake = () => {
    if (!amount || parseFloat(amount) <= 0) return
    onStake(parseFloat(amount))
    setAmount('')
  }

  return (
    <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Stake CSPR</h2>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block">Amount to Stake</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-slate-800 border border-purple-500/30 rounded-xl px-4 py-3 text-white text-xl focus:outline-none focus:border-purple-500"
            disabled={!walletConnected}
          />
          <button className="px-6 py-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-300 font-semibold hover:bg-purple-600/30 transition-all">
            MAX
          </button>
        </div>
        <div className="text-sm text-gray-400 mt-2">
          Balance: {walletConnected ? '10,000 CSPR' : '--'}
        </div>
      </div>

      {/* Yield Strategy Selection */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-3 block">Choose Yield Strategy</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedStrategy === strategy.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{strategy.name}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-300">
                  {strategy.risk}
                </span>
              </div>
              <div className="text-2xl font-bold text-green-400 mb-1">{strategy.apy}</div>
              <div className="text-xs text-gray-400">{strategy.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">You will receive</span>
          <span className="text-xl font-bold text-white">
            {amount ? (parseFloat(amount) * 0.98).toFixed(2) : '0.00'} stCSPR
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Exchange Rate</span>
          <span className="text-gray-300">1 CSPR = 0.98 stCSPR</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleStake}
          disabled={!walletConnected || !amount}
          className="flex-1 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          {walletConnected ? 'Stake CSPR' : 'Connect Wallet to Stake'}
        </button>
        <button
          onClick={onUnstake}
          disabled={!walletConnected}
          className="px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 border border-purple-500/30 hover:border-purple-500 text-white"
        >
          Unstake
        </button>
      </div>

      {/* Auto-compound Notice */}
      <div className="mt-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="text-sm font-semibold text-green-400">Auto-Compounding Active</div>
          <div className="text-xs text-gray-400">
            Rewards automatically restaked every epoch for maximum yield
          </div>
        </div>
      </div>
    </div>
  )
}
