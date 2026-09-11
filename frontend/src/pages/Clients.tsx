import React, { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadData = () => {
    fetchApi('/clients')
      .then(data => setClients(data || []))
      .catch(console.error);
  };

  useEffect(() => loadData(), []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await fetchApi('/clients', {
        method: 'POST',
        body: JSON.stringify({ name: newClientName, description: newClientDesc || undefined })
      });
      setOpenAdd(false);
      setNewClientName('');
      setNewClientDesc('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Permanently erase this client entity?')) {
      try {
        await fetchApi(`/clients/${id}`, { method: 'DELETE' });
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete client');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-12 border-b border-white/10 pb-6 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <Briefcase size={32} className="text-white/50" />
          <div>
            <span className="text-white/50 tracking-[0.2em] text-[10px] uppercase font-display block">External Entities</span>
            <h2 className="text-4xl font-serif">Client Portfolio</h2>
          </div>
        </div>
        <button 
          onClick={() => { setError(''); setOpenAdd(true); }}
          className="border border-white/30 hover:border-white px-6 py-3 rounded-full text-xs font-display uppercase tracking-widest transition-all hover:bg-white hover:text-black flex items-center gap-2 cursor-pointer bg-transparent text-white"
        >
          <Plus size={14} /> New Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 && <p className="text-white/40 italic font-serif col-span-full">No external entities tracked.</p>}
        {clients.map((client: any, i) => (
          <motion.div 
            onClick={() => navigate(`/clients/${client.id}`)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={client.id} 
            className="group p-8 border border-white/10 bg-black/40 backdrop-blur-md hover:border-white/30 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-white/30 font-display text-[10px] uppercase tracking-widest block">Entity ID: {client.id.substring(0,8)}</span>
              <button onClick={(e) => handleDelete(e, client.id)} className="text-white/20 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="font-serif text-3xl">{client.name}</h3>
            {client.description && <p className="text-white/50 font-display text-xs mt-2">{client.description}</p>}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {openAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-8 relative"
            >
              <button onClick={() => setOpenAdd(false)} className="absolute top-6 right-6 text-white/40 hover:text-white cursor-pointer bg-transparent border-none">×</button>
              <h2 className="font-serif text-2xl border-b border-white/10 pb-4 mb-6">Initialize Client</h2>
              {error && <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-display">{error}</div>}
              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Client Name</label>
                  <input required value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm" placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Description</label>
                  <input value={newClientDesc} onChange={e => setNewClientDesc(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm" placeholder="Optional context" />
                </div>
                <button type="submit" className="w-full py-4 border border-white/30 hover:bg-white hover:text-black transition-colors font-display uppercase tracking-widest text-xs mt-8 bg-transparent cursor-pointer text-white">
                  Persist Client
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
