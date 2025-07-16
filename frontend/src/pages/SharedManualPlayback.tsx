import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import { 
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon
} from '../components/ui/Icons';
import './ManualPlayback.css';

interface Manual {
  id: number;
  title: string;
  content: any;
  status: string;
  video_file_path?: string;
  audio_file_path?: string;
  project_id: number;
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

const SharedManualPlayback: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [manual, setManual] = useState<Manual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSharedManual = useCallback(async () => {
    try {
      const response = await client.get(`/api/manuals/shared/${shareToken}`);
      console.log('Shared manual data:', response.data);
      setManual(response.data);
    } catch (error: any) {
      console.error('共有マニュアルの取得に失敗しました:', error);
      if (error.response?.status === 404) {
        setError('共有リンクが見つかりません');
      } else if (error.response?.status === 410) {
        setError('この共有リンクは期限切れです');
      } else {
        setError('共有マニュアルの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchSharedManual();
  }, [fetchSharedManual]);

  const parseTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const formatSecondsToTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentStep = (currentTime: number) => {
    if (!manual?.content || typeof manual.content !== 'object') return null;
    
    const content = manual.content as ManualContent;
    const steps = content.steps || [];
    
    // 時間情報を持つステップのみをフィルタリング
    const stepsWithTime = steps
      .map((step, index) => ({ ...step, originalIndex: index }))
      .filter(step => step.time);
    
    if (stepsWithTime.length === 0) return null;
    
    // 現在の時間に該当するステップを見つける
    for (let i = stepsWithTime.length - 1; i >= 0; i--) {
      const stepTime = parseTimeToSeconds(stepsWithTime[i].time!);
      if (currentTime >= stepTime) {
        return stepsWithTime[i];
      }
    }
    
    return null;
  };

  const jumpToStep = (stepIndex: number) => {
    if (!videoRef.current || !manual?.content) return;
    
    const content = manual.content as ManualContent;
    const step = content.steps[stepIndex];
    if (!step.time) return;

    const seconds = parseTimeToSeconds(step.time);
    videoRef.current.currentTime = seconds;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-center">
          <div className="text-xl mb-4">⚠️</div>
          <div className="text-lg mb-2">{error}</div>
          <div className="text-sm text-gray-400">
            共有リンクが無効または期限切れの可能性があります
          </div>
        </div>
      </div>
    );
  }

  if (!manual) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">マニュアルが見つかりません</div>
      </div>
    );
  }

  if (!manual.video_file_path) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">
          <div>動画が見つかりません</div>
          <div className="text-sm mt-2 text-gray-400">
            Manual ID: {manual.id}, Status: {manual.status}
          </div>
        </div>
      </div>
    );
  }

  const content = manual.content as ManualContent;
  const currentStep = currentStepIndex !== null && content?.steps ? content.steps[currentStepIndex] : null;

  return (
    <div className="playback-container" onMouseMove={handleMouseMove}>
      {/* ヘッダー */}
      <div className={`playback-header ${showControls ? 'show' : ''}`}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white text-sm">TORISETSU</span>
        </div>
        <h1 className="text-white text-lg font-semibold">{manual.title}</h1>
        <div className="w-32"></div> {/* Spacer for centering */}
      </div>

      {/* メインビデオ */}
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="playback-video"
          onClick={togglePlayPause}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
            const currentTime = e.currentTarget.currentTime;
            const step = getCurrentStep(currentTime);
            if (step) {
              setCurrentStepIndex(step.originalIndex);
            } else {
              setCurrentStepIndex(null);
            }
          }}
        >
          <source 
            src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/uploads/${manual.video_file_path.split('/').pop()}`} 
            type="video/mp4" 
          />
          お使いのブラウザは動画再生に対応していません。
        </video>

        {/* 再生/一時停止オーバーレイ */}
        <div 
          className={`play-pause-overlay ${showControls ? 'show' : ''}`}
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <PauseIcon size={60} className="text-white drop-shadow-lg" />
          ) : (
            <PlayIcon size={60} className="text-white drop-shadow-lg" />
          )}
        </div>
      </div>

      {/* 現在のステップ表示 */}
      {currentStep && (
        <div className={`current-step-overlay ${showControls ? 'show' : ''}`}>
          <div className="current-step-content">
            <div className="flex items-center space-x-3 mb-2">
              <div className="step-number">
                {currentStepIndex !== null ? currentStepIndex + 1 : ''}
              </div>
              <h3 className="step-title">
                {currentStep.title.replace(/^ステップ\d+:\s*/, '')}
              </h3>
            </div>
            <p className="step-action">{currentStep.action}</p>
          </div>
        </div>
      )}

      {/* ステップリスト（サイドバー） */}
      <div className={`steps-sidebar ${showControls ? 'show' : ''}`}>
        <h2 className="sidebar-title">手順一覧</h2>
        <div className="steps-list">
          {content?.steps?.map((step, index) => (
            <div
              key={index}
              className={`step-item ${currentStepIndex === index ? 'active' : ''} ${step.time ? 'clickable' : ''}`}
              onClick={() => step.time && jumpToStep(index)}
            >
              <div className="step-item-number">{index + 1}</div>
              <div className="step-item-content">
                <div className="step-item-title">
                  {step.title.replace(/^ステップ\d+:\s*/, '')}
                </div>
                {step.time && (
                  <div className="step-item-time">
                    <ClockIcon size={12} />
                    {step.time}
                  </div>
                )}
              </div>
              {currentStepIndex === index && (
                <div className="step-item-indicator">
                  <CheckCircleIcon size={16} className="text-green-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* フッター（TORISETSU ブランディング） */}
      <div className={`absolute bottom-4 right-4 ${showControls ? 'opacity-100' : 'opacity-30'} transition-opacity`}>
        <div className="flex items-center space-x-2 text-white text-sm">
          <span>Created with</span>
          <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-semibold">TORISETSU</span>
        </div>
      </div>
    </div>
  );
};

export default SharedManualPlayback;