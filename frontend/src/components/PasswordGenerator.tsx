import { useState } from 'react';
import { fetchApi } from '../lib/api';

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void;
}

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    special_characters: true,
  });

  const generate = async () => {
    try {
      const data = await fetchApi('/generate-password', {
        method: 'POST',
        body: JSON.stringify({ length, ...options }),
      });
      onGenerate(data.password);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheck = (name: string) => {
    setOptions(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-4 font-display">Algorithmic Generation</span>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input 
            type="number" 
            value={length} 
            onChange={(e) => setLength(Number(e.target.value))} 
            className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-white text-sm focus:outline-none focus:border-white font-mono"
            min={8} max={64}
          />
        </div>
        <button type="button" onClick={generate} className="px-4 py-2 border border-white/20 hover:border-white text-[10px] uppercase tracking-widest transition-colors font-display">
          Generate
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 font-display text-xs">
        {[
          { id: 'uppercase', label: 'A-Z' },
          { id: 'lowercase', label: 'a-z' },
          { id: 'numbers', label: '0-9' },
          { id: 'special_characters', label: '!@#' },
        ].map(opt => (
          <label key={opt.id} className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-3 h-3 border transition-colors ${options[opt.id as keyof typeof options] ? 'bg-white border-white' : 'border-white/30 group-hover:border-white/60'}`} />
            <input 
              type="checkbox" 
              className="hidden"
              checked={options[opt.id as keyof typeof options]}
              onChange={() => handleCheck(opt.id)}
            />
            <span className="text-white/60 group-hover:text-white transition-colors">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
