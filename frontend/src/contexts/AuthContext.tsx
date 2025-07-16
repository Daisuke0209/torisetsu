import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import client from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
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
    const initializeAuth = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // FormDataを使ってOAuth2形式でリクエスト
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await client.post('/api/auth/token', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { access_token } = response.data;
      
      // トークンを保存
      localStorage.setItem('token', access_token);

      // ユーザー情報を取得
      await refreshUser();
    } catch (error: any) {
      // ログイン失敗時は無効なトークンがあれば削除
      localStorage.removeItem('token');
      
      // より詳細なエラーハンドリング
      if (error.response?.status === 401) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      } else if (error.response?.status >= 500) {
        throw new Error('サーバーエラーが発生しました。しばらく後でお試しください');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('ログインに失敗しました');
      }
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      // ユーザー登録
      await client.post('/api/auth/register', {
        email,
        username,
        password,
      });

      // 登録後、自動的にログイン
      await login(email, password);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // より詳細なエラーハンドリング
      if (error.response?.status === 400) {
        const detail = error.response.data?.detail || '';
        if (detail.includes('このメールアドレスは既に登録されています')) {
          throw new Error('このメールアドレスは既に登録されています');
        } else {
          throw new Error(detail || '登録時にエラーが発生しました');
        }
      } else if (error.response?.status >= 500) {
        throw new Error('サーバーエラーが発生しました。しばらく後でお試しください');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('アカウントの作成に失敗しました');
      }
    }
  };

  const logout = () => {
    // トークンとユーザー情報をクリア
    localStorage.removeItem('token');
    localStorage.removeItem('remembered_email');
    setUser(null);
    
    // ダッシュボードにいる場合は、ログインページにリダイレクト
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};