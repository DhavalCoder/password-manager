import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { PasswordGenerator } from './PasswordGenerator';
import { Eye, EyeOff } from 'lucide-react';

export function CredentialForm({ onSuccess, credential }: { onSuccess: () => void, credential?: any }) {
  const [title, setTitle] = useState(credential?.title || '');
  const [clientId, setClientId] = useState(credential?.client_id || '');
  const [categoryId, setCategoryId] = useState(credential?.category_id || '');
  const [type, setType] = useState(credential?.credential_type || 'standard');
  const [tags, setTags] = useState(credential?.tags || '');
  
  // Data fields
  const [username, setUsername] = useState(credential?.data?.username || '');
  const [password, setPassword] = useState(credential?.data?.password || '');
  const [url, setUrl] = useState(credential?.data?.url || '');
  const [notes, setNotes] = useState(credential?.data?.notes || '');
  
  // API specific
  const [apiKey, setApiKey] = useState(credential?.data?.api_key || '');
  const [secretKey, setSecretKey] = useState(credential?.data?.secret_key || '');
  const [env, setEnv] = useState(credential?.data?.environment || 'Production');
  
  const [clients, setClients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchApi('/clients').then(setClients).catch(console.error);
    fetchApi('/categories').then(setCategories).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let dataPayload: any = { url, notes };
    if (type === 'standard') {
      dataPayload = { ...dataPayload, username, password };
    } else {
      dataPayload = { ...dataPayload, api_key: apiKey, secret_key: secretKey, environment: env };
    }

    const payload = {
      title,
      client_id: clientId || null,
      category_id: categoryId || null,
      credential_type: type,
      tags,
      data: dataPayload
    };

    try {
      if (credential) {
        await fetchApi(`/credentials/${credential.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/credentials', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inputClass = "w-full bg-transparent border-b border-white/20 px-0 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors font-display text-sm";
  const labelClass = "text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display";
  const selectClass = "w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm cursor-pointer [&>option]:bg-[#111] [&>option]:text-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
      {error && (
        <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-display">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Entity Title</label>
          <input required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="e.g. AWS Production" />
        </div>
        <div>
          <label className={labelClass}>Entity Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className={selectClass}>
            <option value="standard">Standard Login</option>
            <option value="api">API Credential</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Client Assignment</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className={selectClass}>
            <option value="">(Company Internal)</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Taxonomy / Category</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={selectClass}>
            <option value="">(Uncategorized)</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {type === 'standard' ? (
        <>
          <div>
            <label className={labelClass}>Identity / Username</label>
            <input required value={username} onChange={e => setUsername(e.target.value)} className={inputClass} placeholder="admin@domain.com" />
          </div>
          <div className="relative">
            <label className={labelClass}>Passphrase</label>
            <input required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 bottom-3 text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <PasswordGenerator onGenerate={(pwd) => { setPassword(pwd); setShowPassword(true); }} />
        </>
      ) : (
        <>
          <div>
            <label className={labelClass}>Environment</label>
            <input value={env} onChange={e => setEnv(e.target.value)} className={inputClass} placeholder="e.g. Production / Staging" />
          </div>
          <div>
            <label className={labelClass}>API Key / Client ID</label>
            <input required value={apiKey} onChange={e => setApiKey(e.target.value)} className={inputClass} placeholder="AKIA..." />
          </div>
          <div className="relative">
            <label className={labelClass}>Secret Key / Access Token</label>
            <input required type={showPassword ? 'text' : 'password'} value={secretKey} onChange={e => setSecretKey(e.target.value)} className={inputClass} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 bottom-3 text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </>
      )}

      <div>
        <label className={labelClass}>Access URL</label>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} className={inputClass} placeholder="https://..." />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Tags (comma separated)</label>
          <input value={tags} onChange={e => setTags(e.target.value)} className={inputClass} placeholder="dev, ops, critical" />
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className={inputClass} placeholder="Additional context..." />
        </div>
      </div>

      <button type="submit" className="w-full py-4 border border-white/30 hover:bg-white hover:text-black transition-colors font-display uppercase tracking-widest text-xs mt-8 bg-transparent cursor-pointer text-white">
        {credential ? 'Commit Changes' : 'Persist Entity'}
      </button>
    </form>
  );
}
