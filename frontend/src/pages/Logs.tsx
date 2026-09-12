import { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/logs')
      .then(data => setLogs(data))
      .catch(console.error);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-12 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Activity size={32} className="text-white/50" />
          <div>
            <span className="text-white/50 tracking-[0.2em] text-[10px] uppercase font-display block">System Logs</span>
            <h2 className="text-4xl font-serif">Activity Logs</h2>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 p-8"
      >
        {logs.length === 0 ? (
          <p className="text-white/40 py-12 text-center italic font-serif text-2xl">Silence in the network.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log: any, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={i} 
                className="flex gap-6 border-b border-white/5 pb-4 items-start"
              >
                <div>
                  <span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Time</span>
                  <span className="text-white/60 truncate block">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <span className="text-white/80 font-serif text-lg">{log.action || log.message || JSON.stringify(log)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
