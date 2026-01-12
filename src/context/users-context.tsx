'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type AppUser = {
  id: string;
  username: string;
  role: 'Admin' | 'Executive';
};

type UsersContextType = {
  users: AppUser[];
  addUser: (user: Omit<AppUser, 'id'>) => void;
  // In the future, we can add updateUser and deleteUser
};

const UsersContext = createContext<UsersContextType | undefined>(undefined);

const defaultUsers: AppUser[] = [
    { id: 'user-1', username: 'athmiya', role: 'Admin' },
    { id: 'user-2', username: 'Luke Rajkumar', role: 'Executive' },
    { id: 'user-3', username: 'Hemanth', role: 'Executive' },
    { id: 'user-4', username: 'Hukum', role: 'Executive' },
    { id: 'user-5', username: 'Yathish G', role: 'Executive' },
    { id: 'user-6', username: 'Mandanna N', role: 'Executive' },
];

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('appUsers');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Initialize with default users if none are in storage
        setUsers(defaultUsers);
        localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
      }
    } catch (error) {
      console.error('Failed to parse users from localStorage', error);
      setUsers(defaultUsers);
    }
  }, []);

  const addUser = (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
     // Dispatch a storage event to notify other tabs/windows
    window.dispatchEvent(new StorageEvent('storage', { key: 'appUsers' }));
  };

  const value = {
    users,
    addUser,
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
