// pages/index.tsx
import { useEffect, useState } from 'react';

interface TokenEntry {
  address: string;
  token?: string;
  detectedAt: string;
  status: string;
  aiScore?: number;
  simulatedProfit?: number;
  // …other fields…
}

export default function Dashboard() {
  const [queue, setQueue] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQueue() {
      try {
        const res = await fetch('http://localhost:3000/api/queue');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: TokenEntry[] = await res.json();
        setQueue(data);
      } catch (err) {
        console.error('Failed to fetch queue:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQueue();
    // Poll every 5s
    const iv = setInterval(fetchQueue, 5000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;
  if (queue.length === 0) return <div className="p-4">No tokens in queue.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sniping Queue</h1>
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Address</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">AI Score</th>
            <th className="border px-2 py-1">Profit</th>
            <th className="border px-2 py-1">Detected At</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((t) => (
            <tr key={t.address}>
              <td className="border px-2 py-1 font-mono">{t.address}</td>
              <td className="border px-2 py-1">{t.status}</td>
              <td className="border px-2 py-1">{t.aiScore?.toFixed(3) ?? '–'}</td>
              <td className="border px-2 py-1">{t.simulatedProfit?.toFixed(3) ?? '–'}</td>
              <td className="border px-2 py-1">{new Date(t.detectedAt).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
