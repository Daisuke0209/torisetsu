import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { 
  FileTextIcon, 
  RefreshIcon,
  AlertCircleIcon,
  ClockIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  PlusIcon,
  TrashIcon,
  ShareIcon,
  CopyIcon
} from '../components/ui/Icons';
import Header from '../components/ui/Header';
import { getStatusColor } from '../lib/status-colors';
import { ManualStatus } from '../types';
import './ManualEditor.css';

interface Manual {
  id: number;
  title: string;
  content: any;
  status: ManualStatus;
  video_file_path?: string;
  audio_file_path?: string;
  project_id: number;
  version?: string;
  created_at?: string;
  updated_at?: string;
}

interface ManualContent {
  title: string;
  overview: string;
  prerequisites: string;
  steps: Array<{
    title: string;
    action: string;
    screen: string;
    notes: string;
    verification: string;
    time?: string;
  }>;
  troubleshooting: string;
  additional_info: string;
  raw_content: string;
}

const ManualEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manual, setManual] = useState<Manual | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<ManualContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);


  // シェア機能
  const handleCreateShare = async () => {
    if (!manual) return;
    
    setShareLoading(true);
    try {
      const response = await client.post(`/api/manuals/${manual.id}/share`, {
        expires_in_days: 7
      });
      
      const fullUrl = `${window.location.origin}/share/${response.data.share_token}`;
      setShareUrl(fullUrl);
      
      // クリップボードにコピー
      await navigator.clipboard.writeText(fullUrl);
      toast.success('共有URLを作成しました！', {
        duration: 4000,
        icon: '🔗',
      });
    } catch (error) {
      console.error('シェア作成に失敗しました:', error);
      toast.error('共有URLの作成に失敗しました', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('URLをコピーしました！', {
        duration: 3000,
        icon: '📋',
      });
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      toast.error('URLのコピーに失敗しました', {
        duration: 4000,
        icon: '❌',
      });
    }
  };


  // 現在の動画時間に基づいて現在のステップを取得
  const getCurrentStep = (currentTime: number) => {
    if (!manual?.content || typeof manual.content !== 'object') return null;
    
    const content = manual.content as ManualContent;
    const steps = content.steps || [];
    
    // 時間が設定されているステップのみを対象とし、時間順にソート
    const stepsWithTime = steps
      .map((step, index) => ({ ...step, originalIndex: index }))
      .filter(step => step.time)
      .sort((a, b) => parseTimeToSeconds(a.time!) - parseTimeToSeconds(b.time!));
    
    if (stepsWithTime.length === 0) return null;
    
    // 現在時間に最も近い（かつ現在時間以前の）ステップを見つける
    let currentStep = null;
    for (let i = 0; i < stepsWithTime.length; i++) {
      const stepTime = parseTimeToSeconds(stepsWithTime[i].time!);
      if (stepTime <= currentTime) {
        currentStep = stepsWithTime[i];
      } else {
        break;
      }
    }
    
    return currentStep;
  };


  useEffect(() => {
    const fetchManual = async () => {
      try {
        const response = await client.get(`/api/manuals/detail/${id}`);
        const manualData = response.data;
        setManual(manualData);


      } catch (err: any) {
        setError(err.response?.data?.detail || 'マニュアルの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    const checkManualStatus = async () => {
      try {
        const response = await client.get(`/api/manuals/${id}/status`);
        if (response.data.status !== manual?.status) {
          fetchManual(); // Refresh full manual data
        }
      } catch (err) {
        console.error('Failed to check manual status:', err);
      }
    };

    if (id) {
      fetchManual();
      // Poll for status updates if manual is processing
      const interval = setInterval(() => {
        if (manual?.status === ManualStatus.PROCESSING) {
          checkManualStatus();
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [id, manual?.status]);

  const handleGenerateManual = useCallback(async () => {
    if (!manual?.video_file_path) {
      setError('動画ファイルが関連付けられていません');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      await client.post(`/api/manuals/${id}/generate`);
      setManual(prev => prev ? { ...prev, status: ManualStatus.PROCESSING } : null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'マニュアル生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  }, [manual?.video_file_path, id]);

  useEffect(() => {
    // Check if we need to start generation automatically
    if (manual && manual.video_file_path && !manual.content && manual.status === ManualStatus.DRAFT) {
      handleGenerateManual();
    }
  }, [manual, handleGenerateManual]);

  const handleStartEdit = () => {
    if (manual?.content && typeof manual.content === 'object') {
      setEditedContent({ ...manual.content });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(null);
  };

  const handleSaveEdit = async () => {
    if (!editedContent || !manual) return;

    setSaving(true);
    setError('');

    try {
      // 保存前にステップを時間順にソート
      const sortedSteps = [...editedContent.steps].sort((a, b) => {
        const timeA = parseTimeToSeconds(a.time || '');
        const timeB = parseTimeToSeconds(b.time || '');
        
        // 時間が設定されていないものは最後に
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        
        return timeA - timeB;
      });

      const sortedContent = { ...editedContent, steps: sortedSteps };

      await client.put(`/api/manuals/${id}`, {
        title: manual.title,
        content: sortedContent,
        status: manual.status,
        version: manual.version || '1.0'
      });

      // マニュアル情報を更新
      setManual(prev => prev ? { ...prev, content: sortedContent } : null);
      setIsEditing(false);
      setEditedContent(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'マニュアルの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    if (!editedContent) return;

    const newSteps = [...editedContent.steps];
    
    if (field === 'time' && value) {
      // 時間のバリデーション
      const seconds = parseTimeToSeconds(value);
      
      // 0:00から動画の最大時間までの範囲をチェック
      if (seconds < 0 || (videoDuration > 0 && seconds > videoDuration)) {
        return; // 無効な値は受け付けない
      }
    }
    
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditedContent({ ...editedContent, steps: newSteps });
  };

  const handleAddStep = () => {
    if (!editedContent) return;
    
    const newStep = {
      title: '',
      action: '',
      screen: '',
      notes: '',
      verification: '',
      time: ''
    };
    
    const newSteps = [...editedContent.steps, newStep];
    setEditedContent({ ...editedContent, steps: newSteps });
  };

  const handleDeleteStep = (index: number) => {
    if (!editedContent) return;
    
    const newSteps = editedContent.steps.filter((_, i) => i !== index);
    setEditedContent({ ...editedContent, steps: newSteps });
  };






  const parseTimeToSeconds = (timeString: string): number => {
    // "0:15", "1:30", "2:45" などの形式を秒に変換
    if (!timeString || timeString.trim() === '') return 0;
    
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  const formatSecondsToTime = (totalSeconds: number): string => {
    // 秒を "mm:ss" 形式に変換
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeClick = (timeString: string) => {
    if (videoRef && timeString) {
      const seconds = parseTimeToSeconds(timeString);
      videoRef.currentTime = seconds;
      // 動画が一時停止している場合は再生開始
      if (videoRef.paused) {
        videoRef.play();
      }
    }
  };

  const renderManualContent = (content: ManualContent) => {
    const currentContent = isEditing ? editedContent : content;
    if (!currentContent) return null;

    return (
      <div className="space-y-6">
        {/* 操作手順のみ表示 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">操作手順</h3>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="text-xs"
                >
                  <EditIcon size={14} />
                  編集
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddStep}
                    className="text-xs"
                    disabled={saving}
                  >
                    <PlusIcon size={14} />
                    ステップ追加
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-xs"
                    disabled={saving}
                  >
                    <XIcon size={14} />
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                  >
                    <SaveIcon size={14} />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {currentContent.steps.map((step, index) => (
              <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors group ${
                currentStepIndex === index 
                  ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' 
                  : 'border-border bg-card hover:bg-muted/50'
              }`}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    {isEditing ? (
                      <div className="flex flex-col space-y-3 flex-1">
                        <Input
                          type="text"
                          value={step.title.replace(/^ステップ\d+:\s*/, '')}
                          onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                          className="text-sm font-medium bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 w-full"
                          placeholder="ステップのタイトル"
                        />
                        <textarea
                          value={step.action}
                          onChange={(e) => handleStepChange(index, 'action', e.target.value)}
                          className="w-full min-h-[60px] text-sm bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 resize-none text-slate-900 dark:text-white"
                          placeholder="操作の説明"
                          rows={3}
                        />
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 relative">
                            <div 
                              className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full cursor-pointer relative"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percentage = x / rect.width;
                                const seconds = Math.round(percentage * (videoDuration || 100));
                                const timeString = formatSecondsToTime(seconds);
                                handleStepChange(index, 'time', timeString);
                                
                                if (videoRef) {
                                  videoRef.currentTime = seconds;
                                }
                              }}
                            >
                              {/* プログレスバー */}
                              <div 
                                className="absolute top-0 left-0 h-full bg-amber-500 rounded-full transition-all duration-150"
                                style={{ 
                                  width: `${(parseTimeToSeconds(step.time || '0:00') / (videoDuration || 100)) * 100}%` 
                                }}
                              />
                              {/* スライダーハンドル */}
                              <div
                                className="absolute top-1/2 w-4 h-4 bg-amber-600 border-2 border-white rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 shadow-lg hover:scale-110 transition-transform duration-150"
                                style={{ 
                                  left: `calc(${(parseTimeToSeconds(step.time || '0:00') / (videoDuration || 100)) * 100}% - 8px)` 
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  if (videoRef && !videoRef.paused) {
                                    videoRef.pause();
                                  }
                                  
                                  const slider = e.currentTarget.parentElement;
                                  if (!slider) return;
                                  
                                  const handleMouseMove = (moveEvent: MouseEvent) => {
                                    const rect = slider.getBoundingClientRect();
                                    const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                                    const percentage = x / rect.width;
                                    const seconds = Math.round(percentage * (videoDuration || 100));
                                    const timeString = formatSecondsToTime(seconds);
                                    handleStepChange(index, 'time', timeString);
                                    
                                    if (videoRef) {
                                      videoRef.currentTime = seconds;
                                    }
                                  };
                                  
                                  const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                  };
                                  
                                  document.addEventListener('mousemove', handleMouseMove);
                                  document.addEventListener('mouseup', handleMouseUp);
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 w-12 text-right">
                            {step.time || '0:00'}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (videoRef) {
                                const currentTime = Math.floor(videoRef.currentTime);
                                const timeString = formatSecondsToTime(currentTime);
                                handleStepChange(index, 'time', timeString);
                              }
                            }}
                            className="text-xs px-2 py-1 h-6"
                            title="現在の動画位置を使用"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-medium text-foreground">
                          {step.title.replace(/^ステップ\d+:\s*/, '')}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {currentStepIndex === index && (
                            <span className="flex items-center space-x-1 px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full border border-amber-200 dark:border-amber-700">
                              <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="3" />
                              </svg>
                              <span>再生中</span>
                            </span>
                          )}
                          {step.time && (
                            <>
                              <button
                                onClick={() => handleTimeClick(step.time!)}
                                className="flex items-center space-x-1 px-2 py-1 text-xs font-mono text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded cursor-pointer transition-colors flex-shrink-0"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                <span>{step.time}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.action}
                    </p>
                  )}
                </div>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStep(index)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="このステップを削除"
                  >
                    <TrashIcon size={12} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };


  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!manual) {
    return <div className="error">マニュアルが見つかりません</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header title={manual.title} onLogoClick={() => navigate('/')} />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="w-full mb-6">
            <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              <AlertCircleIcon size={20} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}


        {/* マニュアル情報 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${getStatusColor(manual.status).container}`}>
                <FileTextIcon size={24} className={
                  manual.status === ManualStatus.PROCESSING 
                    ? 'text-amber-600 dark:text-amber-400'
                    : manual.status === ManualStatus.COMPLETED
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-600 dark:text-slate-400'
                } />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{manual.title}</h1>
              </div>
            </div>
            {/* 共有URL機能 */}
            <div className="flex items-center space-x-2">
              {!shareUrl ? (
                <Button
                  onClick={handleCreateShare}
                  disabled={shareLoading}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 border-amber-600 text-amber-600 hover:bg-amber-50 text-xs"
                >
                  <ShareIcon size={14} />
                  <span>{shareLoading ? '作成中...' : '共有URL作成'}</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleCopyUrl}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1 text-green-600 hover:bg-green-50 border-green-600 text-xs"
                  >
                    <CopyIcon size={14} />
                    <span>URLコピー</span>
                  </Button>
                  <Button
                    onClick={() => setShareUrl(null)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1 text-red-600 hover:bg-red-50 border-red-600 text-xs"
                  >
                    <XIcon size={14} />
                    <span>停止</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
          {/* 左側: 動画プレイヤー */}
          <div className="space-y-6 xl:pl-4">
            {manual.video_file_path && (
              <div className="relative">
                <video 
                  ref={(ref) => {
                    setVideoRef(ref);
                    if (ref) {
                      ref.addEventListener('loadedmetadata', () => {
                        setVideoDuration(ref.duration);
                      });
                      
                      // 動画時間の更新を監視
                      ref.addEventListener('timeupdate', () => {
                        const currentTime = ref.currentTime;
                        
                        // 現在のステップを更新
                        const currentStep = getCurrentStep(currentTime);
                        if (currentStep) {
                          setCurrentStepIndex(currentStep.originalIndex);
                        } else {
                          setCurrentStepIndex(null);
                        }
                      });
                    }
                  }}
                  controls 
                  className="w-full rounded-lg shadow-xl border border-border"
                  style={{ maxHeight: '500px' }}
                >
                  <source 
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/uploads/${manual.video_file_path.split('/').pop()}`} 
                    type="video/mp4" 
                  />
                  お使いのブラウザは動画再生に対応していません。
                </video>
              </div>
            )}
            

            {manual.status === ManualStatus.DRAFT && manual.video_file_path && (
              <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">マニュアル生成</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    動画からAIを使用してマニュアルを自動生成します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateManual}
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {generating ? '生成中...' : 'マニュアルを生成'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {manual.status === ManualStatus.PROCESSING && (
              <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 animate-pulse">
                      <ClockIcon size={32} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">生成中</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-center">
                      AIがマニュアルを生成しています。しばらくお待ちください...
                    </p>
                    <div className="mt-4 flex space-x-1">
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {manual.status === 'failed' && (
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <AlertCircleIcon size={24} className="text-red-600 dark:text-red-400" />
                    <div>
                      <h3 className="font-semibold text-red-800 dark:text-red-300">生成失敗</h3>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        マニュアル生成に失敗しました
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateManual}
                    disabled={generating}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshIcon size={16} />
                    再試行
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側: マニュアル内容 */}
          <div className="space-y-6">
            {manual.status === 'completed' && manual.content && (
              <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
                <CardContent className="pt-6">
                  {typeof manual.content === 'object' ? 
                    renderManualContent(manual.content) : 
                    <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">{manual.content}</pre>
                  }
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManualEditor;