export default function Header({
  walletConnected,
  onConnect,
}: {
  walletConnected: boolean
  onConnect: () => void
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <span className="text-2xl font-bold text-white">CasperFlow</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Dashboard
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Validators
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Analytics
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Docs
          </a>
        </nav>

        <button
          onClick={onConnect}
          className={`px-6 py-3 rounded-full font-semibold transition-all ${
            walletConnected
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          }`}
        >
          {walletConnected ? '🟢 Connected' : 'Connect Wallet'}
        </button>
      </div>
    </header>
  )
}
