import React from 'react';

interface Token {
  token: string;
  address: string;
  aiScore?: number;
  simulatedProfit?: number;
  status: string;
  reason?: string;
  detectedAt?: string;
}

interface DashboardProps {
  activeTab: 'evaluated' | 'inprogress' | 'completed';
  tokens: Token[];
}

export default function Dashboard({ activeTab, tokens }: DashboardProps) {
  const filtered = tokens.filter(token => {
    const status = token.status?.toLowerCase() || 'unknown';
  
    if (activeTab === 'evaluated') return token.aiScore !== undefined;
    if (activeTab === 'inprogress') return status === 'sniping' || status === 'pending';
    if (activeTab === 'completed') return status === 'sniped' || status === 'skipped';
  
    return false;
  });
  

  if (filtered.length === 0) {
    return <p className="text-zinc-400">No tokens found for this tab.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filtered.map((token, i) => (
        <div key={i} className="bg-zinc-900 p-4 rounded-xl shadow">
          <div className="text-lg font-semibold">{token.token}</div>
          <div className="text-sm text-zinc-400 break-words">{token.address}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {token.aiScore !== undefined && (
              <span className="inline-block bg-purple-800 text-sm px-2 py-1 rounded">
                AI Score: {token.aiScore}
              </span>
            )}
            {token.simulatedProfit !== undefined && (
              <span
                className={`inline-block text-sm px-2 py-1 rounded ${
                  token.simulatedProfit > 0 ? 'bg-green-800' : 'bg-red-800'
                }`}
              >
                ROI: {token.simulatedProfit.toFixed(2)}%
              </span>
            )}
            <span className="inline-block bg-blue-800 text-sm px-2 py-1 rounded">
              Status: {token.status}
            </span>
          </div>
          {token.reason && (
            <div className="mt-1 text-sm text-zinc-400 italic">{token.reason}</div>
          )}
          {token.detectedAt && (
            <div className="mt-1 text-xs text-zinc-500">
              Detected: {new Date(token.detectedAt).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
