import { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'evaluated' | 'inprogress' | 'completed'>('evaluated');
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    fetch('/api/getQueue')  // ✅ loads snipingQueue.json
      .then(res => res.json())
      .then(data => {
        console.log('✅ Loaded queue data:', data);
        setTokens(data);
      });
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎯 SniperOps Dashboard</h1>

      <div className="flex space-x-4 mb-6">
        {(['evaluated', 'inprogress', 'completed'] as const).map(tab => (

          <button
            key={tab}
            className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-600' : 'bg-zinc-700'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'evaluated' && '🧠 Evaluated Tokens'}
            {tab === 'inprogress' && '🕵️ Snipes In Progress'}
            {tab === 'completed' && '✅ Completed Snipes'}
          </button>
        ))}
      </div>

      <Dashboard activeTab={activeTab} tokens={tokens} />
    </main>
  );
}
