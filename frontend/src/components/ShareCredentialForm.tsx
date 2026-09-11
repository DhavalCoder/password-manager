import React, { useState } from 'react';
import { fetchApi } from '../lib/api';

export function ShareCredentialForm({ credentialId, onSuccess }: { credentialId: string, onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('view_only');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/credentials/${credentialId}/share`, {
        method: 'POST',
        body: JSON.stringify({ email, access_level: accessLevel, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null })
      });
      setSuccess('Stream established.');
      setTimeout(onSuccess, 1500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inputClass = "w-full bg-transparent border-b border-white/20 px-0 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors font-display text-sm";
  const labelClass = "text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display";

  return (
    <form onSubmit={handleShare} className="space-y-6">
      {error && <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-display">{error}</div>}
      {success && <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-display">{success}</div>}
      
      <div>
        <label className={labelClass}>Target Identity</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="colleague@domain.com" />
      </div>
      
      <div>
        <label className={labelClass}>Privilege Level</label>
        <select 
          value={accessLevel} 
          onChange={e => setAccessLevel(e.target.value)}
          className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm cursor-pointer [&>option]:bg-[#111] [&>option]:text-white"
        >
          <option value="view_only">Read (View Only)</option>
          <option value="full_access">Write (Full Access)</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Expiration (Optional)</label>
        <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputClass + ' [color-scheme:dark]'} />
      </div>

      <button type="submit" className="w-full py-4 border border-white/30 hover:bg-white hover:text-black transition-colors font-display uppercase tracking-widest text-xs mt-8 bg-transparent cursor-pointer text-white">
        Establish Link
      </button>
    </form>
  );
}
