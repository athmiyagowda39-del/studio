'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type AppUser = {
  id: string;
  username: string;
  role: 'Admin' | 'Executive';
  password?: string;
};

type UsersContextType = {
  users: AppUser[];
  addUser: (user: Omit<AppUser, 'id'>) => void;
  // In the future, we can add updateUser and deleteUser
};

const UsersContext = createContext<UsersContextType | undefined>(undefined);

const defaultUsers: AppUser[] = [
    { id: 'user-1', username: 'Athmiya.ag', role: 'Admin', password: 'Athmiya@123' },
    { id: 'user-2', username: 'Luke.rajkumar', role: 'Admin', password: 'Luke@123' },
    { id: 'user-3', username: 'Varghese', role: 'Admin', password: 'Varghese@123' },
    { id: 'user-4', username: 'sam.devasia', role: 'Admin', password: 'SamDev@456' },
    { id: 'user-5', username: 'yathish.g', role: 'Executive', password: 'Yathish@789' },
    { id: 'user-6', username: 'Mandanna.n', role: 'Executive', password: 'Mandanna@101' },
    { id: 'user-7', username: 'hukum', role: 'Executive', password: 'Hukum@112' },
];


export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('appUsers');
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        // Basic migration if old user structure is detected
        if (parsedUsers.length > 0 && !parsedUsers[0].password) {
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
      console.error('Failed to parse users from localStorage', error);
      setUsers(defaultUsers);
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
