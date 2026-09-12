import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Users, Folder, Briefcase, Activity, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export function Layout() {
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/', label: 'Vault', icon: Key, roles: ['admin', 'team_member', 'client'] },
    { path: '/categories', label: 'Categories', icon: Folder, roles: ['admin', 'team_member'] },
    { path: '/clients', label: 'Clients', icon: Briefcase, roles: ['admin', 'team_member'] },
    { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
    { path: '/logs', label: 'Activity Logs', icon: Activity, roles: ['admin'] },
  ].filter(item => !user || item.roles.includes(user.role_name));

  return (
    <div className="min-h-screen text-[#f4f3ef] font-sans selection:bg-white/20 flex relative z-0">
      
      {/* Sidebar Navigation */}
      <motion.nav 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-screen sticky top-0 shrink-0 z-50"
      >
        <div className="p-8 pb-12">
          <a href="/" className="text-2xl font-serif tracking-wide text-white no-underline flex items-center gap-3 text-glow">
            <Shield size={24} /> VaultGuru<span className="text-white/40">.</span>
          </a>
        </div>

        <div className="flex flex-col gap-2 px-4 flex-1">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-lg font-display uppercase tracking-widest text-[10px] transition-all duration-300 ${
                  isActive ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-transparent border-none font-display uppercase tracking-widest text-[10px] text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={16} /> Sever Link
          </button>
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden relative z-0 p-12 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
