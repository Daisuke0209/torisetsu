import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import { Project, Torisetsu } from '../types';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { 
  FileTextIcon,
  TrashIcon,
  FolderIcon,
  PlusIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  LoaderIcon
} from '../components/ui/Icons';
import Header from '../components/ui/Header';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [torisetsuList, setTorisetsuList] = useState<Torisetsu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTorisetsuDeleteModal, setShowTorisetsuDeleteModal] = useState(false);
  const [deletingTorisetsu, setDeletingTorisetsu] = useState(false);
  const [torisetsuToDelete, setTorisetsuToDelete] = useState<Torisetsu | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTorisetsuName, setNewTorisetsuName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const fetchProjectData = async () => {
    try {
      // プロジェクト情報を取得
      const projectResponse = await client.get(`/api/projects/detail/${id}`);
      const projectData = projectResponse.data;
      setProject(projectData);
      
      // トリセツ一覧を取得
      try {
        const torisetsuResponse = await client.get(`/api/torisetsu/project/${id}`);
        setTorisetsuList(torisetsuResponse.data);
        return torisetsuResponse.data;
      } catch (torisetsuError: any) {
        // トリセツの取得に失敗した場合でも、プロジェクトは表示する
        if (torisetsuError.response?.status === 404) {
          setTorisetsuList([]);
        } else {
          throw torisetsuError; // その他のエラーは再スロー
        }
        return [];
      }
    } catch (error: any) {
      console.error('Failed to fetch project data:', error);
      
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

  // トリセツ管理のロジック（ポーリングなどは今のところ不要）



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

  const handleDeleteTorisetsu = async () => {
    if (!torisetsuToDelete) return;
    
    const torisetsuName = torisetsuToDelete.name;
    setDeletingTorisetsu(true);
    try {
      await client.delete(`/api/torisetsu/${torisetsuToDelete.id}`);
      // トリセツ一覧から削除したトリセツを除外
      setTorisetsuList(torisetsuList.filter(t => t.id !== torisetsuToDelete.id));
      
      // 削除成功の通知
      toast.success(
        `トリセツ「${torisetsuName}」を削除しました`,
        {
          duration: 3000,
          icon: '🗑️',
        }
      );
    } catch (error: any) {
      console.error('Failed to delete torisetsu:', error);
      
      // 削除失敗の通知
      toast.error(
        error.response?.data?.detail || 'トリセツの削除に失敗しました',
        {
          duration: 4000,
          icon: '❌',
        }
      );
    } finally {
      setDeletingTorisetsu(false);
      setShowTorisetsuDeleteModal(false);
      setTorisetsuToDelete(null);
    }
  };

  const handleShowTorisetsuDeleteModal = (torisetsu: Torisetsu, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTorisetsuToDelete(torisetsu);
    setShowTorisetsuDeleteModal(true);
  };

  const handleCreateTorisetsu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    
    setCreating(true);
    try {
      if (!newTorisetsuName.trim()) {
        toast.error('トリセツ名を入力してください');
        return;
      }
      
      const response = await client.post('/api/torisetsu/', {
        name: newTorisetsuName,
        project_id: id,
      });
      
      setShowCreateModal(false);
      setNewTorisetsuName('');
      await fetchProjectData();
      
      toast.success(`トリセツ「${newTorisetsuName}」を作成しました`, {
        duration: 3000,
        icon: '📖',
      });
    } catch (error: any) {
      console.error('トリセツ作成エラー:', error);
      toast.error(
        error.response?.data?.detail || 'トリセツの作成に失敗しました',
        {
          duration: 4000,
          icon: '❌',
        }
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEditName = () => {
    if (project) {
      setEditingName(project.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (!project || !editingName.trim()) return;
    
    setSavingName(true);
    try {
      const response = await client.put(`/api/projects/${project.id}`, {
        name: editingName.trim()
      });
      
      setProject(response.data);
      setIsEditingName(false);
      toast.success('プロジェクト名を更新しました');
    } catch (error: any) {
      console.error('Failed to update project name:', error);
      toast.error(error.response?.data?.detail || 'プロジェクト名の更新に失敗しました');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  const renderTorisetsuCardContent = (torisetsu: Torisetsu) => (
    <>
      {/* 本の背表紙風デザイン */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-100/30 via-orange-50/20 to-amber-100/30 dark:from-amber-900/20 dark:via-orange-900/10 dark:to-amber-900/20"></div>
      
      {/* 本の端の影 */}
      <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-amber-600/20 via-orange-600/30 to-amber-700/20"></div>
      <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-amber-300/40 via-orange-400/50 to-amber-500/40"></div>
      
      {/* ページの端のテクスチャ */}
      <div className="absolute top-0 right-1 w-0.5 h-full bg-gradient-to-b from-slate-200/60 via-slate-300/40 to-slate-200/60 dark:from-slate-600/40 dark:via-slate-500/30 dark:to-slate-600/40"></div>
      
      {/* しおり（本らしい色に変更） */}
      <div className="absolute left-1 top-2 w-0.5 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-sm"></div>
      
      <CardHeader className="pt-6 pb-4 relative z-10">
        <div className="flex justify-end mb-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full"
            onClick={(e) => handleShowTorisetsuDeleteModal(torisetsu, e)}
          >
            <TrashIcon size={10} />
          </Button>
        </div>
        
        {/* 書籍タイトル風 */}
        <div className="text-center space-y-4 px-2">
          {/* 装飾的な線 */}
          <div className="flex justify-center">
            <div className="w-10 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          </div>
          
          <div className="space-y-2 py-2">
            <CardTitle className="text-sm font-bold leading-tight text-amber-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors text-center tracking-wide">
              {torisetsu.name}
            </CardTitle>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-light">
              トリセツ
            </div>
          </div>
          
          {/* 装飾的な線 */}
          <div className="flex justify-center">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          </div>
        </div>
      </CardHeader>
      
      {/* 中央部分のスペーサー */}
      <div className="flex-1 relative z-10 flex items-center justify-center py-4">
        <div className="w-12 h-12 rounded-full bg-amber-100/30 dark:bg-amber-800/30 flex items-center justify-center border border-amber-200/50 dark:border-amber-700/50">
          <FileTextIcon size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
      </div>
      
      <CardContent className="pt-2 pb-6 relative z-10 mt-auto">
        <div className="space-y-3 text-center">
          {/* 装飾的な線 */}
          <div className="flex justify-center">
            <div className="w-6 h-px bg-amber-300 dark:bg-amber-600"></div>
          </div>
          
          {/* ページ数（本らしい表記） */}
          <div className="text-xs text-amber-700 dark:text-amber-300 font-mono">
            pp. {torisetsu.manual_count || 0}
          </div>
          
          {/* 出版年風 */}
          <div className="text-xs text-slate-500 dark:text-slate-400 font-serif italic">
            {new Date(torisetsu.created_at).getFullYear()}
          </div>
          
          {/* 小さな装飾 */}
          <div className="flex justify-center pt-2">
            <div className="w-4 h-px bg-amber-300 dark:bg-amber-600"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-amber-500/10 border-0">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-slate-700 dark:text-slate-300">{error}</p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                ダッシュボードに戻る
              </Button>
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header onLogoClick={() => navigate('/')} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {/* プロジェクト情報 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-lg">
                <FolderIcon size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="text-2xl font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
                      <Button
                        onClick={handleEditName}
                        size="sm"
                        variant="ghost"
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        <EditIcon size={16} />
                      </Button>
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {project.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <PlusIcon size={16} />
              トリセツを作成
            </Button>
          </div>
        </div>

        {torisetsuList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {torisetsuList.map((torisetsu) => (
              <Link 
                key={torisetsu.id} 
                to={`/torisetsu/${torisetsu.id}`}
                className="group block"
              >
                <Card className="h-full min-h-[280px] transition-all duration-300 border-2 border-amber-300/40 dark:border-amber-600/40 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 shadow-lg shadow-amber-800/20 hover:shadow-xl hover:shadow-amber-700/30 hover:-translate-y-1 hover:rotate-1 rounded-lg relative overflow-hidden backdrop-blur-sm flex flex-col">
                  {renderTorisetsuCardContent(torisetsu)}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <FileTextIcon size={32} className="text-slate-500 dark:text-slate-400" />
              </div>
              <CardTitle className="mb-2 text-slate-900 dark:text-white">トリセツがありません。</CardTitle>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlusIcon size={16} />
                トリセツを作成
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Torisetsu Delete Confirmation Modal */}
      {showTorisetsuDeleteModal && torisetsuToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl shadow-amber-500/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrashIcon size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <span>トリセツを削除</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                この操作は取り消すことができません。トリセツとその中のすべてのマニュアルが削除されます。
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-300">
                  <strong>削除されるトリセツ:</strong> {torisetsuToDelete.name}
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  <strong>マニュアル数:</strong> {torisetsuToDelete.manual_count || 0}件
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  <strong>作成日:</strong> {new Date(torisetsuToDelete.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </CardContent>
            
            <CardContent className="flex justify-end space-x-2 pt-0">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowTorisetsuDeleteModal(false);
                  setTorisetsuToDelete(null);
                }}
                disabled={deletingTorisetsu}
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleDeleteTorisetsu}
                disabled={deletingTorisetsu}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <TrashIcon size={16} />
                {deletingTorisetsu ? '削除中...' : '削除する'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Delete Confirmation Modal */}
      {showDeleteModal && project && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl shadow-amber-500/10">
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
                  <strong>トリセツ数:</strong> {torisetsuList.length}件
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

      {/* Create Torisetsu Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl shadow-amber-500/10" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                  <PlusIcon size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span>新規トリセツ作成</span>
              </CardTitle>
            </CardHeader>
            
            <form onSubmit={handleCreateTorisetsu}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    トリセツ名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newTorisetsuName}
                    onChange={(e) => setNewTorisetsuName(e.target.value)}
                    placeholder="トリセツ名を入力"
                    required
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20"
                  />
                </div>
              </CardContent>
              
              <CardContent className="flex justify-end space-x-2 pt-0">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTorisetsuName('');
                  }}
                  disabled={creating}
                >
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={creating || !newTorisetsuName.trim()}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon size={16} />
                  {creating ? '作成中...' : 'トリセツを作成'}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;