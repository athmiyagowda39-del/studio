
'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import { useUsers } from './users-context';

type User = {
  id: string;
  username: string;
  role: string;
  email: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null; // The current user (can be the impersonated one)
  originalUser: User | null; // The originally logged-in user (admin)
  isImpersonating: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonate: (userToImpersonate: User) => void;
  stopImpersonation: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { users } = useUsers();

  // Restore session from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('loggedInUser');
      const storedImpersonatedUser = localStorage.getItem('impersonatedUser');

      if (storedUser) {
        const loggedIn = JSON.parse(storedUser);
        setOriginalUser(loggedIn);

        if (storedImpersonatedUser) {
          setUser(JSON.parse(storedImpersonatedUser));
        } else {
          setUser(loggedIn);
        }
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      // Clear potentially corrupted storage
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('impersonatedUser');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const foundUser = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    const loggedInUser: User = {
      id: foundUser.id,
      username: foundUser.username,
      role: foundUser.role,
      email: foundUser.email,
    };

    // Clear any previous impersonation
    localStorage.removeItem('impersonatedUser');

    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setOriginalUser(loggedInUser);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('impersonatedUser');
    setUser(null);
    setOriginalUser(null);
    router.push('/login');
  };

  const impersonate = (userToImpersonate: User) => {
    if (originalUser && originalUser.role === 'Admin') {
      localStorage.setItem(
        'impersonatedUser',
        JSON.stringify(userToImpersonate)
      );
      setUser(userToImpersonate);
      router.push('/dashboard');
    }
  };

  const stopImpersonation = () => {
    localStorage.removeItem('impersonatedUser');
    setUser(originalUser);
    router.push('/users'); // Go back to the users page after stopping
  };

  const isImpersonating = !!(
    originalUser &&
    user &&
    originalUser.email !== user.email
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!originalUser, // Auth is based on the original user
        user, // Current effective user
        originalUser,
        isImpersonating,
        isLoading,
        login,
        logout,
        impersonate,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
