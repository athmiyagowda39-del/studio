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
    const initializeUsers = async () => {
      try {
        const storedUsers = localStorage.getItem('appUsers');
        let currentUsers: AppUser[] = [];
        if (storedUsers) {
          currentUsers = JSON.parse(storedUsers);
        } else {
          currentUsers = defaultUsers;
        }

        // Ensure all users have email and password for local dev
        const usersWithCredentials = currentUsers.map(user => {
          const defaultUser = defaultUsers.find(du => du.id === user.id);
          return {
            ...user,
            email: user.email || defaultUser?.email || '',
            password: user.password || defaultUser?.password || ''
          };
        });

        setUsers(usersWithCredentials);
        localStorage.setItem('appUsers', JSON.stringify(usersWithCredentials));
        
      } catch (error) {
        console.error('Failed to initialize users:', error);
        setUsers(defaultUsers);
        localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
      }
    };
    initializeUsers();
  }, []);

  const addUser = async (userData: Omit<AppUser, 'id'>) => {
    if (!userData.password) {
        throw new Error("Password is required to create a user.");
    }
    // This creates the user in Firebase Auth
    // await createUserWithEmailAndPassword(auth, userData.email, userData.password);

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
    const updatedUsers = users.map(user => {
      if (user.id === id) {
        // Find the original default user to ensure we don't lose the password if it's not in the update
        const defaultUser = defaultUsers.find(du => du.id === id);
        const newPassword = updates.password || user.password || defaultUser?.password;
        return { ...user, ...updates, password: newPassword };
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
