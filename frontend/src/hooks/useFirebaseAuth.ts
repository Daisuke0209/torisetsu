import { useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import axios from 'axios';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  token?: string;
}

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // IDトークンを取得
          const idToken = await firebaseUser.getIdToken();
          
          // バックエンドにIDトークンを送信してJWTトークンを取得
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/auth/google`,
            { idToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          const { access_token } = response.data;
          
          // ローカルストレージにトークンを保存
          localStorage.setItem('token', access_token);
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            token: access_token
          });
        } catch (error: any) {
          console.error('Error getting user token:', error);
          let errorMessage = '認証エラーが発生しました';
          
          if (error.response?.status === 401) {
            errorMessage = '認証トークンが無効です';
          } else if (error.response?.status >= 500) {
            errorMessage = 'サーバーエラーが発生しました';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          setError(errorMessage);
          // エラー時はFirebaseからもログアウト
          firebaseSignOut(auth);
        }
      } else {
        // ログアウト時の処理
        localStorage.removeItem('token');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged が自動的に処理を行う
      return result.user;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'ログインに失敗しました');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged が自動的に処理を行う
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message || 'ログアウトに失敗しました');
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut
  };
};