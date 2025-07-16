import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import { Project, Manual, ManualStatus } from '../types';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { 
  FileTextIcon,
  CalendarIcon,
  UploadIcon,
  TrashIcon,
  LoaderIcon,
  LogOutIcon,
  FolderIcon
} from '../components/ui/Icons';
import Header from '../components/ui/Header';
import { getStatusColor, getStatusText } from '../lib/status-colors';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showManualDeleteModal, setShowManualDeleteModal] = useState(false);
  const [deletingManual, setDeletingManual] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<Manual | null>(null);
  const previousManualsRef = useRef<Manual[]>([]);

  const fetchProjectData = async () => {
    try {
      // プロジェクト情報を取得
      const projectResponse = await client.get(`/api/projects/detail/${id}`);
      const projectData = projectResponse.data;
      setProject(projectData);
      
      // マニュアル一覧を取得
      const manualsResponse = await client.get(`/api/manuals/project/${id}`);
      setManuals(manualsResponse.data);
      return manualsResponse.data;
    } catch (error: any) {
      console.error('Failed to fetch project data:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'プロジェクトの読み込みに失敗しました';
      if (error.response?.status === 404) {
        errorMessage = 'プロジェクトが見つかりません';
      } else if (error.response?.status === 403) {
        errorMessage = 'このプロジェクトにアクセスする権限がありません';
      } else if (error.response?.status === 500) {
        errorMessage = 'サーバーエラーが発生しました';
      } else if (!error.response) {
        errorMessage = 'サーバーに接続できません';
      }
      
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]); // fetchProjectDataはstableな関数なので依存配列に含めない

  // ステータス変化を検知してトースト通知を表示
  useEffect(() => {
    if (previousManualsRef.current.length === 0) {
      previousManualsRef.current = manuals;
      return;
    }

    const previousManuals = previousManualsRef.current;
    
    // 生成完了したマニュアルを検出
    manuals.forEach(currentManual => {
      const previousManual = previousManuals.find(m => m.id === currentManual.id);
      
      if (previousManual && 
          previousManual.status === 'processing' && 
          currentManual.status === 'completed') {
        
        toast.success(
          `マニュアル「${currentManual.title}」の生成が完了しました！`,
          {
            duration: 5000,
            icon: '✅',
          }
        );
      }
      
      // 生成失敗の場合
      if (previousManual && 
          previousManual.status === 'processing' && 
          currentManual.status === 'failed') {
        
        toast.error(
          `マニュアル「${currentManual.title}」の生成に失敗しました`,
          {
            duration: 6000,
            icon: '❌',
          }
        );
      }
    });

    previousManualsRef.current = manuals;
  }, [manuals]);

  // ポーリング用のuseEffect - 生成中のマニュアルがある場合のみ実行
  useEffect(() => {
    const hasProcessingManuals = manuals.some(manual => manual.status === 'processing');
    
    if (!hasProcessingManuals) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const manualsResponse = await client.get(`/api/manuals/project/${id}`);
        const updatedManuals = manualsResponse.data;
        setManuals(updatedManuals);
        
        // すべてのマニュアルが生成完了している場合はポーリングを停止
        const stillProcessing = updatedManuals.some((manual: Manual) => manual.status === 'processing');
        if (!stillProcessing) {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to poll manual status:', error);
      }
    }, 3000); // 3秒間隔でポーリング

    return () => clearInterval(pollInterval);
  }, [id, manuals]);



  const handleDeleteProject = async () => {
    if (!project) return;
    
    setDeleting(true);
    try {
      await client.delete(`/api/projects/${project.id}`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      alert(error.response?.data?.detail || 'プロジェクトの削除に失敗しました');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteManual = async () => {
    if (!manualToDelete) return;
    
    const manualTitle = manualToDelete.title;
    setDeletingManual(true);
    try {
      await client.delete(`/api/manuals/${manualToDelete.id}`);
      // マニュアル一覧から削除したマニュアルを除外
      setManuals(manuals.filter(m => m.id !== manualToDelete.id));
      
      // 削除成功の通知
      toast.success(
        `マニュアル「${manualTitle}」を削除しました`,
        {
          duration: 3000,
          icon: '🗑️',
        }
      );
    } catch (error: any) {
      console.error('Failed to delete manual:', error);
      
      // 削除失敗の通知
      toast.error(
        error.response?.data?.detail || 'マニュアルの削除に失敗しました',
        {
          duration: 4000,
          icon: '❌',
        }
      );
    } finally {
      setDeletingManual(false);
      setShowManualDeleteModal(false);
      setManualToDelete(null);
    }
  };

  const handleShowManualDeleteModal = (manual: Manual, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setManualToDelete(manual);
    setShowManualDeleteModal(true);
  };

  const renderManualCardContent = (manual: Manual, isProcessing: boolean) => (
    <>
      {/* 動画サムネイル */}
      {manual.video_file_path && (
        <video 
          className="w-full h-40 object-cover rounded-t-lg"
          preload="metadata"
          muted
        >
          <source 
            src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/uploads/${manual.video_file_path.split('/').pop()}#t=1`} 
            type="video/mp4" 
          />
        </video>
      )}

      <CardHeader className={manual.video_file_path ? "pb-2" : ""}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${getStatusColor(manual.status).container}`}>
              {manual.status === ManualStatus.PROCESSING ? (
                <LoaderIcon size={16} className="text-blue-600 dark:text-blue-400 animate-spin" />
              ) : manual.status === 'completed' ? (
                <FileTextIcon size={16} className="text-green-600 dark:text-green-400" />
              ) : (
                <FileTextIcon size={16} className="text-slate-600 dark:text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-slate-900 dark:text-white">
                {manual.title}
              </CardTitle>
              <Badge variant={getStatusColor(manual.status).variant} className={`mt-1 text-xs ${getStatusColor(manual.status).badge.border} ${getStatusColor(manual.status).badge.text} ${getStatusColor(manual.status).badge.bg} ${getStatusColor(manual.status).badge.hover}`}>
                {getStatusText(manual.status)}
              </Badge>
            </div>
          </div>
          {!isProcessing && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              onClick={(e) => handleShowManualDeleteModal(manual, e)}
            >
              <TrashIcon size={16} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center text-xs text-slate-500 dark:text-slate-500">
          <div className="flex items-center space-x-1">
            <CalendarIcon size={12} />
            <span>
              {new Date(manual.created_at).toLocaleDateString('ja-JP')}
            </span>
          </div>
        </div>
      </CardContent>
    </>
  );


  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-blue-500/10 border-0">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-slate-700 dark:text-slate-300">{error}</p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                ダッシュボードに戻る
              </Button>
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                再読み込み
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return <div>プロジェクトが見つかりません</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header onLogoClick={() => navigate('/')} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        <div className="mb-8">
          {/* プロジェクト情報 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-lg">
                <FolderIcon size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
                {project.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <Button 
              onClick={() => navigate('/upload', {
                state: {
                  projectId: id,
                  projectName: project?.name,
                }
              })}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <UploadIcon size={16} />
              動画アップロード
            </Button>
          </div>
        </div>

        {manuals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manuals.map((manual) => {
              const isProcessing = manual.status === ManualStatus.PROCESSING;
              
              if (isProcessing) {
                return (
                  <div 
                    key={manual.id} 
                    className="group block cursor-not-allowed"
                  >
                    <Card className="h-full transition-all duration-200 border-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-lg opacity-75 cursor-not-allowed">
                      {renderManualCardContent(manual, true)}
                    </Card>
                  </div>
                );
              }
              
              return (
                <Link 
                  key={manual.id} 
                  to={`/manual/${manual.id}`}
                  className="group block"
                >
                  <Card className="h-full transition-all duration-200 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl shadow-blue-500/10 hover:shadow-lg hover:-translate-y-1">
                    {renderManualCardContent(manual, false)}
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <FileTextIcon size={32} className="text-slate-500 dark:text-slate-400" />
              </div>
              <CardTitle className="mb-2 text-slate-900 dark:text-white">マニュアルがありません</CardTitle>
              <CardDescription className="mb-6 max-w-md text-slate-600 dark:text-slate-400">
                動画をアップロードしてマニュアルを作成しましょう
              </CardDescription>
              <Button 
                onClick={() => navigate('/upload', {
                  state: {
                    projectId: id,
                    projectName: project?.name,
                  }
                })}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <UploadIcon size={16} />
                動画アップロードから作成
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Manual Delete Confirmation Modal */}
      {showManualDeleteModal && manualToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl shadow-blue-500/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrashIcon size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <span>マニュアルを削除</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                この操作は取り消すことができません。マニュアルの内容が完全に削除されます。
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-300">
                  <strong>削除されるマニュアル:</strong> {manualToDelete.title}
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  <strong>ステータス:</strong> {getStatusText(manualToDelete.status as ManualStatus)}
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  <strong>バージョン:</strong> v{manualToDelete.version}
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  <strong>作成日:</strong> {new Date(manualToDelete.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </CardContent>
            
            <CardContent className="flex justify-end space-x-2 pt-0">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowManualDeleteModal(false);
                  setManualToDelete(null);
                }}
                disabled={deletingManual}
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleDeleteManual}
                disabled={deletingManual}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <TrashIcon size={16} />
                {deletingManual ? '削除中...' : '削除する'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Delete Confirmation Modal */}
      {showDeleteModal && project && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl shadow-blue-500/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrashIcon size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <span>プロジェクトを削除</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                この操作は取り消すことができません。プロジェクト内のすべてのマニュアルも削除されます。
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-300">
                  <strong>削除されるプロジェクト:</strong> {project.name}
                </p>
                {project.description && (
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {project.description}
                  </p>
                )}
                <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                  <strong>マニュアル数:</strong> {manuals.length}件
                </p>
              </div>
            </CardContent>
            
            <CardContent className="flex justify-end space-x-2 pt-0">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleDeleteProject}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <TrashIcon size={16} />
                {deleting ? '削除中...' : '削除する'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;