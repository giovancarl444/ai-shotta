import { useEffect, useState } from 'react';

interface Snipe {
  token: string;
  address: string;
  aiScore: number;
  roi?: number;
  status: string;
  detectedAt: string;
  autoBuy?: boolean;
  reason?: string;
}

export default function SnipesPage() {
  const [snipes, setSnipes] = useState<Snipe[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'sniped' | 'autoBuy' | 'skipped'>('all');

  useEffect(() => {
    fetch('/api/getSnipes')
      .then(res => res.json())
      .then(data => setSnipes(data));
  }, []);

  const filtered = snipes.filter(s => {
    if (activeTab === 'all') return true;
    if (activeTab === 'sniped') return s.status === 'sniped';
    if (activeTab === 'skipped') return s.status === 'skipped';
    if (activeTab === 'autoBuy') return s.autoBuy === true;
    return true;
  });

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎯 AI Shotta — Snipes Dashboard</h1>

      <div className="mb-4 space-x-3">
        {['all', 'sniped', 'autoBuy', 'skipped'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {tab === 'all' && '🧠 All'}
            {tab === 'sniped' && '💥 Sniped'}
            {tab === 'autoBuy' && '💣 AutoBuy'}
            {tab === 'skipped' && '⛔ Skipped'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg shadow border border-zinc-700">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-300 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 text-left">Token</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">AI Score</th>
              <th className="px-4 py-2 text-left">ROI %</th>
              <th className="px-4 py-2 text-left">Reason</th>
              <th className="px-4 py-2 text-left">Detected</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((snipe, i) => (
              <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-900">
                <td className="px-4 py-2 font-medium">{snipe.token}</td>
                <td className="px-4 py-2 capitalize text-zinc-400">{snipe.status}</td>
                <td className="px-4 py-2 text-yellow-300">{snipe.aiScore}</td>
                <td className={`px-4 py-2 ${snipe.roi && snipe.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {snipe.roi !== undefined ? `${snipe.roi.toFixed(2)}%` : '-'}
                </td>
                <td className="px-4 py-2 text-zinc-400">{snipe.reason || 'N/A'}</td>
                <td className="px-4 py-2 text-zinc-500 text-xs">{new Date(snipe.detectedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
