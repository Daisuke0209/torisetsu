import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import { Project } from '../types';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import {
  AlertCircleIcon
} from '../components/ui/Icons';
import Header from '../components/ui/Header';
import './ManualCreate.css';

interface LocationState {
  videoPath?: string;
  projectId?: string;
  projectName?: string;
}

const ManualCreate: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // プロジェクト詳細画面から来た場合の初期設定
    if (state?.projectId) {
      setSelectedProject(state.projectId);
    } else if (projects.length > 0 && !selectedProject) {
      // デフォルトワークスペースを設定
      setSelectedProject(projects[0].id);
    }
  }, [state?.projectId, projects, selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await client.get('/api/projects/');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setError('プロジェクトの取得に失敗しました');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // プロジェクトIDの確認（事前選択または選択されたもの）
    const projectId = state?.projectId || selectedProject;
    
    if (!projectId || !title) {
      setError('プロジェクトとタイトルを入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await client.post('/api/manuals', {
        project_id: projectId,
        title,
        video_file_path: state?.videoPath || null,
        status: 'processing',
        version: '1.0'
      });

      // 動画ファイルがある場合は自動で生成処理を開始
      if (state?.videoPath) {
        try {
          await client.post(`/api/manuals/${response.data.id}/generate`);
          
          // 生成開始の成功通知
          toast.success(
            `マニュアル「${title}」の生成を開始しました`,
            {
              duration: 4000,
              icon: '🚀',
            }
          );
        } catch (generateError) {
          console.error('Failed to start manual generation:', generateError);
          
          // 生成開始失敗の通知
          toast.error(
            'マニュアルの自動生成開始に失敗しました。手動で生成してください。',
            {
              duration: 5000,
              icon: '⚠️',
            }
          );
        }
      } else {
        // 手動マニュアル作成の場合
        toast.success(
          `マニュアル「${title}」を作成しました`,
          {
            duration: 3000,
            icon: '📝',
          }
        );
      }

      // プロジェクト詳細画面に遷移（生成中状態をフラグで通知）
      navigate(`/project/${projectId}`, { 
        state: { 
          newManualCreated: true,
          manualId: response.data.id 
        } 
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'マニュアルの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">新規マニュアル作成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {state?.videoPath && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* ヘッダー部分 */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">アップロード動画</p>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200">
                                MP4
                              </span>
                              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate max-w-xs">
                                {state.videoPath.split('/').pop()?.replace(/\.[^/.]+$/, "")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 動画プレビュー */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          <video 
                            className="w-full h-64 object-cover rounded-xl border-2 border-white/50 dark:border-slate-700/50 shadow-xl"
                            preload="metadata"
                            muted
                            controls
                            poster=""
                          >
                            <source 
                              src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/uploads/${state.videoPath.split('/').pop()}#t=1`} 
                              type="video/mp4" 
                            />
                            動画を再生できません
                          </video>
                        </div>
                      </div>
                      
                      {/* 確認メッセージ */}
                      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                        <div className="flex items-start space-x-3">
                          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              動画の内容をご確認ください
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              この動画を基に自動でマニュアルが生成されます。内容に問題がなければ、下記のタイトルを入力してマニュアル作成を開始してください。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* プロジェクト選択 */}
                {!state?.projectId && (
                  <div className="space-y-2">
                    <label htmlFor="project" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      プロジェクト <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="project"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white"
                    >
                      <option value="">プロジェクトを選択</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* マニュアルタイトル */}
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    マニュアルタイトル <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: ユーザー登録機能の操作マニュアル"
                    required
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  />
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                    <AlertCircleIcon size={20} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? '作成中...' : 'マニュアルを作成'}
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

export default ManualCreate;