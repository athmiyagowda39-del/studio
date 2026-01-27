
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadFormData } from '@/components/leads/lead-upload-form';

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
  updateUser: (id: string, updates: Partial<Omit<AppUser, 'id'>>) => void;
  deleteUser: (id: string) => Promise<void>;
  addLeads: (newLeads: LeadFormData[]) => void;
  updateLead: (id: string, updates: Partial<LeadFormData>) => void;
  getNextLeadId: () => string;
};

const defaultUsers: AppUser[] = [
  { id: 'user-1', username: 'Athmiya.ag', email: 'athmiya.ag@peopleworks.in', role: 'Admin', password: 'Welcome123#' },
  { id: 'user-3', username: 'Varghese Vincent', email: 'Varghese@peopleworks.in', role: 'Admin', password: 'Varghese@123', phoneNumber: 'N/A' },
  { id: 'user-4', username: 'sam.devasia', email: 'sam.devasia@peopleworks.in', role: 'Admin', password: 'SamDev@456', phoneNumber: 'N/A' },
  { id: 'user-6', username: 'Mandanna N', email: 'mandanna.n@peopleworks.in', role: 'Executive', password: 'Mandanna@101', phoneNumber: '9845622777' },
  { id: 'user-2', username: 'Luke Rajkumar', email: 'Luke.rajkumar@peopleworks.in', role: 'Admin', password: 'Luke@123', phoneNumber: '9500038277' },
  { id: 'user-5', username: 'Yathish G', email: 'yathish.g@peopleworks.in', role: 'Sub Admin', password: 'Yathish@789', phoneNumber: '8553309892' },
  { id: 'user-7', username: 'Hukum Chand Kewat', email: 'hukum@peopleworks.in', role: 'Executive', password: 'Hukum@112', phoneNumber: '9036010968' },
  { id: 'user-8', username: 'Hemant Sharma', email: 'hemant.sharma@peopleworks.in', role: 'Executive', password: 'Password123' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [originalUser, setOriginalUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [leads, setLeads] = useState<LeadFormData[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      // Load users, ensuring defaults are always present
      const storedUsersJSON = localStorage.getItem('appUsers');
      let usersFromStorage: AppUser[] = [];
      if (storedUsersJSON) {
        try {
            usersFromStorage = JSON.parse(storedUsersJSON);
        } catch (e) {
            console.error("Failed to parse users from storage, resetting to defaults.", e);
        }
      }

      const usersMap = new Map<string, AppUser>();
      // Load default users first
      defaultUsers.forEach(u => usersMap.set(u.email.toLowerCase(), u));
      // Overwrite with any stored users, preserving changes
      usersFromStorage.forEach(u => usersMap.set(u.email.toLowerCase(), u));
      
      const mergedUsers = Array.from(usersMap.values());
      setUsers(mergedUsers);
      localStorage.setItem('appUsers', JSON.stringify(mergedUsers));

      // Load leads
      const storedLeads = localStorage.getItem('allLeads');
      if (storedLeads) {
        setLeads(JSON.parse(storedLeads));
      }

      // Load session
      const sessionUser = sessionStorage.getItem('user');
      const sessionOriginalUser = sessionStorage.getItem('originalUser');

      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
      if (sessionOriginalUser) {
        setOriginalUser(JSON.parse(sessionOriginalUser));
      }
    } catch (e) {
      console.error("Failed to initialize app state from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistUsers = (newUsers: AppUser[]) => {
    setUsers(newUsers);
    localStorage.setItem('appUsers', JSON.stringify(newUsers));
  };

  const persistLeads = (newLeads: LeadFormData[]) => {
    setLeads(newLeads);
    localStorage.setItem('allLeads', JSON.stringify(newLeads));
  };

  const login = async (email: string, password: string) => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
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
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error("User with this email already exists.");
    }
    const newUser = { ...userData, id: String(Date.now()) };
    persistUsers([...users, newUser]);
  };

  const updateUser = async (id: string, updates: Partial<Omit<AppUser, 'id'>>) => {
    const newUsers = users.map(u => u.id === id ? { ...u, ...updates } : u);
    persistUsers(newUsers);
  };

  const deleteUser = async (id: string) => {
    const newUsers = users.filter(u => u.id !== id);
    persistUsers(newUsers);
  };
  
  const addLeads = (newLeads: LeadFormData[]) => {
    const updatedLeads = [...leads, ...newLeads];
    persistLeads(updatedLeads);
  };
  
  const updateLead = (id: string, updates: Partial<LeadFormData>) => {
    const updatedLeads = leads.map(l => l.leadId === id ? { ...l, ...updates } : l);
    persistLeads(updatedLeads);
  }

  const getNextLeadId = (): string => {
    if (leads.length === 0) return '100000';
    const maxId = leads.reduce((max, lead) => {
      const leadIdNum = parseInt(lead.leadId, 10);
      return !isNaN(leadIdNum) && leadIdNum > max ? leadIdNum : max;
    }, 99999);
    return (maxId + 1).toString();
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
        getNextLeadId,
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
