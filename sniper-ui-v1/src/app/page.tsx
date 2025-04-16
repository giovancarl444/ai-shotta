'use client';

import { useEffect, useState } from 'react';
import TokenTable from '../components/TokenTable';
import { loadTrades, analyzeStats } from '../utils/csvParser';

export default function Home() {
  const [trades, setTrades] = useState<any[]>([]);
  const [stats, setStats] = useState<{ winRate: string; avgROI: string; totalTrades: number }>({
    winRate: '0.00',
    avgROI: '0.00',
    totalTrades: 0,
  });

  useEffect(() => {
    loadTrades().then((data) => {
      setTrades(data);
      setStats(analyzeStats(data));
    });
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-extrabold mb-6">🎯 SniperOps Dashboard</h1>

      <div className="bg-zinc-900 text-white p-4 rounded-xl mb-8 shadow-lg">
        <h2 className="text-xl font-bold mb-2">📊 Sniper Performance</h2>
        <p>💥 Total Trades: <span className="text-blue-400 font-bold">{stats.totalTrades}</span></p>
        <p>✅ Win Rate: <span className="text-green-400 font-bold">{stats.winRate}%</span></p>
        <p>📈 Avg ROI: <span className="text-yellow-300 font-bold">{stats.avgROI}%</span></p>
      </div>

      <TokenTable data={trades} />
    </main>
  );
}
