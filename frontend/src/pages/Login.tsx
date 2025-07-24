import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircleIcon, LoaderIcon } from '../components/ui/Icons';

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
    <div className="min-h-screen">
      <div className="min-h-screen flex">
        {/* 左側: ログインフォーム */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-amber-800 via-amber-900 to-orange-900 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* ログインカード */}
            <Card className="border-0 bg-white/95 dark:bg-amber-900/80 backdrop-blur-xl shadow-2xl shadow-amber-950/20 border border-amber-300/50 dark:border-amber-600/50">
              <CardHeader className="space-y-2 text-center pb-6">
                <CardTitle className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  ログイン
                </CardTitle>
                <p className="text-sm text-amber-700 dark:text-amber-300">
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
                    className="w-full h-12 bg-white dark:bg-amber-700 hover:bg-amber-50 dark:hover:bg-amber-600 border border-amber-300 dark:border-amber-600 text-amber-900 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      初めてログインする場合は、自動的にアカウントが作成されます
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 右側: アプリ説明 */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 items-center justify-center p-12 relative overflow-hidden">
          {/* 背景の装飾パターン（本のページ風） */}
          <div className="absolute inset-0">
            {/* ページの罫線 */}
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="absolute w-full h-px bg-amber-300 dark:bg-amber-600" style={{ top: `${10 + i * 4}%` }}></div>
              ))}
            </div>
            {/* ページの余白線 */}
            <div className="absolute left-16 top-0 w-px h-full bg-amber-400/30 dark:bg-amber-600/30"></div>
          </div>
          
          {/* メインコンテンツ - 本のページ風デザイン */}
          <div className="relative z-10 max-w-lg w-full">
            <div className="bg-gradient-to-br from-amber-50/90 to-orange-100/90 dark:from-amber-800/80 dark:to-orange-800/80 backdrop-blur-xl rounded-lg p-10 shadow-2xl shadow-amber-800/20 border-2 border-amber-200/50 dark:border-amber-700/50 relative">
              {/* 本のページの穴（リング綴じ風） */}
              <div className="absolute left-4 top-8 w-2 h-2 rounded-full bg-amber-300/50 dark:bg-amber-600/50"></div>
              <div className="absolute left-4 top-16 w-2 h-2 rounded-full bg-amber-300/50 dark:bg-amber-600/50"></div>
              <div className="absolute left-4 bottom-16 w-2 h-2 rounded-full bg-amber-300/50 dark:bg-amber-600/50"></div>
              <div className="absolute left-4 bottom-8 w-2 h-2 rounded-full bg-amber-300/50 dark:bg-amber-600/50"></div>
              
              {/* ページ番号 */}
              <div className="absolute top-4 right-6 text-xs text-amber-600 dark:text-amber-400 font-mono">- 1 -</div>
              
              {/* ヘッダー（本のタイトル風） */}
              <div className="text-center mb-8 border-b-2 border-amber-300/30 dark:border-amber-600/30 pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 relative">
                  {/* 本のデザイン */}
                  <div className="w-12 h-14 bg-gradient-to-r from-amber-400 to-orange-500 rounded-r-lg shadow-lg relative">
                    {/* 本の背表紙 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-r-lg"></div>
                    
                    {/* 本の端 */}
                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-amber-600 to-orange-700 rounded-l-sm"></div>
                    
                    {/* ページの端 */}
                    <div className="absolute right-0 top-0.5 w-0.5 h-13 bg-white/40 rounded-r-sm"></div>
                    <div className="absolute right-0.5 top-1 w-0.5 h-12 bg-white/30 rounded-r-sm"></div>
                    
                    {/* しおり */}
                    <div className="absolute left-0.5 top-1 w-0.5 h-6 bg-red-500 rounded-full"></div>
                    
                    {/* 本のタイトル部分 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap">
                        T
                      </div>
                    </div>
                  </div>
                  
                  {/* 影 */}
                  <div className="absolute top-1 left-1 w-12 h-14 bg-amber-900/30 rounded-r-lg -z-10"></div>
                </div>
                <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2 font-serif">
                  TORISETSU
                </h2>
                <p className="text-lg text-amber-700 dark:text-amber-300 font-serif italic">
                  見る、撮る、できあがり
                </p>
              </div>

              {/* 目次風機能説明 */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-4 font-serif border-b border-amber-300/50 dark:border-amber-600/50 pb-2">
                  目次
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-amber-100/50 dark:bg-amber-800/30 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center">1</span>
                      <span className="text-amber-900 dark:text-amber-100 font-medium">画面操作を録画</span>
                    </div>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">...03</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-amber-100/50 dark:bg-amber-800/30 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center">2</span>
                      <span className="text-amber-900 dark:text-amber-100 font-medium">TORISETSU AIが自動生成</span>
                    </div>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">...07</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-amber-100/50 dark:bg-amber-800/30 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-full bg-yellow-600 text-white text-sm font-bold flex items-center justify-center">3</span>
                      <span className="text-amber-900 dark:text-amber-100 font-medium">簡単共有・編集</span>
                    </div>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">...11</span>
                  </div>
                </div>
              </div>

              {/* フッター（本の奥付風） */}
              <div className="text-center pt-4 border-t border-amber-300/50 dark:border-amber-600/50">
                <p className="text-amber-700 dark:text-amber-300 font-serif text-sm">
                  <span className="font-semibold">簡単トリセツ作成</span>
                </p>
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-mono">
                  発行: {new Date().getFullYear()}年
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;