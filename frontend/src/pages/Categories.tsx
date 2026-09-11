import React, { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadData = () => {
    fetchApi('/categories')
      .then(data => setCategories(data))
      .catch(console.error);
  };

  useEffect(() => loadData(), []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await fetchApi('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName, description: newCatDesc })
      });
      setOpenAdd(false);
      setNewCatName('');
      setNewCatDesc('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create taxonomy');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Permanently erase this taxonomy?')) {
      try {
        await fetchApi(`/categories/${id}`, { method: 'DELETE' });
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-12 border-b border-white/10 pb-6 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <Folder size={32} className="text-white/50" />
          <div>
            <span className="text-white/50 tracking-[0.2em] text-[10px] uppercase font-display block">System Taxonomies</span>
            <h2 className="text-4xl font-serif">Categories</h2>
          </div>
        </div>
        <button 
          onClick={() => { setError(''); setOpenAdd(true); }}
          className="border border-white/30 hover:border-white px-6 py-3 rounded-full text-xs font-display uppercase tracking-widest transition-all hover:bg-white hover:text-black flex items-center gap-2 cursor-pointer bg-transparent text-white"
        >
          <Plus size={14} /> New Taxonomy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat: any, i) => (
          <motion.div 
            onClick={() => navigate(`/categories/${encodeURIComponent(cat.name)}`)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={cat.id} 
            className="group p-8 border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/5 transition-colors relative overflow-hidden cursor-pointer"
          >
            <div className="flex justify-between items-start relative z-10">
              <h3 className="font-serif text-2xl">{cat.name}</h3>
              <button onClick={(e) => handleDelete(e, cat.id)} className="text-white/20 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
                <Trash2 size={16} />
              </button>
            </div>
            {cat.description && <p className="text-white/50 font-display text-xs mt-4 relative z-10">{cat.description}</p>}
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
              <h2 className="font-serif text-2xl border-b border-white/10 pb-4 mb-6">Initialize Taxonomy</h2>
              {error && <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-display">{error}</div>}
              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Taxonomy Name</label>
                  <input required value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm" placeholder="e.g. Website" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Description</label>
                  <input value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm" placeholder="Optional context" />
                </div>
                <button type="submit" className="w-full py-4 border border-white/30 hover:bg-white hover:text-black transition-colors font-display uppercase tracking-widest text-xs mt-8 bg-transparent cursor-pointer text-white">
                  Persist Taxonomy
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
