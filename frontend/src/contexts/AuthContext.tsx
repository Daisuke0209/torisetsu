import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import client from '../api/client';
import { User } from '../types';
import { clearAuthData } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
  const { user: firebaseUser, loading: firebaseLoading, signInWithGoogle, signOut } = useFirebaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await client.get('/api/auth/me');
      setUser(response.data);
    } catch (error: any) {
      console.error('AuthContext: Failed to refresh user:', error);
      // トークンが無効な場合はクリア
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  };

  useEffect(() => {
    // Firebaseユーザーの状態が変更されたら、内部ユーザー情報を更新
    if (firebaseUser && firebaseUser.token) {
      refreshUser();
    } else if (!firebaseLoading && !firebaseUser) {
      // ユーザーがいない場合は、古いトークンとユーザー情報をクリア
      clearAuthData();
      setUser(null);
    }
    setLoading(firebaseLoading);
  }, [firebaseUser, firebaseLoading]);

  const login = async () => {
    try {
      await signInWithGoogle();
      // useFirebaseAuth フックが自動的にトークンを取得し、
      // useEffect が refreshUser を呼び出す
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'ログインに失敗しました');
    }
  };

  const logout = async () => {
    try {
      // まず認証データをクリア
      clearAuthData();
      setUser(null);
      
      // Firebaseからログアウト
      await signOut();
      
      // ダッシュボードにいる場合は、ログインページにリダイレクト
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      // エラーが発生してもデータはクリアされているので、リダイレクトは実行
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};