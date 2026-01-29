
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import * as UserActions from '@/actions/users';
import * as LeadActions from '@/actions/leads';

export type AppUser = {
  id: string;
  username: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Sub Admin' | 'Executive';
  password?: string; 
  phoneNumber?: string;
};

type AppContextType = {
  isAuthenticated: boolean;
  user: AppUser | null;
  originalUser: AppUser | null;
  isImpersonating: boolean;
  isLoading: boolean;
  isReadOnly: boolean;
  users: AppUser[];
  leads: LeadFormData[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonate: (userToImpersonate: AppUser) => void;
  stopImpersonation: () => void;
  addUser: (user: Omit<AppUser, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<AppUser, 'id'>>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addLeads: (newLeads: LeadFormData[]) => Promise<void>;
  updateLead: (id: string, updates: Partial<LeadFormData>) => Promise<void>;
  getNextLeadId: () => Promise<string>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [originalUser, setOriginalUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [leads, setLeads] = useState<LeadFormData[]>([]);
  const router = useRouter();

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionUserJson = sessionStorage.getItem('user');
      const sessionOriginalUserJson = sessionStorage.getItem('originalUser');
      
      const [fetchedUsers, fetchedLeads] = await Promise.all([
        UserActions.getUsers(),
        LeadActions.getLeads(),
      ]);

      setUsers(fetchedUsers);
      setLeads(fetchedLeads);

      if (sessionUserJson) {
        setUser(JSON.parse(sessionUserJson));
      }
      if (sessionOriginalUserJson) {
        setOriginalUser(JSON.parse(sessionOriginalUserJson));
      }
      
    } catch (error) {
      console.error("Failed to load initial data:", error);
      // Here you might want to set an error state to show a message to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  const login = async (email: string, password: string) => {
    const foundUser = await UserActions.loginUser(email, password);
    if (foundUser) {
      setUser(foundUser);
      setOriginalUser(foundUser);
      sessionStorage.setItem('user', JSON.stringify(foundUser));
      sessionStorage.setItem('originalUser', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid email or password.');
    }
  };

  const logout = async () => {
    setUser(null);
    setOriginalUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('originalUser');
    router.push('/login');
  };

  const impersonate = (userToImpersonate: AppUser) => {
    if (originalUser && ['Admin', 'Sub Admin', 'Super Admin'].includes(originalUser.role)) {
      setUser(userToImpersonate);
      sessionStorage.setItem('user', JSON.stringify(userToImpersonate));
      router.push('/dashboard');
    }
  };

  const stopImpersonation = () => {
    setUser(originalUser);
    sessionStorage.setItem('user', JSON.stringify(originalUser));
    router.push('/users');
  };

  const addUser = async (userData: Omit<AppUser, 'id'>) => {
    const newUser = await UserActions.addUser(userData);
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = async (id: string, updates: Partial<Omit<AppUser, 'id'>>) => {
    const updatedUser = await UserActions.updateUser(id, updates);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedUser } : u));
    
    if (user?.id === id) {
      const newCurrentUser = { ...user, ...updatedUser };
      setUser(newCurrentUser);
      sessionStorage.setItem('user', JSON.stringify(newCurrentUser));
    }
    if (originalUser?.id === id) {
        const newOriginalUser = { ...originalUser, ...updatedUser };
        setOriginalUser(newOriginalUser);
        sessionStorage.setItem('originalUser', JSON.stringify(newOriginalUser));
    }
  };

  const deleteUser = async (id: string) => {
    await UserActions.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };
  
  const addLeads = async (newLeads: LeadFormData[]) => {
    const addedLeads = await LeadActions.addLeads(newLeads);
    setLeads(prev => [...prev, ...addedLeads]);
  };
  
  const updateLead = async (id: string, updates: Partial<LeadFormData>) => {
    const updatedLead = await LeadActions.updateLead(id, updates);
    setLeads(prev => prev.map(l => l.leadId === id ? updatedLead : l));
  };

  const isImpersonating = !!(originalUser && user && originalUser.id !== user.id);
  const isReadOnly = isImpersonating;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        originalUser,
        isImpersonating,
        isLoading,
        isReadOnly,
        users,
        leads,
        login,
        logout,
        impersonate,
        stopImpersonation,
        addUser,
        updateUser,
        deleteUser,
        addLeads,
        updateLead,
        getNextLeadId: LeadActions.getNextLeadId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
