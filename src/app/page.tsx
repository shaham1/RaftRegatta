'use client';

import { useEffect, useState, useCallback } from 'react';

type Bid = {
  id: number;
  amount: number;
  teamName: string;
  item: string;
  roundId: number;
  createdAt: string;
};

type RoundInfo = {
  round_id: string;
  status: string;
  start_time: string;
  active_category?: string; 
};

type HistoryItem = Bid & {
  round: {
    status: string;
  };
};

export default function AuctionDashboard() {
  const [currentRound, setCurrentRound] = useState<RoundInfo | null>(null);
  const [liveBids, setLiveBids] = useState<Bid[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing...');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const checkRoundStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/get-bids');
      if (res.ok) {
        const data = await res.json();
        setLiveBids(data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Live poll error", error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("History poll error", error);
    }
  }, []);

  const handleStartRound = async () => {
    setStatusMessage("Starting Round...");
    try {
      const res = await fetch('/api/admin/start-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetCategoryId ? { category_id: targetCategoryId } : {})
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatusMessage(`✅ Round ${data.round_id} Started!`);
        setCurrentRound({
          round_id: data.round_id,
          status: 'OPEN',
          start_time: new Date().toISOString(),
          active_category: data.active_category 
        });
        setLiveBids([]);
      } else {
        setStatusMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatusMessage("❌ Network Error");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkRoundStatus();
      fetchHistory();
    }, 2000);

    checkRoundStatus();
    fetchHistory();

    return () => clearInterval(interval);
  }, [checkRoundStatus, fetchHistory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-6">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 tracking-tight">
            RAFT REGATTA COMMAND
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className={`w-2 h-2 rounded-full ${currentRound?.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <p>System Status: {statusMessage}</p>
            <p>Last Sync: {lastUpdated}</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="mt-4 md:mt-0 bg-slate-900 p-4 rounded-lg border border-slate-800 flex gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category ID (Optional)</label>
            <input 
              type="number" 
              placeholder="Random"
              className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm w-24 focus:border-emerald-500 outline-none transition-colors"
              value={targetCategoryId}
              onChange={(e) => setTargetCategoryId(e.target.value)}
            />
          </div>
          <button 
            onClick={handleStartRound}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold transition-all shadow-lg hover:shadow-emerald-900/20 active:scale-95"
          >
            START ROUND
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COL: LIVE ROUND */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-emerald-500">●</span> Live Feed
            </h2>
            {currentRound && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Round #{currentRound.round_id}</p>
                {currentRound.active_category && (
                  <p className="text-xs text-emerald-400">Target: {currentRound.active_category}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
            {liveBids.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-slate-600 animate-spin"></div>
                <p>Waiting for bids...</p>
              </div>
            ) : (
              liveBids.map((bid) => (
                <div key={bid.id} className="bg-slate-950 p-4 rounded-lg border-l-4 border-emerald-500 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{bid.teamName}</h3>
                      <p className="text-sm text-slate-400">Prediction: <span className="text-emerald-300">{bid.item}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">${bid.amount.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Bid #{bid.id}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* RIGHT COL: HISTORY */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
            <h2 className="text-xl font-bold text-slate-300">📜 History Log</h2>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-500 sticky top-0">
                <tr>
                  <th className="p-4 font-normal">Round</th>
                  <th className="p-4 font-normal">Team</th>
                  <th className="p-4 font-normal">Item</th>
                  <th className="p-4 font-normal text-right">Bid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-slate-500">#{bid.roundId}</td>
                    <td className="p-4 font-medium text-white">{bid.teamName}</td>
                    <td className="p-4">{bid.item}</td>
                    <td className="p-4 text-right font-mono text-emerald-400">${bid.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <p className="p-8 text-center text-slate-600">No closed round history available.</p>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}