import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { AlertCircleIcon, CheckIcon, EyeIcon, EyeOffIcon, LoaderIcon } from '../components/ui/Icons';
import { APP_CONFIG } from '../constants/app';
import Footer from '../components/ui/Footer';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();


  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);



  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!password.trim()) {
      newErrors.password = 'パスワードを入力してください';
    } else if (password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }
    if (loading) {
      return; // 重複送信を防ぐ
    }

    setLoading(true);
    clearGeneralError();

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      let errorMessage = 'ログインに失敗しました';
      if (err.message === 'メールアドレスまたはパスワードが正しくありません') {
        errorMessage = err.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setErrors(prev => ({ ...prev, general: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const clearGeneralError = () => {
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
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
          </CardHeader>
          
          <CardContent>
            <form className="space-y-6">
              {/* 全般エラー */}
              {errors.general && (
                <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircleIcon size={20} />
                  <span className="text-sm font-medium">{errors.general}</span>
                </div>
              )}

              {/* メールアドレス */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  メールアドレス
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError('email');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  disabled={loading}
                  className={`h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 ${
                    errors.email ? 'border-red-500 dark:border-red-400' : ''
                  }`}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1">
                    <AlertCircleIcon size={14} />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* パスワード */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  パスワード
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    disabled={loading}
                    className={`h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 pr-12 ${
                      errors.password ? 'border-red-500 dark:border-red-400' : ''
                    }`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1">
                    <AlertCircleIcon size={14} />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* ログインボタン */}
              <button
                type="button"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit(e as any);
                }}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoaderIcon size={18} className="animate-spin" />
                    ログイン中...
                  </>
                ) : (
                  <>
                    <CheckIcon size={18} />
                    ログイン
                  </>
                )}
              </button>
            </form>

            {/* 登録リンク */}
            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                アカウントをお持ちでない方は{' '}
                <Link
                  to="/register"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                >
                  新規登録
                </Link>
              </p>
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