import React, { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Users as UsersIcon, Plus, Trash2, Share2, Key } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [shareUser, setShareUser] = useState<any>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [bulkShareCategory, setBulkShareCategory] = useState<string>('all');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [error, setError] = useState('');

  const loadData = () => {
    fetchApi('/users')
      .then(data => setUsers(data || []))
      .catch(console.error);
    fetchApi('/users/roles')
      .then(data => {
        setRoles(data || []);
        if (data && data.length > 0) setNewRoleId(data[0].id);
      })
      .catch(console.error);
    fetchApi('/categories')
      .then(data => setCategories(data || []))
      .catch(console.error);
  };

  useEffect(() => loadData(), []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, name: newName, password: newPassword, role_id: newRoleId })
      });
      setOpenAdd(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently erase this network operative?')) {
      try {
        await fetchApi(`/users/${id}`, { method: 'DELETE' });
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  const handleBulkShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareUser) return;
    setError('');
    try {
      const payload: any = {
        share_all: bulkShareCategory === 'all',
        access_level: 'view_only'
      };
      if (bulkShareCategory !== 'all') {
        payload.category_id = bulkShareCategory;
      }
      const res = await fetchApi(`/users/${shareUser.id}/bulk-share`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      alert(res.message || 'Shared successfully');
      setShareUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to share');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword) return;
    setError('');
    try {
      const res = await fetchApi(`/users/${resetPasswordUser.id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ new_password: newPassword })
      });
      alert(res.message || 'Password reset successfully');
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-12 border-b border-white/10 pb-6 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <UsersIcon size={32} className="text-white/50" />
          <div>
            <span className="text-white/50 tracking-[0.2em] text-[10px] uppercase font-display block">Network Operatives</span>
            <h2 className="text-4xl font-serif">System Users</h2>
          </div>
        </div>
        <button 
          onClick={() => setOpenAdd(true)}
          className="border border-white/30 hover:border-white px-6 py-3 rounded-full text-xs font-display uppercase tracking-widest transition-all hover:bg-white hover:text-black flex items-center gap-2 cursor-pointer bg-transparent text-white"
        >
          <Plus size={14} /> Add Operative
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.length === 0 && <p className="text-white/40 italic font-serif">Access restricted or network empty.</p>}
        {users.map((user: any, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={user.id} 
            className="flex items-center justify-between p-6 border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/5 transition-colors"
          >
            <div>
              <h3 className="font-serif text-2xl">{user.email}</h3>
              <span className="text-white/40 font-display text-xs tracking-widest uppercase mt-2 block">
                Role ID: {user.role_id}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 border border-emerald-500/30 text-emerald-400 font-display text-[10px] uppercase tracking-widest rounded-full">
                {user.is_active ? 'Active Node' : 'Suspended'}
              </div>
              <button onClick={() => setResetPasswordUser(user)} className="text-white/40 hover:text-amber-400 transition-colors bg-transparent border-none cursor-pointer" title="Reset Password">
                <Key size={16} />
              </button>
              <button onClick={() => setShareUser(user)} className="text-white/40 hover:text-indigo-400 transition-colors bg-transparent border-none cursor-pointer" title="Bulk Share Vaults">
                <Share2 size={16} />
              </button>
              <button onClick={() => handleDelete(user.id)} className="text-white/20 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {resetPasswordUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-8 relative"
            >
              <button onClick={() => { setResetPasswordUser(null); setNewPassword(''); }} className="absolute top-6 right-6 text-white/40 hover:text-white cursor-pointer bg-transparent border-none">×</button>
              <h2 className="font-serif text-2xl border-b border-white/10 pb-4 mb-6">Security Override</h2>
              {error && <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-display">{error}</div>}
              
              <p className="text-white/60 text-sm mb-6 font-display">
                Initialize new security passphrase for <strong>{resetPasswordUser.email}</strong>.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">New Passphrase</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-mono text-sm" placeholder="••••••••" />
                </div>
                
                <button type="submit" className="w-full py-4 border border-amber-500/50 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors font-display uppercase tracking-widest text-xs mt-8 bg-transparent cursor-pointer">
                  Execute Override
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {shareUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-8 relative"
            >
              <button onClick={() => setShareUser(null)} className="absolute top-6 right-6 text-white/40 hover:text-white cursor-pointer bg-transparent border-none">×</button>
              <h2 className="font-serif text-2xl border-b border-white/10 pb-4 mb-6">Bulk Distribution: {shareUser.email}</h2>
              {error && <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-display">{error}</div>}
              
              <p className="text-white/60 text-sm mb-6 font-display">
                Select a specific Taxonomy, or share your entire vault with this operative.
              </p>

              <form onSubmit={handleBulkShare} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Taxonomy to Share</label>
                  <select required value={bulkShareCategory} onChange={e => setBulkShareCategory(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm cursor-pointer [&>option]:bg-[#111] [&>option]:text-white">
                    <option value="all">EVERYTHING (FULL VAULT)</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                  </select>
                </div>
                
                <button type="submit" className="w-full py-4 border border-indigo-500/50 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors font-display uppercase tracking-widest text-xs mt-8 bg-transparent cursor-pointer">
                  Establish Streams
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {openAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-8 relative"
            >
              <button onClick={() => setOpenAdd(false)} className="absolute top-6 right-6 text-white/40 hover:text-white cursor-pointer bg-transparent border-none">×</button>
              <h2 className="font-serif text-2xl border-b border-white/10 pb-4 mb-6">Authorize Operative</h2>
              {error && <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-display">{error}</div>}
              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Operative Name</label>
                  <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Email Address</label>
                  <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm" placeholder="operative@network.com" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Secure Password</label>
                  <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm" placeholder="••••••••••••" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1 font-display">Assigned Clearance</label>
                  <select required value={newRoleId} onChange={e => setNewRoleId(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-display text-sm cursor-pointer [&>option]:bg-[#111] [&>option]:text-white">
                    {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-4 border border-white/30 hover:bg-white hover:text-black transition-colors font-display uppercase tracking-widest text-xs mt-8 bg-transparent cursor-pointer text-white">
                  Grant Access
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
