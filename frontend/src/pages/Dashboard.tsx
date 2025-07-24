import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import { Project } from '../types';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { Badge } from '../components/ui/badge';
import { PlusIcon, FolderIcon, TrashIcon } from '../components/ui/Icons';
import Header from '../components/ui/Header';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // プロジェクト一覧を直接取得
      const projectsResponse = await client.get('/api/projects/');
      setProjects(projectsResponse.data);
    } catch (error: any) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return; // 重複実行防止
    
    setCreating(true);
    try {
      if (!newProjectName.trim()) {
        alert('プロジェクト名を入力してください');
        return;
      }
      
      const response = await client.post('/api/projects/', {
        name: newProjectName,
      });
      
      setShowCreateModal(false);
      setNewProjectName('');
      await fetchData();
    } catch (error: any) {
      console.error('プロジェクト作成エラー:', error);
      alert(`プロジェクトの作成に失敗しました: ${error.response?.data?.detail || error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    setDeleting(true);
    try {
      await client.delete(`/api/projects/${projectToDelete.id}`);
      setShowDeleteModal(false);
      setProjectToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      alert(error.response?.data?.detail || 'プロジェクトの削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20">
      <Header />

      {/* Modern Content Area */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-end">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusIcon size={16} />
            プロジェクトを作成
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project.id} 
                to={`/project/${project.id}`}
                className="group block"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 bg-white/70 dark:bg-amber-800/70 backdrop-blur-xl shadow-xl shadow-amber-500/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                        <FolderIcon size={20} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-slate-900 dark:text-white">
                          {project.name}
                        </CardTitle>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openDeleteModal(project);
                        }}
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {project.torisetsu_count !== undefined && project.torisetsu_count !== null && (
                          <Badge variant="outline" className="text-xs border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                            {project.torisetsu_count}件
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(project.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-amber-300 dark:border-amber-600 bg-white/50 dark:bg-amber-800/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-700 flex items-center justify-center mb-4">
                <FolderIcon size={32} className="text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="mb-2 text-slate-900 dark:text-white">プロジェクトがありません</CardTitle>
              <CardDescription className="mb-6 max-w-md text-slate-600 dark:text-slate-400">
                新しいプロジェクトを作成して、マニュアル作成を始めましょう
              </CardDescription>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlusIcon size={16} />
                プロジェクトを作成
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/95 dark:bg-amber-800/95 backdrop-blur-xl border-0 shadow-2xl shadow-amber-500/10">
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
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>削除されるプロジェクト:</strong> {projectToDelete.name}
                </p>
                {projectToDelete.description && (
                  <p className="text-sm text-red-700 mt-1">
                    {projectToDelete.description}
                  </p>
                )}
              </div>
            </CardContent>
            
            <CardContent className="flex justify-end space-x-2 pt-0">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
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

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/95 dark:bg-amber-800/95 backdrop-blur-xl border-0 shadow-2xl shadow-amber-500/10" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                  <PlusIcon size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span>新規プロジェクト作成</span>
              </CardTitle>
            </CardHeader>
            
            <form onSubmit={handleCreateProject}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    プロジェクト名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="プロジェクト名を入力"
                    required
                    className="bg-white/50 dark:bg-amber-700/50 border-amber-200 dark:border-amber-600 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20"
                  />
                </div>
                
              </CardContent>
              
              <CardContent className="flex justify-end space-x-2 pt-0">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={creating || !newProjectName.trim()}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon size={16} />
                  {creating ? '作成中...' : 'プロジェクトを作成'}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;