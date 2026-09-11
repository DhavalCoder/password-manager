import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchApi('/users/me')
        .then(data => {
          if (data && data.email) {
            // Fetch roles to map role_id to role_name
            fetchApi('/users/roles').then(roles => {
              const role = roles.find((r: any) => r.id === data.role_id);
              setUser({ ...data, role_name: role ? role.name : 'client' });
            });
          }
        })
        .catch(() => setToken(null));
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string) => setToken(newToken);
  const logout = () => { setToken(null); setUser(null); };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
