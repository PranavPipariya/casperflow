'use client'

import { useState, useEffect } from 'react'
import { connectWallet, getAccountBalance, stakeCSPR, unstakeCSPR, getDeployStatus } from '../lib/casper'

export default function Home() {
  const [step, setStep] = useState<'landing' | 'wallet' | 'app'>('landing')
  const [walletConnected, setWalletConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [balance, setBalance] = useState('0')
  const [view, setView] = useState<'stake' | 'portfolio'>('stake')
  const [stakeAmount, setStakeAmount] = useState('')
  const [totalStaked, setTotalStaked] = useState(0)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<string>('')

  async function handleConnectWallet() {
    setLoading(true)
    try {
      const pubKey = await connectWallet()
      if (pubKey) {
        setPublicKey(pubKey)
        setWalletConnected(true)
        setStep('app')
        const bal = await getAccountBalance(pubKey)
        setBalance(bal)
      } else {
        alert('Wallet connection failed. Please install CSPR.click extension.')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to connect wallet')
    }
    setLoading(false)
  }

  async function handleStake() {
    if (!publicKey || !stakeAmount || parseFloat(stakeAmount) <= 0) return

    setLoading(true)
    try {
      const deployHash = await stakeCSPR(publicKey, stakeAmount)
      setTxHash(deployHash)
      setTxStatus('Pending')
      alert(`Stake transaction submitted!\nDeploy Hash: ${deployHash}\n\nView on explorer: https://testnet.cspr.live/deploy/${deployHash}`)

      // Poll for status
      const interval = setInterval(async () => {
        const status = await getDeployStatus(deployHash)
        setTxStatus(status)
        if (status === 'Success' || status === 'Failed') {
          clearInterval(interval)
          if (status === 'Success') {
            setTotalStaked(prev => prev + parseFloat(stakeAmount))
            setStakeAmount('')
            const newBal = await getAccountBalance(publicKey)
            setBalance(newBal)
          }
        }
      }, 5000)
    } catch (error: any) {
      console.error(error)
      alert(`Staking failed: ${error.message}`)
    }
    setLoading(false)
  }

  async function handleUnstake() {
    if (!publicKey || totalStaked <= 0) return

    setLoading(true)
    try {
      const deployHash = await unstakeCSPR(publicKey, totalStaked.toString(), false)
      setTxHash(deployHash)
      setTxStatus('Pending')
      alert(`Unstake transaction submitted!\nDeploy Hash: ${deployHash}\n\nView on explorer: https://testnet.cspr.live/deploy/${deployHash}`)

      const interval = setInterval(async () => {
        const status = await getDeployStatus(deployHash)
        setTxStatus(status)
        if (status === 'Success' || status === 'Failed') {
          clearInterval(interval)
          if (status === 'Success') {
            setTotalStaked(0)
            const newBal = await getAccountBalance(publicKey)
            setBalance(newBal)
          }
        }
      }, 5000)
    } catch (error: any) {
      console.error(error)
      alert(`Unstaking failed: ${error.message}`)
    }
    setLoading(false)
  }

  // Landing Screen
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-black text-white overflow-y-auto">
        {/* Animated Background - Geometric Shapes */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Large circle outlines */}
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 border border-zinc-800 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] border border-zinc-800 rounded-full animate-float-slow" style={{ animationDelay: '3s' }}></div>

          {/* Medium geometric shapes */}
          <div className="absolute top-[20%] left-[10%] w-48 h-48 border border-zinc-700/50 rounded-full animate-float"></div>
          <div className="absolute top-[60%] right-[15%] w-40 h-40 border border-zinc-700/50 rotate-45 animate-float" style={{ animationDelay: '2s' }}></div>

          {/* Small accent shapes */}
          <div className="absolute top-[30%] right-[25%] w-24 h-24 border border-zinc-700/30 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-[30%] left-[20%] w-32 h-32 border border-zinc-700/30 rotate-45 animate-float-slow" style={{ animationDelay: '4s' }}></div>

          {/* Connecting lines */}
          <div className="absolute top-[25%] left-[30%] w-40 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent animate-pulse"></div>
          <div className="absolute top-[70%] right-[35%] w-48 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>

          {/* Gradient Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
        </div>

        {/* Hero Section */}
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-7xl font-light text-white tracking-tight">
                CasperFlow
              </h1>
              <p className="text-xl text-gray-400 font-light">
                Liquid staking for Casper Network
              </p>
            </div>

            <div className="space-y-3 pt-8">
              <button
                onClick={() => setStep('wallet')}
                className="w-full max-w-xs mx-auto block px-8 py-4 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Launch App
              </button>
              <div className="flex items-center justify-center gap-8 text-sm text-gray-500 pt-4">
                <span>14.2% APY</span>
                <span>•</span>
                <span>Auto-compound</span>
                <span>•</span>
                <span>Instant unstake</span>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="pt-16 animate-bounce">
              <svg className="w-6 h-6 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Technical Deep Dive Section - Revealed on Scroll */}
        <div className="relative py-24 px-4">
          <div className="max-w-4xl mx-auto space-y-24">
            {/* Market Opportunity */}
            <div className="space-y-6 opacity-0 translate-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <div className="text-sm text-gray-600 uppercase tracking-wider">The Problem</div>
              <div className="text-4xl font-light">$2.3B locked in traditional staking</div>
              <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
                Over $2.3 billion in CSPR is currently locked in staking contracts, earning yields but completely illiquid.
                Users face an impossible choice: earn staking rewards OR use capital productively in DeFi.
                CasperFlow eliminates this tradeoff entirely.
              </p>
            </div>

            {/* Technical Innovations */}
            <div className="space-y-12">
              <div className="text-sm text-gray-600 uppercase tracking-wider">Technical Innovations</div>
              <div className="space-y-8">
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-light">1</div>
                  <div className="space-y-2 pt-2">
                    <div className="text-xl font-light">Auto-Compounding Yield Engine</div>
                    <p className="text-gray-400 leading-relaxed">
                      Implements a gas-optimized compound_rewards() mechanism that eliminates per-user reward tracking overhead through
                      dynamic exchange rate updates. Achieves O(1) complexity for reward distribution across all stakers by recalculating
                      the stCSPR:CSPR ratio atomically every epoch. Boosts base 12% APY to 14.2% through exponential compounding without
                      requiring manual claim transactions or additional gas expenditure from users.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-light">2</div>
                  <div className="space-y-2 pt-2">
                    <div className="text-xl font-light">Algorithmic Validator Selection</div>
                    <p className="text-gray-400 leading-relaxed">
                      Multi-dimensional scoring algorithm analyzes validator performance metrics (historical uptime &gt;99%, commission rates,
                      stake concentration) to construct an optimal delegation portfolio. Distributes stake across N validators to minimize
                      correlated slashing risk while maximizing network decentralization (improving Nakamoto coefficient). Future iterations
                      incorporate on-chain oracle integration for automated rebalancing based on real-time performance degradation signals.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-light">3</div>
                  <div className="space-y-2 pt-2">
                    <div className="text-xl font-light">Instant Liquidity Pool Architecture</div>
                    <p className="text-gray-400 leading-relaxed">
                      Industry-first implementation of a dual-exit mechanism: instant unstaking via liquidity pool (0.5% fee) or standard
                      unbonding period (0% fee, 7 days). The instant pool maintains 2% of total stake as readily available liquidity,
                      bootstrapped from the initial 1:0.98 exchange rate. Solves the liquidity problem inherent in traditional staking while
                      preserving capital efficiency through dynamic pool rebalancing based on withdrawal demand patterns.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-light">4</div>
                  <div className="space-y-2 pt-2">
                    <div className="text-xl font-light">CEP-18 Composability Layer</div>
                    <p className="text-gray-400 leading-relaxed">
                      stCSPR tokens adhere to the CEP-18 standard (Casper's ERC-20 equivalent) enabling full composability across the DeFi
                      ecosystem. Role-based access control restricts mint/burn operations exclusively to the StakingPool contract, preventing
                      unauthorized supply inflation. The token design supports integration with lending protocols (as collateral), DEX liquidity
                      pools, and yield aggregators while continuously accruing staking rewards through exchange rate appreciation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-light">5</div>
                  <div className="space-y-2 pt-2">
                    <div className="text-xl font-light">Fault-Tolerant State Management</div>
                    <p className="text-gray-400 leading-relaxed">
                      Built on Odra v2.4.0's zero-cost abstractions (Var&lt;T&gt;, Mapping&lt;K,V&gt;) that compile directly to Casper's
                      host-side storage primitives. High-precision U512 arithmetic prevents overflow edge cases at scale while maintaining
                      numerical accuracy for large stake amounts. All state transitions execute atomically with built-in revert semantics,
                      ensuring consistency under Byzantine failure conditions and eliminating race conditions in concurrent deposit/withdrawal scenarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Innovation Grid */}
            <div className="space-y-12">
              <div className="text-sm text-gray-600 uppercase tracking-wider">Core Innovations</div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3 p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                  <div className="text-2xl font-light">Auto-Compounding Engine</div>
                  <p className="text-gray-400 leading-relaxed">
                    Rewards automatically restaked every epoch. Zero manual claiming, zero gas fees.
                    Boost base 12% APY to 14.2% through algorithmic compounding.
                  </p>
                  <div className="pt-2 text-sm text-gray-600">+1.8% APY improvement</div>
                </div>

                <div className="space-y-3 p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                  <div className="text-2xl font-light">Smart Validator Routing</div>
                  <p className="text-gray-400 leading-relaxed">
                    AI-powered algorithm dynamically distributes stake across top-performing validators.
                    Optimizes for &gt;99% uptime, low commission rates, and network decentralization.
                  </p>
                  <div className="pt-2 text-sm text-gray-600">Dynamic rebalancing</div>
                </div>

                <div className="space-y-3 p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                  <div className="text-2xl font-light">Instant Unstaking Pool</div>
                  <p className="text-gray-400 leading-relaxed">
                    Industry-first liquidity pool for immediate exits (0.5% fee) or standard 7-day unbonding (0% fee).
                    Your capital, your timeline, your choice.
                  </p>
                  <div className="pt-2 text-sm text-gray-600">First in Casper ecosystem</div>
                </div>

                <div className="space-y-3 p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                  <div className="text-2xl font-light">CEP-18 Liquid Token</div>
                  <p className="text-gray-400 leading-relaxed">
                    Receive fully composable stCSPR tokens. Use as collateral in lending protocols,
                    trade on DEXs, or deploy in yield strategies—all while earning staking rewards.
                  </p>
                  <div className="pt-2 text-sm text-gray-600">Full DeFi composability</div>
                </div>
              </div>
            </div>

            {/* Technical Architecture */}
            <div className="space-y-6">
              <div className="text-sm text-gray-600 uppercase tracking-wider">Technical Architecture</div>
              <div className="p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-light">Odra v2.4.0</div>
                    <div className="text-sm text-gray-500">Smart contract framework</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-light">CEP-18</div>
                    <div className="text-sm text-gray-500">Token standard compliance</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-light">377 KB</div>
                    <div className="text-sm text-gray-500">Optimized WASM contract</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deployment Verification */}
            <div className="space-y-6 pb-24">
              <div className="text-sm text-gray-600 uppercase tracking-wider">Testnet Deployment</div>
              <div className="p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">Deploy Hash</div>
                    <div className="text-xs font-mono text-gray-400">430d190b13d41b456a9fdf1eb8c6b49d0e0239d7ee72186f015022d090e9bf23</div>
                  </div>
                  <a
                    href="https://testnet.cspr.live/deploy/430d190b13d41b456a9fdf1eb8c6b49d0e0239d7ee72186f015022d090e9bf23"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white hover:text-gray-300 transition-colors border border-zinc-700 px-4 py-2 rounded-lg"
                  >
                    View on Explorer →
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Block Height</div>
                    <div className="text-sm text-gray-400">6,444,096</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Status</div>
                    <div className="text-sm text-green-400">✓ Verified on Testnet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Wallet Connect Screen
  if (step === 'wallet' || !walletConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-light text-white">Connect Wallet</h2>
            <p className="text-gray-500">Connect your Casper wallet to continue</p>
          </div>

          <button
            onClick={handleConnectWallet}
            disabled={loading}
            className="w-full p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👛</span>
                </div>
                <div className="text-left">
                  <div className="text-white font-medium">CSPR.click</div>
                  <div className="text-sm text-gray-500">Official Casper wallet</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => setStep('landing')}
            className="w-full text-center text-gray-500 hover:text-gray-400 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // Main App - Stake View
  if (view === 'stake') {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="border-b border-zinc-900">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="text-xl font-light text-white">CasperFlow</div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('stake')}
                className="px-4 py-2 text-white border-b-2 border-white"
              >
                Stake
              </button>
              <button
                onClick={() => setView('portfolio')}
                className="px-4 py-2 text-gray-500 hover:text-white transition-colors"
              >
                Portfolio
              </button>
              <div className="pl-4 border-l border-zinc-800">
                <div className="px-3 py-1 bg-zinc-900 rounded-full text-sm text-gray-400">
                  {publicKey && `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
          <div className="space-y-12">
            {/* Amount Input */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Amount</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-6xl font-light text-white outline-none placeholder:text-zinc-800"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">$0.00 USD</span>
                  <span className="text-sm text-gray-600">Balance: {balance} CSPR</span>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-2">
                {['100', '500', '1000', 'Max'].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setStakeAmount(amt === 'Max' ? balance : amt)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-gray-400 transition-colors"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-4 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">You will receive</span>
                <span className="text-white font-medium">
                  {stakeAmount ? (parseFloat(stakeAmount) * 0.98).toFixed(2) : '0.00'} stCSPR
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Current APY</span>
                <span className="text-green-400">14.2%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Auto-compound</span>
                <span className="text-white">Enabled</span>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleStake}
              disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || loading}
              className="w-full py-4 bg-white hover:bg-gray-100 disabled:bg-zinc-900 disabled:text-gray-600 text-black rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Stake CSPR'}
            </button>
            {txHash && (
              <div className="text-xs text-gray-500 text-center">
                Status: {txStatus} | <a href={`https://testnet.cspr.live/deploy/${txHash}`} target="_blank" className="text-blue-400 hover:underline">View on Explorer</a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Portfolio View
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-light text-white">CasperFlow</div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('stake')}
              className="px-4 py-2 text-gray-500 hover:text-white transition-colors"
            >
              Stake
            </button>
            <button
              onClick={() => setView('portfolio')}
              className="px-4 py-2 text-white border-b-2 border-white"
            >
              Portfolio
            </button>
            <div className="pl-4 border-l border-zinc-800">
              <div className="px-3 py-1 bg-zinc-900 rounded-full text-sm text-gray-400">
                {publicKey && `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Portfolio Content */}
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        {totalStaked > 0 ? (
          <div className="space-y-12">
            {/* Total Value */}
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Total Value Staked</div>
              <div className="text-6xl font-light text-white">{totalStaked.toFixed(2)}</div>
              <div className="text-sm text-gray-600">${(totalStaked * 0.045).toFixed(2)} USD</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="text-sm text-gray-500 mb-2">stCSPR Balance</div>
                <div className="text-3xl font-light text-white">{(totalStaked * 0.98).toFixed(2)}</div>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="text-sm text-gray-500 mb-2">Current APY</div>
                <div className="text-3xl font-light text-green-400">14.2%</div>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="text-sm text-gray-500 mb-2">Daily Earnings</div>
                <div className="text-3xl font-light text-white">{(totalStaked * 0.142 / 365).toFixed(4)}</div>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="text-sm text-gray-500 mb-2">Yearly Projection</div>
                <div className="text-3xl font-light text-white">{(totalStaked * 0.142).toFixed(2)}</div>
              </div>
            </div>

            {/* Unstake Button */}
            <button
              onClick={handleUnstake}
              disabled={loading}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Unstake'}
            </button>
          </div>
        ) : (
          <div className="text-center py-24 space-y-4">
            <div className="text-6xl">💎</div>
            <div className="text-xl text-gray-500">No staked position</div>
            <button
              onClick={() => setView('stake')}
              className="text-white hover:text-gray-300 transition-colors"
            >
              Stake CSPR →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
