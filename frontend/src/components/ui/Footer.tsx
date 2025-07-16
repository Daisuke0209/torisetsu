import React from 'react';
import { APP_CONFIG } from '../../constants/app';

const Footer: React.FC = () => {
  return (
    <div className="mt-8 text-center">
      <p className="text-xs text-slate-500 dark:text-slate-500">
        © 2025 {APP_CONFIG.name}. All rights reserved.
      </p>
    </div>
  );
};

export default Footer;