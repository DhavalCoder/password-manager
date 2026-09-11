import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../lib/api';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
      });
      login(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Left Side - Editorial Art */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 border-r border-white/10">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1614064641913-a538a5b3a4a2?q=80&w=2000&auto=format&fit=crop" 
            alt="Abstract artistic representation of security"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050505]" />
        </div>
        
        <div className="z-10 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
            <span className="text-white/50 tracking-[0.2em] text-xs uppercase font-display">The Intelligence Era</span>
            <h1 className="text-6xl lg:text-8xl font-serif mt-6 leading-[0.9] text-glow">
              SECURITY <br />
              <i className="text-white/40 italic font-light">as digital</i> <br />
              ART.
            </h1>
          </motion.div>
        </div>
        
        <div className="z-10 relative mt-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}>
            <p className="max-w-md text-white/60 font-light leading-relaxed">
              An intelligent, encrypted ecosystem designed to decode your security needs, orchestrate your credentials, and elevate your peace of mind.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl font-serif mb-2">Initialize Portal</h2>
            <p className="text-white/40 font-display text-sm tracking-wide">ENTER YOUR CREDENTIALS</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
              <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm rounded">
                {error}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 ml-1 font-display">Identity / Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 px-1 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors"
                placeholder="architect@domain.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 ml-1 font-display">Passphrase</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 px-1 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors"
                placeholder="********"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-8 py-4 bg-white text-black border-none cursor-pointer font-display uppercase tracking-widest text-xs font-bold hover:bg-white/90 transition-all flex justify-center items-center gap-2 group"
            >
              {loading ? 'Authenticating...' : (
                <>
                  Awaken Agent
                  <Lock size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
