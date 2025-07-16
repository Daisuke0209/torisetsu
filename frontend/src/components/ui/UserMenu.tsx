import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import { Avatar, AvatarFallback } from './avatar';
import { LogOutIcon, UserIcon, ChevronDownIcon } from './Icons';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外をクリックした時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESCキーでメニューを閉じる
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const handleProfileClick = () => {
    // 将来的にプロフィール画面への遷移を実装
    setIsOpen(false);
    console.log('プロフィール画面への遷移（未実装）');
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* ユーザー情報ボタン */}
      <Button
        variant="ghost"
        className="flex items-center space-x-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-full border border-slate-200 dark:border-slate-600 p-2 pl-4 pr-3 hover:bg-white/70 dark:hover:bg-slate-600/50 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-sm bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {user?.username}
        </span>
        <ChevronDownIcon 
          size={14} 
          className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </Button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl shadow-slate-500/10 dark:shadow-slate-900/20 py-2 z-50">
          {/* ユーザー情報ヘッダー */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center space-x-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* メニューアイテム */}
          <div className="py-1">
            {/* プロフィール（将来実装） */}
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150"
            >
              <UserIcon size={16} className="text-slate-500 dark:text-slate-400" />
              <span>プロフィール</span>
            </button>

            {/* 区切り線 */}
            <div className="my-1 border-t border-slate-200 dark:border-slate-600"></div>

            {/* ログアウト */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
            >
              <LogOutIcon size={16} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;