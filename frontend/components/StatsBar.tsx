export default function StatsBar() {
  const stats = [
    { label: 'Total Value Locked', value: '$12.4M', change: '+12.5%' },
    { label: 'stCSPR Supply', value: '8.2M', change: '+8.2%' },
    { label: 'APY (Auto-Compound)', value: '14.2%', change: '+1.2%' },
    { label: 'Active Validators', value: '42', change: '+3' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all"
        >
          <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
          <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-sm text-green-400">{stat.change}</div>
        </div>
      ))}
    </div>
  )
}
