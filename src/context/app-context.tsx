
'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { auth, firestore as db } from '@/lib/firebase';

export type AppUser = {
  id: string; // Firebase UID
  username: string;
  email: string;
  role: 'Admin' | 'Executive';
  password?: string;
};

type AppContextType = {
  isAuthenticated: boolean;
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  users: AppUser[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addUser: (user: Omit<AppUser, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<AppUser, 'id'>>) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch users from Firestore on initial load
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AppUser[];
      setUsers(userList);
    };

    fetchUsers();
  }, []);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Find matching user in our user list
        const appUser = users.find((u) => u.id === fbUser.uid);
        setUser(appUser || null);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [users]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    router.push('/dashboard');
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const addUser = async (userData: Omit<AppUser, 'id'>) => {
    if (!userData.password) throw new Error('Password is required');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const newUser: AppUser = {
      ...userData,
      id: userCredential.user.uid,
    };
    // Save additional user info to Firestore
    await setDoc(doc(db, 'users', newUser.id), {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = async (
    id: string,
    updates: Partial<Omit<AppUser, 'id'>>
  ) => {
    const userDoc = doc(db, 'users', id);
    await setDoc(userDoc, updates, { merge: true });
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
  };

  const value = {
    isAuthenticated: !!firebaseUser,
    user,
    firebaseUser,
    isLoading,
    users,
    login,
    logout,
    addUser,
    updateUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
