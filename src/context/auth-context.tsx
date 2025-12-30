'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

type User = {
  username: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isAuthLoading: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    }
    setIsAuthLoading(false);
  }, []);

  const login = async (username: string, pass: string) => {
    setIsAuthLoading(true);
    // Simple mock authentication
    if (username === 'athmiya' && pass === 'passwordd') {
      const userData: User = { username: 'athmiya' };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthLoading(false);
      return true;
    }
    setIsAuthLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    // This is a mock. In a real app, you'd have an API for this.
    if (oldPass === 'passwordd') {
      console.log('Password changed successfully (mock)');
      return true;
    }
    return false;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isAuthLoading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
