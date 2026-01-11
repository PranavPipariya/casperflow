export default function PortfolioDashboard({
  stakedAmount,
  stCSPRBalance,
  walletConnected,
}: {
  stakedAmount: number
  stCSPRBalance: number
  walletConnected: boolean
}) {
  const totalValue = stakedAmount
  const projectedYearly = totalValue * 0.142 // 14.2% APY
  const projectedDaily = projectedYearly / 365

  return (
    <div className="space-y-6">
      {/* Portfolio Card */}
      <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Your Portfolio</h3>

        {walletConnected ? (
          <>
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Total Value Staked</div>
              <div className="text-4xl font-bold text-white mb-1">
                {totalValue.toFixed(2)} CSPR
              </div>
              <div className="text-sm text-gray-400">
                ≈ ${(totalValue * 0.045).toFixed(2)} USD
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">stCSPR Balance</span>
                <span className="text-white font-semibold">
                  {stCSPRBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current APY</span>
                <span className="text-green-400 font-semibold">14.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Auto-Compound Boost</span>
                <span className="text-purple-400 font-semibold">+1.8%</span>
              </div>
            </div>

            <div className="h-px bg-purple-500/20 my-6"></div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-300">Projected Earnings</div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Daily</span>
                <span className="text-white font-semibold">
                  +{projectedDaily.toFixed(2)} CSPR
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Monthly</span>
                <span className="text-white font-semibold">
                  +{(projectedDaily * 30).toFixed(2)} CSPR
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Yearly</span>
                <span className="text-green-400 font-semibold text-lg">
                  +{projectedYearly.toFixed(2)} CSPR
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔒</div>
            <div className="text-gray-400">Connect wallet to view portfolio</div>
          </div>
        )}
      </div>

      {/* Validator Distribution */}
      <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Validator Distribution</h3>

        {walletConnected && stakedAmount > 0 ? (
          <div className="space-y-3">
            {[
              { name: 'Validator A', percentage: 28, performance: '99.8%' },
              { name: 'Validator B', percentage: 25, performance: '99.5%' },
              { name: 'Validator C', percentage: 22, performance: '99.9%' },
              { name: 'Validator D', percentage: 15, performance: '99.2%' },
              { name: 'Others', percentage: 10, performance: '99.0%' },
            ].map((validator, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300">{validator.name}</span>
                  <span className="text-sm text-gray-400">{validator.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${validator.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Performance: {validator.performance}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            Stake CSPR to see validator distribution
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Protocol Benefits</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-300">Use stCSPR in any DeFi protocol</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-300">Automatic reward compounding</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-300">Instant unstaking available</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-300">Diversified validator set</span>
          </div>
        </div>
      </div>
    </div>
  )
}
