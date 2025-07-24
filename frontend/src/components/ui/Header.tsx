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
              className="cursor-pointer hover:scale-105 transition-transform duration-200 relative" 
              onClick={handleLogoClick}
            >
              {/* 本のデザイン */}
              <div className="w-10 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-r-lg shadow-lg relative">
                {/* 本の背表紙 */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-r-lg"></div>
                
                {/* 本の端 */}
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-amber-600 to-orange-700 rounded-l-sm"></div>
                
                {/* ページの端 */}
                <div className="absolute right-0 top-0.5 w-0.5 h-11 bg-white/40 rounded-r-sm"></div>
                <div className="absolute right-0.5 top-1 w-0.5 h-10 bg-white/30 rounded-r-sm"></div>
                
                {/* しおり */}
                <div className="absolute left-0.5 top-1 w-0.5 h-5 bg-red-500 rounded-full"></div>
                
                {/* 本のタイトル部分 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap">
                    T
                  </div>
                </div>
              </div>
              
              {/* 影 */}
              <div className="absolute top-1 left-1 w-10 h-12 bg-amber-900/30 rounded-r-lg -z-10"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {title || APP_CONFIG.name}
              </h1>
              <p className="text-xs text-amber-700 dark:text-amber-300 -mt-1">
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