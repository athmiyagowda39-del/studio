'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  username: string;
  role: 'admin' | 'user';
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
  isAuthLoading: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  addUser: (user: User) => void;
  removeUser: (username: string) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const initialUsers: User[] = [
    { username: 'athmiya', role: 'admin' },
    { username: 'chiranth', role: 'user' },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedUsers = localStorage.getItem('app_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        setUsers(initialUsers);
        localStorage.setItem('app_users', JSON.stringify(initialUsers));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      localStorage.removeItem('user');
      localStorage.removeItem('app_users');
    }
    setIsAuthLoading(false);
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    setIsAuthLoading(true);
    // In a real app, password verification would be secure.
    // Here we use a simple mock based on stored users.
    const appUsersStr = localStorage.getItem('app_users');
    const appUsers: User[] = appUsersStr ? JSON.parse(appUsersStr) : initialUsers;
    const foundUser = appUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    // Mock password check
    if (foundUser && (pass === 'password' || pass === 'passwordd')) {
      localStorage.setItem('user', JSON.stringify(foundUser));
      setUser(foundUser);
      setIsAuthLoading(false);
      router.push('/');
      return true;
    }

    setIsAuthLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    if (oldPass === 'password' || oldPass === 'passwordd') {
      console.log('Password changed successfully (mock)');
      return true;
    }
    return false;
  };
  
  const addUser = (newUser: User) => {
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
  }

  const removeUser = (username: string) => {
      const updatedUsers = users.filter(u => u.username !== username);
      setUsers(updatedUsers);
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
  }

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        users,
        isAuthLoading,
        login,
        logout,
        changePassword,
        addUser,
        removeUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
