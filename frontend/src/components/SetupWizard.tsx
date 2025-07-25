import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import Input from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import client from '../api/client';

interface SetupWizardProps {
  open: boolean;
  onComplete: (projectId: string, torisetsuId: string, manualId?: string) => void;
}

export default function SetupWizard({ open, onComplete }: SetupWizardProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [torisetsuName, setTorisetsuName] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  
  // 作成されたID群を保持
  const [createdIds, setCreatedIds] = useState<{
    projectId?: string;
    torisetsuId?: string;
    manualId?: string;
  }>({});

  const handleNext = () => {
    if (step === 1 && projectName.trim()) {
      setStep(2);
      setError('');
    } else if (step === 2 && torisetsuName.trim()) {
      setStep(3);
      setError('');
    } else if (step === 3 && manualTitle.trim() && selectedFile) {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（100MB制限）
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('ファイルサイズは100MB以下にしてください');
        return;
      }
      
      // ファイル形式チェック
      const allowedTypes = ['video/webm', 'video/mp4', 'video/avi', 'video/mov'];
      if (!allowedTypes.includes(file.type)) {
        setError('対応している動画形式: MP4, WebM, AVI, MOV');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Step 1: プロジェクトとトリセツを作成
      setCurrentOperation('プロジェクトとトリセツを作成中...');
      const setupResponse = await client.post('/api/wizard/setup', {
        project_name: projectName.trim(),
        torisetsu_name: torisetsuName.trim(),
      });

      const { project_id, torisetsu_id } = setupResponse.data;
      setCreatedIds({ projectId: project_id, torisetsuId: torisetsu_id });

      // Step 2: 動画をアップロード
      setCurrentOperation('動画をアップロード中...');
      const formData = new FormData();
      formData.append('file', selectedFile!);
      
      const uploadResponse = await client.post('/api/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      const { filename, file_path } = uploadResponse.data;

      // Step 3: マニュアルを作成
      setCurrentOperation('マニュアルを作成中...');
      const manualResponse = await client.post('/api/manuals/', {
        torisetsu_id: torisetsu_id,
        title: manualTitle.trim(),
        content: null,
        status: 'draft',
        version: '1.0',
        video_file_path: file_path,
      });

      const manualId = manualResponse.data.id;
      setCreatedIds(prev => ({ ...prev, manualId }));

      // Step 4: AI生成を開始
      setCurrentOperation('AIがマニュアルを生成中...');
      await client.post(`/api/manuals/${manualId}/generate`);

      // 完了
      onComplete(project_id, torisetsu_id, manualId);
      navigate(`/manual/${manualId}`);
      
    } catch (error: any) {
      console.error('Setup error:', error);
      setError(error.response?.data?.detail || 'セットアップに失敗しました');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
      setUploadProgress(0);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return projectName.trim() !== '';
      case 2: return torisetsuName.trim() !== '';
      case 3: return manualTitle.trim() !== '' && selectedFile !== null;
      default: return false;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg bg-white/95 dark:bg-amber-800/95 backdrop-blur-xl border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 1 && 'ようこそ！'}
            {step === 2 && 'もう少しで完了です'}
            {step === 3 && '動画からマニュアルを作成'}
          </CardTitle>
          <CardDescription className="text-base">
            {step === 1 && '最初のプロジェクトを作成しましょう'}
            {step === 2 && '最初のトリセツを作成しましょう'}
            {step === 3 && '動画をアップロードしてAIマニュアルを生成します'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* プログレスインジケーターと階層説明 */}
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-gray-300'}`} />
              <div className={`h-1 w-8 ${step >= 2 ? 'bg-amber-500' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-gray-300'}`} />
              <div className={`h-1 w-8 ${step >= 3 ? 'bg-amber-500' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-amber-500' : 'bg-gray-300'}`} />
            </div>
            
            {/* 階層構造の説明 */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm">
              <div className="space-y-2">
                <div className="text-xs text-center text-slate-500 dark:text-slate-400">
                  データの階層構造
                </div>
                <div className="flex items-center justify-center space-x-2 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span className={step === 1 ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>プロジェクト</span>
                  </div>
                  <span className="text-slate-400">＞</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span className={step === 2 ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>トリセツ</span>
                  </div>
                  <span className="text-slate-400">＞</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-purple-400 rounded"></div>
                    <span className={step === 3 ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>マニュアル</span>
                  </div>
                </div>
                <div className="text-xs text-center text-slate-500 dark:text-slate-400">
                  {step === 2 && 'テーマ別のグループ（機能・業務単位）'}
                  {step === 3 && '具体的な操作手順（動画・ステップ単位）'}
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: プロジェクト名 */}
          {step === 1 && (
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                プロジェクト名
              </label>
              <Input
                id="project-name"
                placeholder="例: 社内マニュアル"
                value={projectName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectName(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && canProceed() && handleNext()}
                className="bg-white/50 dark:bg-amber-700/50"
              />
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 bg-blue-400 rounded-sm mt-0.5 flex-shrink-0"></div>
                  <div className="text-sm">
                    <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                      プロジェクトとは？
                    </div>
                    <div className="text-blue-700 dark:text-blue-400">
                      関連するトリセツをまとめる最上位の単位です。<br/>
                      <span className="text-xs">例：「営業部マニュアル」「新人研修資料」</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: トリセツ名 */}
          {step === 2 && (
            <div className="space-y-2">
              <label htmlFor="torisetsu-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                トリセツ名
              </label>
              <Input
                id="torisetsu-name"
                placeholder="例: 新入社員向けガイド"
                value={torisetsuName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTorisetsuName(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && canProceed() && handleNext()}
                className="bg-white/50 dark:bg-amber-700/50"
              />
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 bg-green-400 rounded-sm mt-0.5 flex-shrink-0"></div>
                  <div className="text-sm">
                    <div className="font-medium text-green-800 dark:text-green-300 mb-1">
                      トリセツとは？
                    </div>
                    <div className="text-green-700 dark:text-green-400">
                      テーマごとに複数のマニュアルをまとめる単位です。<br/>
                      <span className="text-xs">例：「システム操作」「接客マニュアル」</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 動画アップロード */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="manual-title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  マニュアルタイトル
                </label>
                <Input
                  id="manual-title"
                  placeholder="例: ログイン手順"
                  value={manualTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualTitle(e.target.value)}
                  className="bg-white/50 dark:bg-amber-700/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  動画ファイル
                </label>
                <div className="border-2 border-dashed border-amber-300 dark:border-amber-600 rounded-lg p-6 text-center">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="text-green-600 dark:text-green-400">✓ {selectedFile.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        サイズ: {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm"
                      >
                        別のファイルを選択
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-slate-600 dark:text-slate-400">
                        動画ファイルをドロップ、またはクリックして選択
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        ファイルを選択
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/avi,video/mov"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    対応形式: MP4, WebM, AVI, MOV (最大100MB)
                  </p>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 bg-purple-400 rounded-sm mt-0.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <div className="font-medium text-purple-800 dark:text-purple-300 mb-1">
                          マニュアルとは？
                        </div>
                        <div className="text-purple-700 dark:text-purple-400">
                          実際の操作手順を記録した個別のドキュメントです。<br/>
                          <span className="text-xs">例：「ログイン方法」「データ入力手順」</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* アップロード進捗 */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>アップロード中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 現在の操作表示 */}
          {currentOperation && (
            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {currentOperation}
              </p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                戻る
              </Button>
            )}
            <Button
              className="ml-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
            >
              {step === 1 && '次へ'}
              {step === 2 && '次へ'}
              {step === 3 && (isLoading ? '作成中...' : 'マニュアルを作成')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}