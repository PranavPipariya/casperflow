'use client'

import { useState } from 'react'

export default function UnstakingModal({
  onClose,
  stCSPRBalance,
  onUnstake,
}: {
  onClose: () => void
  stCSPRBalance: number
  onUnstake: (amount: number, instant: boolean) => void
}) {
  const [amount, setAmount] = useState('')
  const [unstakeMethod, setUnstakeMethod] = useState<'instant' | 'standard'>('instant')

  const csprAmount = parseFloat(amount) * 1.02 // Exchange rate with rewards
  const instantFee = csprAmount * 0.005 // 0.5% fee
  const netInstant = csprAmount - instantFee

  const handleUnstake = () => {
    if (!amount || parseFloat(amount) <= 0) return
    onUnstake(parseFloat(amount), unstakeMethod === 'instant')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Unstake stCSPR</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Amount to Unstake</label>
          <div className="flex gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              max={stCSPRBalance}
              className="flex-1 bg-slate-800 border border-purple-500/30 rounded-xl px-4 py-3 text-white text-xl focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => setAmount(stCSPRBalance.toString())}
              className="px-6 py-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-300 font-semibold hover:bg-purple-600/30 transition-all"
            >
              MAX
            </button>
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Available: {stCSPRBalance.toFixed(2)} stCSPR
          </div>
        </div>

        {/* Unstaking Method */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-3 block">Choose Unstaking Method</label>
          <div className="grid grid-cols-2 gap-4">
            {/* Instant Unstaking */}
            <button
              onClick={() => setUnstakeMethod('instant')}
              className={`p-6 rounded-xl border text-left transition-all ${
                unstakeMethod === 'instant'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <span className="font-bold text-white">Instant</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="text-gray-300">
                  Receive: <span className="text-white font-semibold">
                    {amount ? netInstant.toFixed(2) : '0.00'}
                  </span> CSPR
                </div>
                <div className="text-gray-400">Fee: 0.5%</div>
                <div className="text-gray-400">Time: Immediate</div>
              </div>
              <div className="mt-3 text-xs text-green-400">
                ✓ No waiting period
              </div>
            </button>

            {/* Standard Unstaking */}
            <button
              onClick={() => setUnstakeMethod('standard')}
              className={`p-6 rounded-xl border text-left transition-all ${
                unstakeMethod === 'standard'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⏱</span>
                <span className="font-bold text-white">Standard</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="text-gray-300">
                  Receive: <span className="text-white font-semibold">
                    {amount ? csprAmount.toFixed(2) : '0.00'}
                  </span> CSPR
                </div>
                <div className="text-gray-400">Fee: 0%</div>
                <div className="text-gray-400">Time: ~7 days</div>
              </div>
              <div className="mt-3 text-xs text-blue-400">
                ✓ Maximum returns
              </div>
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">You're unstaking</div>
              <div className="text-xl font-bold text-white">
                {amount || '0.00'} stCSPR
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">You will receive</div>
              <div className="text-xl font-bold text-green-400">
                {amount
                  ? unstakeMethod === 'instant'
                    ? netInstant.toFixed(2)
                    : csprAmount.toFixed(2)
                  : '0.00'}{' '}
                CSPR
              </div>
            </div>
          </div>
          {unstakeMethod === 'instant' && amount && (
            <div className="mt-3 pt-3 border-t border-purple-500/20 text-xs text-gray-400">
              Fee: {instantFee.toFixed(2)} CSPR goes to liquidity providers
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-bold text-lg bg-slate-800 border border-purple-500/30 hover:border-purple-500 text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUnstake}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > stCSPRBalance}
            className="flex-1 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {unstakeMethod === 'instant' ? 'Unstake Instantly' : 'Start Unstaking'}
          </button>
        </div>

        {unstakeMethod === 'standard' && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            ℹ️ Standard unstaking requires a 7-day unbonding period. You'll receive your CSPR after this period.
          </div>
        )}
      </div>
    </div>
  )
}
