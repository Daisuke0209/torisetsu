import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { AlertCircleIcon, EyeIcon, EyeOffIcon, LoaderIcon, UserPlusIcon } from '../components/ui/Icons';
import { APP_CONFIG } from '../constants/app';
import Footer from '../components/ui/Footer';

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  general?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [] });
  const navigate = useNavigate();
  const { register, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    calculatePasswordStrength(formData.password);
  }, [formData.password]);

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('8文字以上にしてください');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('小文字を含めてください');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('大文字を含めてください');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('数字を含めてください');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('記号を含めてください');
    }

    setPasswordStrength({ score, feedback });
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 1) return '弱い';
    if (score <= 2) return 'やや弱い';
    if (score <= 3) return '普通';
    if (score <= 4) return '強い';
    return '非常に強い';
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // メールアドレス検証
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // ユーザー名検証
    if (!formData.username.trim()) {
      newErrors.username = 'ユーザー名を入力してください';
    } else if (formData.username.length < 3) {
      newErrors.username = 'ユーザー名は3文字以上で入力してください';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます';
    }

    // パスワード検証
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    clearError(field);
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await register(formData.email, formData.username, formData.password);
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      let errorMessage = '登録に失敗しました';
      if (err.response?.status === 400) {
        if (err.response.data.detail?.includes('Email already registered')) {
          errorMessage = 'このメールアドレスは既に登録されています';
        } else if (err.response.data.detail?.includes('Username already taken')) {
          errorMessage = 'このユーザー名は既に使用されています';
        } else {
          errorMessage = err.response.data.detail;
        }
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

        {/* 登録カード */}
        <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              アカウント作成
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={loading}
                  className={`h-11 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 ${
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

              {/* ユーザー名 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ユーザー名
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  disabled={loading}
                  className={`h-11 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 ${
                    errors.username ? 'border-red-500 dark:border-red-400' : ''
                  }`}
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1">
                    <AlertCircleIcon size={14} />
                    <span>{errors.username}</span>
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
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    disabled={loading}
                    className={`h-11 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 pr-12 ${
                      errors.password ? 'border-red-500 dark:border-red-400' : ''
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                
                {/* パスワード強度インジケーター */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {getPasswordStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1">
                    <AlertCircleIcon size={14} />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* 登録ボタン */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoaderIcon size={18} className="animate-spin" />
                    アカウント作成中...
                  </>
                ) : (
                  <>
                    <UserPlusIcon size={18} />
                    アカウントを作成
                  </>
                )}
              </Button>
            </form>

            {/* ログインリンク */}
            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                既にアカウントをお持ちの方は{' '}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                >
                  ログイン
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

export default Register;