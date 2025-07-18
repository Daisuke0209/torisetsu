import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeftIcon, 
  UploadIcon, 
  FileIcon, 
  CheckCircleIcon,
  AlertCircleIcon
} from '../components/ui/Icons';
import Header from '../components/ui/Header';
import './VideoUpload.css';

interface UploadResponse {
  filename: string;
  file_path: string;
  original_filename: string;
  file_size: number;
}

interface LocationState {
  projectId?: string;
  projectName?: string;
  torisetsuId?: string;
  torisetsuName?: string;
}

const VideoUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<UploadResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

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
    setError('');
    setSuccess(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
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
      setError('サポートされていないファイル形式です。MP4、WebM、AVI、MOVのみ対応しています。');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

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

      setSuccess(response.data);
      setSelectedFile(null);
      
      // ファイル入力をリセット
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">動画ファイルをアップロード</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {success ? (
                // アップロード完了後は簡潔な表示のみ
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center space-x-3">
                    <CheckCircleIcon size={32} className="text-green-600 dark:text-green-400" />
                    <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">
                      アップロード完了
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-foreground">
                      {success.original_filename}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(success.file_size)}
                    </p>
                  </div>
                  
                  <Button 
                    size="lg"
                    className="w-full max-w-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => navigate('/manual/create', { 
                      state: { 
                        videoPath: success.file_path,
                        torisetsuId: state?.torisetsuId,
                        torisetsuName: state?.torisetsuName,
                      } 
                    })}
                  >
                    マニュアルを作成
                  </Button>
                </div>
              ) : (
                // アップロード前の通常表示
                <>
                  {/* ドラッグ&ドロップエリア */}
                  <div className="relative">
                    <input
                      id="file-input"
                      type="file"
                      accept=".mp4,.webm,.avi,.mov,video/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label 
                      htmlFor="file-input" 
                      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                        isDragOver 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
                          : selectedFile 
                          ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10 dark:border-green-700' 
                          : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-600/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {isDragOver ? (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center animate-pulse">
                            <UploadIcon size={32} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="font-semibold text-blue-600 dark:text-blue-400 text-lg">
                              ここにドロップ
                            </p>
                            <p className="text-sm text-blue-500 dark:text-blue-300">
                              動画ファイルをドロップしてアップロード
                            </p>
                          </div>
                        </div>
                      ) : selectedFile ? (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
                            <FileIcon size={32} className="text-green-600" />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="font-semibold text-green-700 dark:text-green-300 max-w-sm truncate px-2">
                              {selectedFile.name}
                            </p>
                            <div className="flex items-center justify-center space-x-3">
                              <span className="text-sm text-green-600 dark:text-green-400">
                                {formatFileSize(selectedFile.size)}
                              </span>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                {selectedFile.type.split('/')[1].toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-green-600/70 dark:text-green-400/70">
                              ファイルを変更するにはクリック
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadIcon size={48} className="text-slate-400 dark:text-slate-500 mb-4" />
                          <p className="mb-2 text-sm text-slate-900 dark:text-white">
                            <span className="font-semibold">クリックしてアップロード</span> または ドラッグ&ドロップ
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">MP4, WebM, AVI, MOV (最大100MB)</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">アップロード中...</span>
                        <span className="font-medium text-slate-900 dark:text-white">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                      <AlertCircleIcon size={20} />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => navigate(state?.torisetsuId ? `/torisetsu/${state.torisetsuId}` : '/')}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {uploading ? (
                        <>アップロード中...</>
                      ) : (
                        <>
                          <UploadIcon size={16} />
                          アップロード
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VideoUpload;