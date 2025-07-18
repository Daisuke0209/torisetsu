import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  ArrowLeftIcon,
  FileTextIcon
} from '../components/ui/Icons';
import Header from '../components/ui/Header';

const TorisetsuCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { } = useAuth();
  
  const { projectId, projectName } = location.state || {};
  
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('トリセツ名を入力してください');
      return;
    }

    if (!projectId) {
      toast.error('プロジェクトIDが見つかりません');
      return;
    }

    setCreating(true);

    try {
      const response = await client.post('/api/torisetsu/', {
        project_id: projectId,
        name: name.trim()
      });

      toast.success('トリセツを作成しました');
      
      // プロジェクト詳細画面に戻る
      navigate(`/project/${projectId}`);
      
    } catch (error: any) {
      console.error('Failed to create torisetsu:', error);
      const errorMessage = error.response?.data?.detail || 'トリセツの作成に失敗しました';
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Header onLogoClick={() => navigate('/')} />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl shadow-blue-500/10">
              <CardContent className="p-8 text-center">
                <p className="text-red-600 dark:text-red-400">プロジェクトIDが見つかりません</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="mt-4"
                  variant="outline"
                >
                  <ArrowLeftIcon size={16} />
                  ダッシュボードに戻る
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header onLogoClick={() => navigate('/')} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              onClick={() => navigate(`/project/${projectId}`)}
              variant="ghost"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeftIcon size={16} />
              {projectName || 'プロジェクト'}に戻る
            </Button>
          </div>

          {/* Create Form */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl shadow-blue-500/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-slate-900 dark:text-white">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <FileTextIcon size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span>新しいトリセツを作成</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                トリセツを作成してマニュアルを整理しましょう
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    トリセツ名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: ユーザー登録手順"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/project/${projectId}`)}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        作成中...
                      </>
                    ) : (
                      <>
                        <FileTextIcon size={16} />
                        作成
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TorisetsuCreate;