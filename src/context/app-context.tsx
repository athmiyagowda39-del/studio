
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import * as UserActions from '@/actions/users';
import * as LeadActions from '@/actions/leads';
import * as OptionActions from '@/actions/options';
import { addAuditLog } from '@/actions/audit';

export type AppUser = {
  id: string;
  username: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Manager' | 'Executive';
  password?: string; 
  phoneNumber?: string;
  employeeId?: string;
  forcePasswordChange?: boolean;
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
  leadStatuses: string[];
  leadSubStatuses: string[];
  leadReferences: string[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonate: (userToImpersonate: AppUser) => void;
  stopImpersonation: () => void;
  addUser: (user: Omit<AppUser, 'id' | 'password' | 'forcePasswordChange'>) => Promise<void>;
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
  const [leadStatuses, setLeadStatuses] = useState<string[]>([]);
  const [leadSubStatuses, setLeadSubStatuses] = useState<string[]>([]);
  const [leadReferences, setLeadReferences] = useState<string[]>([]);
  const router = useRouter();

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionUserJson = sessionStorage.getItem('user');
      const sessionOriginalUserJson = sessionStorage.getItem('originalUser');
      
      const [fetchedUsers, fetchedLeads, fetchedStatuses, fetchedSubStatuses, fetchedReferences] = await Promise.all([
        UserActions.getUsers(),
        LeadActions.getLeads(),
        OptionActions.getLeadStatuses(),
        OptionActions.getLeadSubStatuses(),
        OptionActions.getLeadReferences(),
      ]);

      setUsers(fetchedUsers);
      setLeads(fetchedLeads);
      setLeadStatuses(fetchedStatuses);
      setLeadSubStatuses(fetchedSubStatuses);
      setLeadReferences(fetchedReferences);

      if (sessionUserJson) {
        const sessionUser = JSON.parse(sessionUserJson);
        const freshUserData = fetchedUsers.find(u => u.id === sessionUser.id);
        if (freshUserData) {
          setUser(freshUserData);
          sessionStorage.setItem('user', JSON.stringify(freshUserData));
        } else {
           sessionStorage.removeItem('user');
        }
      }
      if (sessionOriginalUserJson) {
        const sessionOriginalUser = JSON.parse(sessionOriginalUserJson);
        const freshOriginalUserData = fetchedUsers.find(u => u.id === sessionOriginalUser.id);
        if(freshOriginalUserData) {
            setOriginalUser(freshOriginalUserData);
            sessionStorage.setItem('originalUser', JSON.stringify(freshOriginalUserData));
        } else {
             sessionStorage.removeItem('originalUser');
        }
      }
      
    } catch (error) {
      console.error("AppProvider: Failed to load initial data:", error);
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

      addAuditLog({
        userId: foundUser.id,
        username: foundUser.username,
        action: 'LOGIN',
        details: 'User logged in successfully.',
      });

      if(foundUser.forcePasswordChange) {
        router.push('/profile');
      } else {
        router.push('/dashboard');
      }

    } else {
      throw new Error('Invalid email or password.');
    }
  };

  const logout = async () => {
    if (user) {
      addAuditLog({
        userId: user.id,
        username: user.username,
        action: 'LOGOUT',
        details: 'User logged out.',
      });
    }
    setUser(null);
    setOriginalUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('originalUser');
    router.push('/login');
  };

  const impersonate = (userToImpersonate: AppUser) => {
    if (originalUser && ['Manager', 'Admin', 'Super Admin'].includes(originalUser.role)) {
      addAuditLog({
        userId: originalUser.id,
        username: originalUser.username,
        action: 'IMPERSONATE_START',
        targetEntityType: 'USER',
        targetEntityId: userToImpersonate.id,
        details: `Started impersonating user: ${userToImpersonate.username}`,
      });
      setUser(userToImpersonate);
      sessionStorage.setItem('user', JSON.stringify(userToImpersonate));
      router.push('/dashboard');
    }
  };

  const stopImpersonation = () => {
    if (originalUser && user) {
      addAuditLog({
        userId: originalUser.id,
        username: originalUser.username,
        action: 'IMPERSONATE_STOP',
        targetEntityType: 'USER',
        targetEntityId: user.id,
        details: `Stopped impersonating user: ${user.username}`,
      });
    }
    setUser(originalUser);
    sessionStorage.setItem('user', JSON.stringify(originalUser));
    router.push('/users');
  };

  const addUser = async (userData: Omit<AppUser, 'id'| 'password' | 'forcePasswordChange'>) => {
    const newUser = await UserActions.addUser(userData);
    if (user) {
      addAuditLog({
        userId: user.id,
        username: user.username,
        action: 'CREATE_USER',
        targetEntityType: 'USER',
        targetEntityId: newUser.id,
        details: `Created new user '${newUser.username}' with role '${newUser.role}'.`,
      });
    }
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = async (id: string, updates: Partial<Omit<AppUser, 'id'>>) => {
    const updatedUser = await UserActions.updateUser(id, updates);
    if (user) {
      const detailParts = Object.entries(updates)
        .filter(([key]) => key !== 'password')
        .map(([key]) => `${key} changed`);

      addAuditLog({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_USER',
        targetEntityType: 'USER',
        targetEntityId: id,
        details: `Updated user '${updatedUser.username}'. Changes: ${detailParts.join(', ')}`,
      });
    }
    
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
    
    if (user?.id === id) {
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
    if (originalUser?.id === id) {
        setOriginalUser(updatedUser);
        sessionStorage.setItem('originalUser', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = async (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    await UserActions.deleteUser(id);
    if (user && userToDelete) {
      addAuditLog({
        userId: user.id,
        username: user.username,
        action: 'DELETE_USER',
        targetEntityType: 'USER',
        targetEntityId: id,
        details: `Deleted user: ${userToDelete.username}`,
      });
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };
  
  const addLeads = async (newLeads: LeadFormData[]) => {
    const addedLeads = await LeadActions.addLeads(newLeads);
     if (user) {
      if (addedLeads.length === 1) {
        addAuditLog({
          userId: user.id,
          username: user.username,
          action: 'CREATE_LEAD',
          targetEntityType: 'LEAD',
          targetEntityId: addedLeads[0].leadId,
          details: `Created new lead for company: ${addedLeads[0].company}`,
        });
      } else {
        addAuditLog({
          userId: user.id,
          username: user.username,
          action: 'CREATE_LEAD_BULK',
          details: `Added ${addedLeads.length} new leads via bulk upload.`,
        });
      }
    }
    setLeads(prev => [...prev, ...addedLeads]);
  };
  
  const updateLead = async (id: string, updates: Partial<LeadFormData>) => {
    const updatedLead = await LeadActions.updateLead(id, updates);
    if (user) {
      // Create a more generic and comprehensive log message
      const changes = Object.keys(updates)
        .map(key => {
          if (key === 'followUps') return 'added a new follow-up';
          if (key === 'executiveViewDate') return 'lead viewed by executive';
          if (key === 'executive') return `transferred to executive '${updates[key]}'`;
          if (key === 'status') return `status changed to '${updates[key]}'`;
          return `${key} was updated`;
        })
        .join(', ');

      if (changes) {
        addAuditLog({
          userId: user.id,
          username: user.username,
          action: 'UPDATE_LEAD',
          targetEntityType: 'LEAD',
          targetEntityId: id,
          details: `Updated lead for '${updatedLead.company}'. Changes: ${changes}.`,
        });
      }
    }
    setLeads(prev => prev.map(l => l.leadId === id ? updatedLead : l));
  };

  const isImpersonating = !!(originalUser && user && originalUser.id !== user.id);
  const isReadOnly = (isImpersonating && originalUser?.role !== 'Super Admin');

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
        leadStatuses,
        leadSubStatuses,
        leadReferences,
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
