
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from './auth-context';


export type AppUser = {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Executive';
  password?: string;
};

type UsersContextType = {
  users: AppUser[];
  addUser: (user: Omit<AppUser, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<AppUser, 'id'>>) => void;
};

const UsersContext = createContext<UsersContextType | undefined>(undefined);

const defaultUsers: AppUser[] = [
    { id: 'user-1', username: 'Athmiya.ag', email: 'athmiya.ag@peopleworks.in', role: 'Admin', password: 'Welcome123#' },
    { id: 'user-2', username: 'Luke Rajkumar', email: 'Luke.rajkumar@peopleworks.in', role: 'Executive', password: 'Luke@123' },
    { id: 'user-3', username: 'Varghese', email: 'Varghese@peopleworks.in', role: 'Admin', password: 'Varghese@123' },
    { id: 'user-4', username: 'sam.devasia', email: 'sam.devasia@peopleworks.in', role: 'Admin', password: 'SamDev@456' },
    { id: 'user-5', username: 'Yathis G', email: 'yathish.g@peopleworks.in', role: 'Executive', password: 'Yathish@789' },
    { id: 'user-6', username: 'Mandanna N', email: 'mandanna.n@peopleworks.in', role: 'Executive', password: 'Mandanna@101' },
    { id: 'user-7', username: 'Hukum Chand Kewat', email: 'hukum@peopleworks.in', role: 'Executive', password: 'Hukum@112' },
    { id: 'user-8', username: 'Hemant Sharma', email: 'hemant.sharma@peopleworks.in', role: 'Executive', password: 'Password123' },
];


export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const initializeUsers = async () => {
      try {
        // Always start with default users to ensure the list is correct on load.
        // This will overwrite any stale data in localStorage.
        const currentUsers = defaultUsers;
        setUsers(currentUsers);
        localStorage.setItem('appUsers', JSON.stringify(currentUsers));
        
      } catch (error) {
        console.error('Failed to initialize users:', error);
        setUsers(defaultUsers);
        localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
      }
    };
    initializeUsers();
  }, []);

  const addUser = async (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    window.dispatchEvent(new StorageEvent('storage', { key: 'appUsers' }));
  };

  const updateUser = (id: string, updates: Partial<Omit<AppUser, 'id'>>) => {
    const updatedUsers = users.map(user => {
      if (user.id === id) {
        return { ...user, ...updates };
      }
      return user;
    });

    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    window.dispatchEvent(new StorageEvent('storage', { key: 'appUsers' }));
  };


  const value = {
    users,
    addUser,
    updateUser,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
}

    
