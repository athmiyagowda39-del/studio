
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadFormData } from '@/components/leads/lead-upload-form';

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

// Helper function for making API requests
async function fetchAPI(url: string, options: RequestInit = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    // For DELETE requests, there might not be a body
    if (response.status === 204) {
      return null;
    }
    return response.json();
}

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

  const addAuditLog = useCallback(async (logData: Omit<Parameters<typeof fetchAPI>[1], 'body'> & { body: any }) => {
    try {
        await fetchAPI('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData.body),
        });
    } catch (error) {
        console.error("Failed to post audit log:", error);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionUserJson = sessionStorage.getItem('user');
      const sessionOriginalUserJson = sessionStorage.getItem('originalUser');
      
      const [fetchedUsers, fetchedLeads, fetchedStatuses, fetchedSubStatuses, fetchedReferences] = await Promise.all([
        fetchAPI('/api/users'),
        fetchAPI('/api/leads'),
        fetchAPI('/api/options/statuses'),
        fetchAPI('/api/options/sub-statuses'),
        fetchAPI('/api/options/references'),
      ]);

      setUsers(fetchedUsers);
      setLeads(fetchedLeads);
      setLeadStatuses(fetchedStatuses);
      setLeadSubStatuses(fetchedSubStatuses);
      setLeadReferences(fetchedReferences);

      if (sessionUserJson) {
        const sessionUser = JSON.parse(sessionUserJson);
        const freshUserData = fetchedUsers.find((u: AppUser) => u.id === sessionUser.id);
        if (freshUserData) {
          setUser(freshUserData);
          sessionStorage.setItem('user', JSON.stringify(freshUserData));
        } else {
           sessionStorage.removeItem('user');
        }
      }
      if (sessionOriginalUserJson) {
        const sessionOriginalUser = JSON.parse(sessionOriginalUserJson);
        const freshOriginalUserData = fetchedUsers.find((u: AppUser) => u.id === sessionOriginalUser.id);
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
    const foundUser = await fetchAPI('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (foundUser) {
      setUser(foundUser);
      setOriginalUser(foundUser);
      sessionStorage.setItem('user', JSON.stringify(foundUser));
      sessionStorage.setItem('originalUser', JSON.stringify(foundUser));

      await addAuditLog({
        body: {
          userId: foundUser.id,
          username: foundUser.username,
          action: 'LOGIN',
          details: 'User logged in successfully.',
        }
      });

      if(foundUser.forcePasswordChange) {
        router.push('/profile');
      } else {
        router.push('/dashboard');
      }
    }
  };

  const logout = async () => {
    if (user) {
      await addAuditLog({
        body: {
            userId: user.id,
            username: user.username,
            action: 'LOGOUT',
            details: 'User logged out.',
        }
      });
    }
    setUser(null);
    setOriginalUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('originalUser');
    router.push('/login');
  };

  const impersonate = async (userToImpersonate: AppUser) => {
    if (originalUser && ['Manager', 'Admin', 'Super Admin'].includes(originalUser.role)) {
      await addAuditLog({
        body: {
          userId: originalUser.id,
          username: originalUser.username,
          action: 'IMPERSONATE_START',
          targetEntityType: 'USER',
          targetEntityId: userToImpersonate.id,
          details: `Started impersonating user: ${userToImpersonate.username}`,
        }
      });
      setUser(userToImpersonate);
      sessionStorage.setItem('user', JSON.stringify(userToImpersonate));
      router.push('/dashboard');
    }
  };

  const stopImpersonation = async () => {
    if (originalUser && user) {
      await addAuditLog({
        body: {
          userId: originalUser.id,
          username: originalUser.username,
          action: 'IMPERSONATE_STOP',
          targetEntityType: 'USER',
          targetEntityId: user.id,
          details: `Stopped impersonating user: ${user.username}`,
        }
      });
    }
    setUser(originalUser);
    sessionStorage.setItem('user', JSON.stringify(originalUser));
    router.push('/users');
  };

  const addUser = async (userData: Omit<AppUser, 'id'| 'password' | 'forcePasswordChange'>) => {
    const newUser = await fetchAPI('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    if (user) {
      await addAuditLog({
        body: {
          userId: user.id,
          username: user.username,
          action: 'CREATE_USER',
          targetEntityType: 'USER',
          targetEntityId: newUser.id,
          details: `Created new user '${newUser.username}' with role '${newUser.role}'.`,
        }
      });
    }
    setUsers(prev => [...prev, newUser]);
    router.refresh();
  };

  const updateUser = async (id: string, updates: Partial<Omit<AppUser, 'id'>>) => {
    const updatedUser = await fetchAPI(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (user) {
      const detailParts = Object.entries(updates)
        .filter(([key]) => key !== 'password')
        .map(([key]) => `${key} changed`);

      await addAuditLog({
        body: {
          userId: user.id,
          username: user.username,
          action: 'UPDATE_USER',
          targetEntityType: 'USER',
          targetEntityId: id,
          details: `Updated user '${updatedUser.username}'. Changes: ${detailParts.join(', ')}`,
        }
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
    router.refresh();
  };

  const deleteUser = async (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    await fetchAPI(`/api/users/${id}`, { method: 'DELETE' });
    if (user && userToDelete) {
      await addAuditLog({
        body: {
          userId: user.id,
          username: user.username,
          action: 'DELETE_USER',
          targetEntityType: 'USER',
          targetEntityId: id,
          details: `Deleted user: ${userToDelete.username}`,
        }
      });
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    router.refresh();
  };
  
  const addLeads = async (newLeads: LeadFormData[]) => {
    const addedLeads = await fetchAPI('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeads),
    });

     if (user) {
      if (addedLeads.length === 1) {
        await addAuditLog({
          body: {
            userId: user.id,
            username: user.username,
            action: 'CREATE_LEAD',
            targetEntityType: 'LEAD',
            targetEntityId: addedLeads[0].leadId,
            details: `Created new lead for company: ${addedLeads[0].company}`,
          }
        });
      } else {
        await addAuditLog({
          body: {
            userId: user.id,
            username: user.username,
            action: 'CREATE_LEAD_BULK',
            details: `Added ${addedLeads.length} new leads via bulk upload.`,
          }
        });
      }
    }
    setLeads(prev => [...prev, ...addedLeads]);
    router.refresh();
  };
  
  const updateLead = async (id: string, updates: Partial<LeadFormData>) => {
    const updatedLead = await fetchAPI(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });

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
        await addAuditLog({
          body: {
            userId: user.id,
            username: user.username,
            action: 'UPDATE_LEAD',
            targetEntityType: 'LEAD',
            targetEntityId: id,
            details: `Updated lead for '${updatedLead.company}'. Changes: ${changes}.`,
          }
        });
      }
    }
    setLeads(prev => prev.map(l => l.leadId === id ? updatedLead : l));
    router.refresh();
  };

  const getNextLeadId = async (): Promise<string> => {
    const data = await fetchAPI('/api/leads/next-id');
    return data.nextId;
  }

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
