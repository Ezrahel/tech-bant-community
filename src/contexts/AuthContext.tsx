// Authentication context using Go backend API only (no Firebase)
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/auth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    
    // Listen for storage changes (e.g., token updates from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        loadUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadUser = async () => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await authService.verifyToken();
      setUser(profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      setUserProfile(null);
      // Clear invalid token
      authService.setToken('');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
