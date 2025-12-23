'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('password');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    const storedPassword = localStorage.getItem('userPassword');
    if (storedPassword) {
      setPassword(storedPassword);
    }
    setIsLoaded(true);
  }, []);

  const login = (pass: string) => {
    if (pass === password) {
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  const changePassword = (oldPass: string, newPass: string) => {
    if (oldPass === password) {
      localStorage.setItem('userPassword', newPass);
      setPassword(newPass);
      return true;
    }
    return false;
  };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
