'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.refresh(); 
        router.push('/');
      } else {
        setError('ACCESS DENIED: INCORRECT CREDENTIALS');
      }
    } catch (err) {
      setError('SYSTEM ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 shadow-2xl p-8 relative overflow-hidden">
        
        {/* Red Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tighter flex items-center justify-center gap-3">
            <span className="text-red-600 text-4xl">⚠</span> RESTRICTED
          </h1>
          <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest">
            Authorized Personnel Only
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-red-600 uppercase mb-2">
              Security Clearance Code
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-700 focus:border-red-600 text-white px-4 py-3 outline-none transition-colors text-center text-lg tracking-widest placeholder-zinc-800"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 p-3 text-red-500 text-xs text-center font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 font-bold text-sm uppercase tracking-widest transition-all ${
              loading
                ? 'bg-zinc-800 text-zinc-500 cursor-wait'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]'
            }`}
          >
            {loading ? 'Authenticating...' : 'Access Command'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-zinc-700">
            SECURE CONNECTION ESTABLISHED v2.0
          </p>
        </div>
      </div>
    </div>
  );
}