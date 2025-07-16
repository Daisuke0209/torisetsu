import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../constants/app';
import UserMenu from './UserMenu';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  onLogoClick 
}) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      // デフォルトはダッシュボードに戻る
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/20 dark:border-slate-700/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div 
              className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200" 
              onClick={handleLogoClick}
            >
              <span className="text-white font-bold text-lg">{APP_CONFIG.logoIcon}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title || APP_CONFIG.name}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 -mt-1">
                {subtitle || APP_CONFIG.subtitle}
              </p>
            </div>
          </div>
        </div>
        
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;