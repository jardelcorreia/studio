
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Messaging } from 'firebase/messaging';
import { getMessagingInstance } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  authUpdateNonce: number;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  messaging: Messaging | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  refreshUser: () => Promise<void>;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  messaging: Messaging | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  refreshUser: () => Promise<void>;
}

export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  refreshUser: () => Promise<void>;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
    authUpdateNonce: 0,
  });

  const [messaging, setMessaging] = useState<Messaging | null>(null);

  useEffect(() => {
    getMessagingInstance(firebaseApp).then(setMessaging);
  }, [firebaseApp]);

  useEffect(() => {
    if (!auth) {
      setUserAuthState(prev => ({ ...prev, user: null, isUserLoading: false, userError: new Error("Auth service not provided.") }));
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false, userError: null }));
      },
      (error) => {
        setUserAuthState(prev => ({ ...prev, user: null, isUserLoading: false, userError: error }));
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const refreshUser = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      setUserAuthState(prev => ({
        ...prev,
        user: auth.currentUser,
        authUpdateNonce: prev.authUpdateNonce + 1
      }));
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      messaging,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      refreshUser,
    };
  }, [firebaseApp, firestore, auth, storage, messaging, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    messaging: context.messaging,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    refreshUser: context.refreshUser,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

export const useMessaging = (): Messaging | null => {
  const { messaging } = useFirebase();
  return messaging;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = (): UserHookResult => { 
  const { user, isUserLoading, userError, refreshUser } = useFirebase();
  return { user, isUserLoading, userError, refreshUser };
};
