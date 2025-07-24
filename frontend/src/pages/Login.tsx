import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircleIcon, LoaderIcon } from '../components/ui/Icons';
import { APP_CONFIG } from '../constants/app';
import Footer from '../components/ui/Footer';

interface FormErrors {
  general?: string;
}

const Login: React.FC = () => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await login();
      navigate('/');
    } catch (err: any) {
      let errorMessage = 'ログインに失敗しました';
      if (err.message) {
        errorMessage = err.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* ブランドセクション */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">{APP_CONFIG.logoIcon}</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {APP_CONFIG.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 -mt-1">
                {APP_CONFIG.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* ログインカード */}
        <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              ログイン
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Googleアカウントでログインしてください
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* 全般エラー */}
              {errors.general && (
                <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircleIcon size={20} />
                  <span className="text-sm font-medium">{errors.general}</span>
                </div>
              )}

              {/* Googleログインボタン */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full h-12 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <LoaderIcon size={18} className="animate-spin" />
                    ログイン中...
                  </>
                ) : (
                  <>
                    {/* Google Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Googleでログイン
                  </>
                )}
              </button>

              {/* 説明テキスト */}
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  初めてログインする場合は、自動的にアカウントが作成されます
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <Footer />
      </div>
    </div>
  );
};

export default Login;