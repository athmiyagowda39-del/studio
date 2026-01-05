'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Auth,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  signInWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  DocumentData,
  writeBatch,
} from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase';

type UserRole = 'admin' | 'user';

type User = {
  uid: string;
  username: string;
  role: UserRole;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
  isAuthLoading: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  addUser: (
    username: string,
    pass: string,
    role: UserRole
  ) => Promise<boolean>;
  removeUser: (username: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  const fetchUserRole = useCallback(
    async (currentFirebaseUser: FirebaseUser) => {
      if (!firestore) return null;
      const userDocRef = doc(firestore, 'users', currentFirebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: currentFirebaseUser.uid,
          username:
            userData.username || currentFirebaseUser.email || 'Unnamed',
          role: userData.role || 'user',
        };
      }
      return null;
    },
    [firestore]
  );
  
  const createDefaultAdmin = useCallback(async () => {
    if (!auth || !firestore) return;
     try {
      const adminEmail = 'admin@example.com';
      const adminPass = 'password';

      // Temporarily sign out any active user to avoid conflicts
      if (auth.currentUser) {
        await signOut(auth);
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      const newUser = userCredential.user;
      
      // The new user is now authenticated. We can safely write to Firestore.
      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        username: 'admin',
        role: 'admin',
      });

      console.log('Default admin user created and profile stored.');
      
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
             try {
                // If user exists in Auth, just sign them in to ensure session is active
                // for subsequent operations or page loads.
                await signInWithEmailAndPassword(auth, 'admin@example.com', 'password');
             } catch (signInError) {
                console.error('Failed to sign in default admin after creation attempt:', signInError);
             }
        } else {
          console.error('Failed to create default admin user:', error);
        }
    }
  }, [auth, firestore]);

  const fetchAllUsers = useCallback(async () => {
    if (!firestore) return;
    const usersCollectionRef = collection(firestore, 'users');
    const snapshot = await getDocs(usersCollectionRef);
    
    if (snapshot.empty) {
        await createDefaultAdmin();
        // After creating, refetch to update the list
        const newSnapshot = await getDocs(usersCollectionRef);
        const userList = newSnapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as User)
        );
        setUsers(userList);

    } else {
        const userList = snapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as User)
        );
        setUsers(userList);
    }
  }, [firestore, createDefaultAdmin]);

  useEffect(() => {
    setIsAuthLoading(isFirebaseUserLoading);
    if (!isFirebaseUserLoading && firebaseUser) {
      fetchUserRole(firebaseUser).then((roleInfo) => {
        setUser(roleInfo);
        if (roleInfo?.role === 'admin') {
          fetchAllUsers();
        }
        setIsAuthLoading(false);
      });
    } else if (!isFirebaseUserLoading) {
      setUser(null);
      // Check for users to create default admin if none exist, even if logged out.
      fetchAllUsers(); 
      setIsAuthLoading(false);
    }
  }, [isFirebaseUserLoading, firebaseUser, fetchUserRole, fetchAllUsers]);

  const login = async (username: string, pass: string): Promise<boolean> => {
    if (!auth) return false;
    setIsAuthLoading(true);
    try {
      // Assuming email is username for login
      await signInWithEmailAndPassword(auth, `${username}@example.com`, pass);
      router.push('/');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const changePassword = async (
    oldPass: string,
    newPass: string
  ): Promise<boolean> => {
    if (!auth?.currentUser) return false;
    try {
      const email = auth.currentUser.email;
      if (!email) return false;
      const credential = EmailAuthProvider.credential(email, oldPass);
      // Reauthenticate before changing password
      await signInWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPass);
      return true;
    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    }
  };

  const addUser = async (
    username: string,
    pass: string,
    role: UserRole
  ): Promise<boolean> => {
    if (!auth || !firestore) return false;
    
    // This is tricky client-side. We need to create the user, sign out,
    // then sign the original user back in.
    const originalUser = auth.currentUser;
    const originalUserEmail = originalUser?.email;
    // IMPORTANT: This is a simplified demo. In a real app, you would not have the original user's password.
    // This flow would need to be handled by a backend function (e.g., a Firebase Function) with admin privileges.
    const originalUserPassword = "password"; // This is a placeholder and a security risk.

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        `${username}@example.com`,
        pass
      );
      const newUser = userCredential.user;

      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        username: username,
        role: role,
      });

      fetchAllUsers();
      
      // Sign out the new user and sign back in the original user
      await signOut(auth);
      if (originalUserEmail) {
          await signInWithEmailAndPassword(auth, originalUserEmail, originalUserPassword).catch(reauthError => {
            console.error("Could not re-authenticate original user. They may need to log in again.", reauthError);
            router.push('/login');
          });
      }

      return true;
    } catch (error) {
      console.error('Failed to add user:', error);
      // Ensure original user is signed in if something goes wrong
       if (originalUser && auth.currentUser?.uid !== originalUser.uid && originalUserEmail) {
           await signInWithEmailAndPassword(auth, originalUserEmail, originalUserPassword).catch(reauthError => {
            console.error("Could not re-authenticate original user. They may need to log in again.", reauthError);
            router.push('/login');
          });
       }
      return false;
    }
  };

  const removeUser = async (username: string): Promise<void> => {
     if (!firestore || !auth) return;
    const userToRemove = users.find((u) => u.username === username);
    if (!userToRemove) return;

    // This is NOT secure for a production app. It requires admin privileges.
    // This is a simplified deletion for this tool's context.
    try {
        const userDocRef = doc(firestore, 'users', userToRemove.uid);
        await deleteDoc(userDocRef);
        fetchAllUsers(); // Refresh user list
    } catch(e) {
        console.error("Could not delete user from firestore. On the client, you can't delete other users from Auth.", e);
    }
  };

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

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
