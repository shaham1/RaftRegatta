'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

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
  
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");
  const [statusMessage, setStatusMessage] = useState<string>('System Ready');

  const checkStatus = useCallback(async () => {
    try {
      const resBids = await fetch('/api/admin/get_bids');
      if (resBids.ok) {
        const data = await resBids.json();
        setLiveBids(data); 
      }

    } catch (error) {
      console.error("Poll error", error);
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
      const res = await fetch('/api/admin/start_round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) 
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatusMessage(`Round ${data.round_id} Started!`);
        setCurrentRound({
          round_id: data.round_id,
          status: 'OPEN',
          start_time: new Date().toISOString(),
          active_category: data.active_category
        });
        setLiveBids([]); 
      } else {
        setStatusMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatusMessage("Network Error");
    }
  };

  const handleCloseRound = async () => {
    setStatusMessage("Closing Round");
    try {
      const res = await fetch('/api/admin/close_round', { method: 'POST' });
      if (res.ok) {
        setStatusMessage("Round Closed.");
        if (currentRound) {
          setCurrentRound({ ...currentRound, status: 'CLOSED' });
        }
        setLiveBids([]); 
        fetchHistory(); 
      }
    } catch (error) {
      setStatusMessage("Network Error");
    }
  };

  const winnersHistory = useMemo(() => {
    const roundsMap: Record<number, HistoryItem> = {};
    
    history.forEach((bid) => {
      if (!roundsMap[bid.roundId] || bid.amount > roundsMap[bid.roundId].amount) {
        roundsMap[bid.roundId] = bid;
      }
    });

    return Object.values(roundsMap).sort((a, b) => b.roundId - a.roundId);
  }, [history]);

  useEffect(() => {
    if (currentRound?.status === 'OPEN') {
      const timer = setInterval(() => {
        const start = new Date(currentRound.start_time).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);
        
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        setElapsedTime(`${minutes}:${seconds}`);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsedTime("00:00");
    }
  }, [currentRound]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
      fetchHistory();
    }, 2000);
    return () => clearInterval(interval);
  }, [checkStatus, fetchHistory]);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono flex flex-col">
      
      {/* TOP BAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 tracking-tight">RAFT REGATTA COMMAND</h1>
          <p className="text-xs text-slate-500 mt-1">{statusMessage}</p>
        </div>
        
        {/* TIMER DISPLAY */}
        <div className="flex flex-col items-center justify-center bg-black/50 px-6 py-2 rounded-lg border border-slate-800">
           <span className="text-xs text-slate-500 uppercase tracking-widest">Round Timer</span>
           <span className={`text-3xl font-bold font-mono ${currentRound?.status === 'OPEN' ? 'text-white' : 'text-slate-600'}`}>
             {elapsedTime}
           </span>
        </div>
      </div>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROLS & LIVE FEED (Width: 8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* CONTROL PANEL */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold text-white mb-1">Round Control</h2>
                <p className="text-sm text-slate-400">
                  {currentRound?.status === 'OPEN' 
                    ? `Round #${currentRound.round_id} is LIVE` 
                    : "No active round"}
                </p>
             </div>
             <div className="flex gap-4">
                <button 
                  onClick={handleStartRound}
                  disabled={currentRound?.status === 'OPEN'}
                  className={`px-8 py-4 rounded font-bold text-lg shadow-lg transition-all active:scale-95 ${
                    currentRound?.status === 'OPEN' 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-900/20'
                  }`}
                >
                  START ROUND
                </button>
                <button 
                  onClick={handleCloseRound}
                  disabled={currentRound?.status !== 'OPEN'}
                  className={`px-8 py-4 rounded font-bold text-lg shadow-lg transition-all active:scale-95 ${
                    currentRound?.status !== 'OPEN' 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-red-900/20'
                  }`}
                >
                  CLOSE ROUND
                </button>
             </div>
          </div>

          {/* LIVE FEED */}
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${currentRound?.status === 'OPEN' ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`}></span>
                Incoming Bids
              </h2>
              {currentRound?.active_category && currentRound.status === 'OPEN' && (
                <span className="px-3 py-1 bg-emerald-900/30 border border-emerald-800 rounded text-emerald-400 text-xs">
                  Target: {currentRound.active_category}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {liveBids.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600">
                   {currentRound?.status === 'OPEN' 
                     ? <p className="animate-pulse">Waiting for bids...</p>
                     : <p>Feed offline. Start a round to see bids.</p>
                   }
                 </div>
               ) : (
                 liveBids.map((bid) => (
                   <div key={bid.id} className="bg-slate-950 p-4 rounded border-l-4 border-emerald-500 flex justify-between items-center animate-in slide-in-from-bottom-2 fade-in duration-300">
                      <div>
                        <p className="font-bold text-white text-lg">{bid.teamName}</p>
                        <p className="text-xs text-slate-400">Predicted: {bid.item}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">${bid.amount.toFixed(2)}</p>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WINNERS HISTORY (Width: 4/12) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-200">🏆 Winners Log</h2>
            <p className="text-xs text-slate-500">Highest bid per round</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-3 font-normal">Rnd</th>
                    <th className="p-3 font-normal">Winner</th>
                    <th className="p-3 font-normal text-right">Bid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {winnersHistory.map((bid) => (
                    <tr key={bid.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 text-slate-500">#{bid.roundId}</td>
                      <td className="p-3">
                        <div className="font-medium text-white">{bid.teamName}</div>
                        <div className="text-xs text-slate-500">{bid.item}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                        ${bid.amount.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                  {winnersHistory.length === 0 && (
                     <tr>
                       <td colSpan={3} className="p-8 text-center text-slate-600">No finished rounds.</td>
                     </tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>

      </main>
    </div>
  );
}
