'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

// --- Types ---
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
  // --- State ---
  const [currentRound, setCurrentRound] = useState<RoundInfo | null>(null);
  const [liveBids, setLiveBids] = useState<Bid[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");
  const [statusMessage, setStatusMessage] = useState<string>('System Ready');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to Dark Mode

  // --- API Actions (Logic Unchanged) ---

  const checkStatus = useCallback(async () => {
    try {
      const resBids = await fetch('/api/admin/get-bids');
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
      const res = await fetch('/api/admin/start-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) 
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

  const handleCloseRound = async () => {
    setStatusMessage("Closing Round...");
    try {
      const res = await fetch('/api/admin/close-round', { method: 'POST' });
      if (res.ok) {
        setStatusMessage("🛑 Round Closed.");
        if (currentRound) {
          setCurrentRound({ ...currentRound, status: 'CLOSED' });
        }
        setLiveBids([]); 
        fetchHistory(); 
      }
    } catch (error) {
      setStatusMessage("❌ Network Error");
    }
  };

  // --- Helpers ---

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

  // --- THEME CLASSES ---
  const theme = {
    bg: isDarkMode ? 'bg-black' : 'bg-gray-100',
    cardBg: isDarkMode ? 'bg-zinc-900' : 'bg-white',
    border: isDarkMode ? 'border-zinc-800' : 'border-gray-300',
    text: isDarkMode ? 'text-gray-200' : 'text-gray-800',
    subText: isDarkMode ? 'text-gray-500' : 'text-gray-500',
    accent: 'text-red-600', // Our primary Red
    accentBg: 'bg-red-600',
    buttonPrimary: 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20',
    buttonDisabled: isDarkMode ? 'bg-zinc-800 text-zinc-600' : 'bg-gray-200 text-gray-400',
    tableHeader: isDarkMode ? 'bg-black text-gray-500' : 'bg-gray-50 text-gray-500',
    tableRowHover: isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50',
    highlightBorder: 'border-red-600'
  };

  // --- Render ---
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-mono flex flex-col transition-colors duration-300`}>
      
      {/* TOP BAR */}
      <div className={`${theme.cardBg} border-b ${theme.border} p-4 flex justify-between items-center shadow-md z-10 sticky top-0`}>
        <div>
          <h1 className={`text-2xl font-bold ${theme.accent} tracking-tighter flex items-center gap-3`}>
            <span className="text-3xl">☢</span> RAFT REGATTA COMMAND
          </h1>
          <p className={`text-xs ${theme.subText} mt-1 font-bold`}>STATUS: {statusMessage}</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* TIMER DISPLAY */}
          <div className={`flex flex-col items-center justify-center px-6 py-2 rounded border ${theme.border} ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
             <span className={`text-[10px] ${theme.subText} uppercase tracking-widest`}>Round Timer</span>
             <span className={`text-3xl font-bold font-mono ${currentRound?.status === 'OPEN' ? theme.accent : theme.subText}`}>
               {elapsedTime}
             </span>
          </div>

          {/* THEME TOGGLE */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full border ${theme.border} hover:scale-110 transition-transform`}
            title="Toggle Theme"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROLS & LIVE FEED (Width: 8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* CONTROL PANEL */}
          <div className={`${theme.cardBg} p-6 rounded-none border-l-4 ${theme.highlightBorder} border-y border-r ${theme.border} shadow-lg flex justify-between items-center`}>
             <div>
                <h2 className={`text-xl font-bold uppercase ${theme.text} mb-1`}>Round Control</h2>
                <p className={`text-sm ${theme.subText}`}>
                  {currentRound?.status === 'OPEN' 
                    ? `ROUND #${currentRound.round_id} IS ACTIVE` 
                    : "WAITING FOR COMMAND..."}
                </p>
             </div>
             <div className="flex gap-4">
                <button 
                  onClick={handleStartRound}
                  disabled={currentRound?.status === 'OPEN'}
                  className={`px-8 py-4 font-bold text-lg shadow-lg transition-all active:scale-95 rounded-sm ${
                    currentRound?.status === 'OPEN' 
                    ? theme.buttonDisabled 
                    : theme.buttonPrimary
                  }`}
                >
                  INITIATE ROUND
                </button>
                <button 
                  onClick={handleCloseRound}
                  disabled={currentRound?.status !== 'OPEN'}
                  className={`px-8 py-4 font-bold text-lg shadow-lg transition-all active:scale-95 rounded-sm ${
                    currentRound?.status !== 'OPEN' 
                    ? theme.buttonDisabled 
                    : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                  }`}
                >
                  TERMINATE ROUND
                </button>
             </div>
          </div>

          {/* LIVE FEED */}
          <div className={`flex-1 ${theme.cardBg} rounded-none border ${theme.border} flex flex-col overflow-hidden min-h-[400px]`}>
            <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}>
                <span className={`w-3 h-3 rounded-full ${currentRound?.status === 'OPEN' ? 'bg-red-600 animate-ping' : 'bg-gray-600'}`}></span>
                INCOMING DATA STREAM
              </h2>
              {currentRound?.active_category && currentRound.status === 'OPEN' && (
                <span className={`px-3 py-1 border ${theme.border} text-xs font-bold uppercase tracking-wide ${theme.accent}`}>
                  Target: {currentRound.active_category}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {liveBids.length === 0 ? (
                 <div className={`h-full flex flex-col items-center justify-center ${theme.subText} uppercase tracking-widest text-sm`}>
                   {currentRound?.status === 'OPEN' 
                     ? <p className="animate-pulse">Waiting for signals...</p>
                     : <p>Feed offline.</p>
                   }
                 </div>
               ) : (
                 liveBids.map((bid) => (
                   <div key={bid.id} className={`${isDarkMode ? 'bg-black' : 'bg-gray-50'} p-4 border-l-4 ${theme.highlightBorder} border-y border-r ${theme.border} flex justify-between items-center animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                      <div>
                        <p className={`font-bold ${theme.text} text-lg`}>{bid.teamName}</p>
                        <p className={`text-xs ${theme.subText}`}>Prediction: {bid.item}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${theme.accent}`}>${bid.amount.toFixed(2)}</p>
                        <p className={`text-[10px] ${theme.subText} uppercase`}>ID: {bid.id}</p>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WINNERS HISTORY (Width: 4/12) */}
        <div className={`lg:col-span-4 ${theme.cardBg} rounded-none border ${theme.border} flex flex-col overflow-hidden h-full`}>
          <div className={`p-4 border-b ${theme.border}`}>
            <h2 className={`text-lg font-bold ${theme.text}`}>🏆 HALL OF FAME</h2>
            <p className={`text-xs ${theme.subText}`}>Highest bid per round</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             <table className="w-full text-left text-sm">
                <thead className={`${theme.tableHeader} sticky top-0 uppercase text-xs tracking-wider`}>
                  <tr>
                    <th className="p-3 font-normal">Rnd</th>
                    <th className="p-3 font-normal">Winner</th>
                    <th className="p-3 font-normal text-right">Bid</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-gray-200'} ${theme.text}`}>
                  {winnersHistory.map((bid) => (
                    <tr key={bid.id} className={`${theme.tableRowHover} transition-colors`}>
                      <td className={`p-3 ${theme.subText}`}>#{bid.roundId}</td>
                      <td className="p-3">
                        <div className="font-bold">{bid.teamName}</div>
                        <div className={`text-[10px] ${theme.subText}`}>{bid.item}</div>
                      </td>
                      <td className={`p-3 text-right font-mono ${theme.accent} font-bold`}>
                        ${bid.amount.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                  {winnersHistory.length === 0 && (
                     <tr>
                       <td colSpan={3} className={`p-8 text-center ${theme.subText}`}>No history.</td>
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