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
    { id: 'user-1', username: 'Athmiya.ag', email: 'Athmiya.ag@peopleworks.in', role: 'Admin', password: 'Athmiya@123' },
    { id: 'user-2', username: 'Luke.rajkumar', email: 'Luke.rajkumar@peopleworks.in', role: 'Admin', password: 'Luke@123' },
    { id: 'user-3', username: 'Varghese', email: 'Varghese@peopleworks.in', role: 'Admin', password: 'Varghese@123' },
    { id: 'user-4', username: 'sam.devasia', email: 'sam.devasia@peopleworks.in', role: 'Admin', password: 'SamDev@456' },
    { id: 'user-5', username: 'yathish.g', email: 'yathish.g@peopleworks.in', role: 'Executive', password: 'Yathish@789' },
    { id: 'user-6', username: 'Mandanna.n', email: 'Mandanna.n@peopleworks.in', role: 'Executive', password: 'Mandanna@101' },
    { id: 'user-7', username: 'hukum', email: 'hukum@peopleworks.in', role: 'Executive', password: 'Hukum@112' },
];


export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('appUsers');
      if (storedUsers) {
        let parsedUsers: AppUser[] = JSON.parse(storedUsers);
        setUsers(parsedUsers);
      } else {
        setUsers(defaultUsers);
        localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
      }
    } catch (error) {
      console.error('Failed to parse users from localStorage, resetting to default.', error);
      setUsers(defaultUsers);
      localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
    }
  }, []);

  const addUser = async (userData: Omit<AppUser, 'id'>) => {
    if (!userData.password) {
        throw new Error("Password is required to create a user.");
    }
    // This creates the user in Firebase Auth
    // NOTE: This can only be done while another user is logged in. 
    // For a real app, this should be a backend (Admin SDK) operation.
    // For this prototype, we are creating a limitation that an Admin must be logged in to create a user.
    await createUserWithEmailAndPassword(auth, userData.email, userData.password);

    // This adds the user to our local list for role management
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
    // Note: We are not updating the user in Firebase Auth here for simplicity.
    // Password changes are handled separately in the profile page.
    // Role/username changes here will only affect the app's UI, not Firebase.
    const updatedUsers = users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    );
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
