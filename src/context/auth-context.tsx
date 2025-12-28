
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

type User = {
  username: string;
  password?: string;
  type: 'SUB ADMIN' | 'Executive';
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const users: Record<string, User> = {
  athmiya: { username: 'athmiya', type: 'SUB ADMIN' },
  executive: { username: 'executive', type: 'Executive' },
};

const passwords: Record<string, string> = {
  athmiya: 'passwordd',
  executive: 'passworde',
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userPasswords, setUserPasswords] = useState(passwords);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load authentication state from sessionStorage
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    const storedUser = sessionStorage.getItem('user');
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }

    // Load passwords from localStorage
    const storedPasswords = localStorage.getItem('userPasswords');
    if (storedPasswords) {
      setUserPasswords(JSON.parse(storedPasswords));
    } else {
      localStorage.setItem('userPasswords', JSON.stringify(passwords));
    }
    
    setIsLoaded(true);
  }, []);

  const login = (username: string, pass: string) => {
    const normalizedUsername = username.toLowerCase();
    const userToLogin = users[normalizedUsername];
    const storedPassword = userPasswords[normalizedUsername];

    if (userToLogin && pass === storedPassword) {
      const userData = { username: userToLogin.username, type: userToLogin.type };
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const changePassword = (oldPass: string, newPass: string) => {
    if (user) {
      const currentPassword = userPasswords[user.username];
      if (oldPass === currentPassword) {
        const updatedPasswords = { ...userPasswords, [user.username]: newPass };
        localStorage.setItem('userPasswords', JSON.stringify(updatedPasswords));
        setUserPasswords(updatedPasswords);
        return true;
      }
    }
    return false;
  };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
