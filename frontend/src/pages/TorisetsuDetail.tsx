import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import client from '../api/client';
import { Torisetsu, Manual, ManualStatus } from '../types';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import Input from '../components/ui/Input';
import { 
  FileTextIcon,
  CalendarIcon,
  UploadIcon,
  TrashIcon,
  LoaderIcon,
  BookOpenIcon,
  ArrowLeftIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from '../components/ui/Icons';
import Header from '../components/ui/Header';
import { getStatusColor, getStatusText } from '../lib/status-colors';

const TorisetsuDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const { } = useLanguage();
  const [torisetsu, setTorisetsu] = useState<Torisetsu | null>(null);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showManualDeleteModal, setShowManualDeleteModal] = useState(false);
  const [deletingManual, setDeletingManual] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<Manual | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const previousManualsRef = useRef<Manual[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [creatingManual, setCreatingManual] = useState(false);

  const fetchTorisetsuData = React.useCallback(async () => {
    try {
      // トリセツ情報を取得
      const torisetsuResponse = await client.get(`/api/torisetsu/detail/${id}`);
      const torisetsuData = torisetsuResponse.data;
      setTorisetsu(torisetsuData);
      
      // マニュアル一覧を取得
      const manualsResponse = await client.get(`/api/manuals/torisetsu/${id}`);
      setManuals(manualsResponse.data);
      return manualsResponse.data;
    } catch (error: any) {
      console.error('Failed to fetch torisetsu data:', error);
      
      let errorMessage = 'トリセツの読み込みに失敗しました';
      if (error.response?.status === 404) {
        errorMessage = 'トリセツが見つかりません';
      } else if (error.response?.status === 403) {
        errorMessage = 'このトリセツにアクセスする権限がありません';
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
  }, [id]);

  useEffect(() => {
    fetchTorisetsuData();
  }, [id, fetchTorisetsuData]);

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
        const manualsResponse = await client.get(`/api/manuals/torisetsu/${id}`);
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

  const handleEditName = () => {
    if (torisetsu) {
      setEditingName(torisetsu.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (!torisetsu || !editingName.trim()) return;
    
    setSavingName(true);
    try {
      const response = await client.put(`/api/torisetsu/${torisetsu.id}`, {
        name: editingName.trim()
      });
      
      setTorisetsu(response.data);
      setIsEditingName(false);
      toast.success('トリセツ名を更新しました');
    } catch (error: any) {
      console.error('Failed to update torisetsu name:', error);
      toast.error(error.response?.data?.detail || 'トリセツ名の更新に失敗しました');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  // Video upload functions
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'];
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'サポートされていないファイル形式です。MP4、WebM、AVI、MOVのみ対応しています。';
    }
    if (file.size > MAX_SIZE) {
      return `ファイルサイズが大きすぎます。最大${MAX_SIZE / 1024 / 1024}MBまでです。`;
    }
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    setUploadError('');
    
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => ALLOWED_TYPES.some(type => file.type === type));
    
    if (videoFile) {
      handleFile(videoFile);
    } else if (files.length > 0) {
      setUploadError('サポートされていないファイル形式です。MP4、WebM、AVI、MOVのみ対応しています。');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !torisetsu) return;

    setUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('torisetsu_id', torisetsu.id);

      const response = await client.post('/api/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      toast.success('動画をアップロードしました！', {
        duration: 3000,
        icon: '🎥',
      });
      
      // アップロードした動画のパスを保存してタイトル入力画面へ
      setUploadedVideoPath(response.data.file_path);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCreateManual = async () => {
    if (!uploadedVideoPath || !manualTitle.trim() || !torisetsu) return;

    setCreatingManual(true);
    setUploadError('');

    try {
      // マニュアルを作成
      const response = await client.post('/api/manuals', {
        torisetsu_id: torisetsu.id,
        title: manualTitle.trim(),
        video_file_path: uploadedVideoPath,
        status: 'processing',
        version: '1.0'
      });

      // 自動生成を開始
      try {
        await client.post(`/api/manuals/${response.data.id}/generate`);
        
        toast.success(
          `マニュアル「${manualTitle}」の生成を開始しました`,
          {
            duration: 4000,
            icon: '🚀',
          }
        );
      } catch (generateError) {
        console.error('Failed to start manual generation:', generateError);
        
        toast.error(
          'マニュアルの自動生成開始に失敗しました。手動で生成してください。',
          {
            duration: 5000,
            icon: '⚠️',
          }
        );
      }

      // モーダルを閉じて画面を更新
      setShowUploadModal(false);
      setUploadedVideoPath(null);
      setManualTitle('');
      setUploadError('');
      
      // マニュアル一覧を更新
      fetchTorisetsuData();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'マニュアルの作成に失敗しました');
    } finally {
      setCreatingManual(false);
    }
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
              <Button variant="outline" onClick={() => navigate(-1)} className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                戻る
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

  if (!torisetsu) {
    return <div>トリセツが見つかりません</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header onLogoClick={() => navigate('/')} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/project/${torisetsu.project_id}`)}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeftIcon size={16} />
            <span>プロジェクトに戻る</span>
          </Button>
        </div>

        <div className="mb-8">
          {/* トリセツ情報 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-lg">
                <BookOpenIcon size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="text-2xl font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <Button
                      onClick={handleSaveName}
                      disabled={savingName || !editingName.trim()}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {savingName ? (
                        <LoaderIcon size={16} className="animate-spin" />
                      ) : (
                        <SaveIcon size={16} />
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                    >
                      <XIcon size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{torisetsu.name}</h1>
                    <Button
                      onClick={handleEditName}
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      <EditIcon size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={() => setShowUploadModal(true)}
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
                onClick={() => setShowUploadModal(true)}
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

      {/* Video Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl shadow-blue-500/10" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  {uploadedVideoPath ? <FileTextIcon size={16} className="text-blue-600 dark:text-blue-400" /> : <UploadIcon size={16} className="text-blue-600 dark:text-blue-400" />}
                </div>
                <span>{uploadedVideoPath ? 'マニュアル作成' : '動画アップロード'}</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {!uploadedVideoPath ? (
                <>
              {/* ドラッグ&ドロップエリア */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                      <CheckCircleIcon size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        const fileInput = document.getElementById('file-input') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                    >
                      別のファイルを選択
                    </Button>
                  </div>
                ) : (
                  <>
                    <UploadIcon size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <p className="font-medium text-slate-900 dark:text-white mb-2">
                      動画ファイルをドラッグ&ドロップ
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      または
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      ファイルを選択
                    </Button>
                  </>
                )}
              </div>

              {/* エラー表示 */}
              {uploadError && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircleIcon size={20} className="text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-300">{uploadError}</p>
                </div>
              )}

              {/* プログレスバー */}
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                    アップロード中... {uploadProgress}%
                  </p>
                </div>
              )}

              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>• 対応形式: MP4, WebM, AVI, MOV</p>
                <p>• 最大サイズ: 100MB</p>
              </div>
                </>
              ) : (
                <>
                  {/* マニュアル作成フォーム */}
                  <div className="space-y-4">
                    {/* 動画プレビュー */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <CheckCircleIcon size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">動画アップロード完了</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{uploadedVideoPath?.split('/').pop()}</p>
                          </div>
                        </div>
                        
                        {/* 動画プレイヤー */}
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative">
                            <video 
                              className="w-full h-80 object-cover rounded-xl border-2 border-white/50 dark:border-slate-700/50 shadow-xl"
                              preload="metadata"
                              controls
                              muted
                            >
                              <source 
                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/uploads/${uploadedVideoPath?.split('/').pop()}#t=1`} 
                                type="video/mp4" 
                              />
                              動画を再生できません
                            </video>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* タイトル入力 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        マニュアルタイトル <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="例: ユーザー登録機能の操作マニュアル"
                        required
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                      />
                    </div>

                    {/* エラー表示 */}
                    {uploadError && (
                      <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircleIcon size={20} className="text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-800 dark:text-red-300">{uploadError}</p>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        マニュアル作成を開始すると、AIが動画内容を分析して自動的にステップバイステップのマニュアルを生成します。
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            
            <CardContent className="flex justify-end space-x-2 pt-0">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadError('');
                  setUploadedVideoPath(null);
                  setManualTitle('');
                  const fileInput = document.getElementById('file-input') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                disabled={uploading || creatingManual}
              >
                キャンセル
              </Button>
              {!uploadedVideoPath ? (
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <LoaderIcon size={16} className="animate-spin" />
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <UploadIcon size={16} />
                      アップロード
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateManual}
                  disabled={!manualTitle.trim() || creatingManual}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingManual ? (
                    <>
                      <LoaderIcon size={16} className="animate-spin" />
                      作成中...
                    </>
                  ) : (
                    <>
                      <FileTextIcon size={16} />
                      マニュアル作成
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TorisetsuDetail;