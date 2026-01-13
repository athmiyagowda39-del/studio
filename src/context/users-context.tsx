'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type AppUser = {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Executive';
  password?: string;
};

type UsersContextType = {
  users: AppUser[];
  addUser: (user: Omit<AppUser, 'id'>) => void;
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
        
        // Check if migration is needed (missing email or password)
        const needsMigration = parsedUsers.some(u => !u.email || !u.password);
        
        if (needsMigration) {
          // If any user needs migration, reset all to default for consistency
          console.log("User data is outdated. Resetting to default users.");
          setUsers(defaultUsers);
          localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
        } else {
          setUsers(parsedUsers);
        }

      } else {
        // Initialize with default users if none are in storage
        setUsers(defaultUsers);
        localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
      }
    } catch (error) {
      console.error('Failed to parse users from localStorage, resetting to default.', error);
      setUsers(defaultUsers);
      localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
    }
  }, []);

  const addUser = (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      ...userData,
      id: `user-${Date.now()}`,
      password: userData.password || `password${Date.now()}` // Assign a default password
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
     // Dispatch a storage event to notify other tabs/windows
    window.dispatchEvent(new StorageEvent('storage', { key: 'appUsers' }));
  };

  const updateUser = (id: string, updates: Partial<Omit<AppUser, 'id'>>) => {
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
