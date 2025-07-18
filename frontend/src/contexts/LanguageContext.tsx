import React, { createContext, useContext, ReactNode } from 'react';

interface LanguageContextType {
  t: (key: string) => string;
  language: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // For now, just return the key as-is (pass-through)
  // In the future, this can be enhanced with actual translations
  const t = (key: string) => key;
  
  return (
    <LanguageContext.Provider value={{ t, language: 'ja' }}>
      {children}
    </LanguageContext.Provider>
  );
};