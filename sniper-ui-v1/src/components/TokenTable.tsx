import React from 'react';

interface TokenData {
  Token: string;
  'AI Score': string;
  Profit: string;
  Reason?: string;
  Status?: string;
}

function getStatusBadge(status: string | undefined) {
  const base = 'px-2 py-1 rounded-full text-xs font-bold';
  switch (status?.toLowerCase()) {
    case 'sniped':
      return <span className={`${base} bg-green-800 text-green-300`}>🔥 Sniped</span>;
    case 'skipped':
      return <span className={`${base} bg-red-900 text-red-300`}>🚫 Skipped</span>;
    case 'pending':
      return <span className={`${base} bg-yellow-800 text-yellow-200`}>⏳ Pending</span>;
    default:
      return <span className={`${base} bg-gray-700 text-gray-300`}>❔ Unknown</span>;
  }
}

export default function TokenTable({ data }: { data: TokenData[] }) {
  return (
    <div className="bg-zinc-900 text-white rounded-xl p-4 shadow-xl">
      <h2 className="text-2xl font-bold mb-4">🧠 Evaluated Tokens</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left border-b border-gray-700">
            <th className="p-2">Token</th>
            <th className="p-2">Status</th>
            <th className="p-2">AI Score</th>
            <th className="p-2">Profit %</th>
            <th className="p-2">Reason</th>
          </tr>
        </thead>
        <tbody>
          {data.map((t, i) => (
            <tr key={i} className="border-t border-gray-800 hover:bg-zinc-800">
              <td className="p-2">{t.Token}</td>
              <td className="p-2">{getStatusBadge(t.Status)}</td>
              <td className="p-2 text-yellow-400 font-bold">{t['AI Score']}</td>
              <td className={`p-2 font-bold ${parseFloat(t.Profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {t.Profit}%
              </td>
              <td className="p-2 text-gray-300">{t.Reason || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
