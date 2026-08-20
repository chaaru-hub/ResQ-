import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEFAULT_ADMIN_USER = {
  id: 'usr-admin-01',
  name: 'Chief Cmdr. Alex Vance',
  email: 'admin.resq@gov.emergency',
  role: 'admin',
  agency: 'National Disaster Management Authority (NDMA)',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
};

export const DEFAULT_COORDINATOR_USER = {
  id: 'usr-coord-02',
  name: 'Officer Priya Sharma',
  email: 'p.sharma@relief.gov.in',
  role: 'relief_coordinator',
  agency: 'State Relief Staging Wing',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('resq_user');
    return saved ? JSON.parse(saved) : DEFAULT_ADMIN_USER;
  });

  const login = (email, password, selectedRole = 'admin') => {
    const loggedUser = selectedRole === 'admin' 
      ? { ...DEFAULT_ADMIN_USER, email } 
      : { ...DEFAULT_COORDINATOR_USER, email };
    setUser(loggedUser);
    localStorage.setItem('resq_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('resq_user');
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updated = {
      ...user,
      role: newRole,
      name: newRole === 'admin' ? 'Chief Cmdr. Alex Vance' : 'Officer Priya Sharma'
    };
    setUser(updated);
    localStorage.setItem('resq_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
