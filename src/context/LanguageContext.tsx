import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getTexts, type SupportedLanguage, type StaticTextsType } from '../staticTexts';

type LanguageContextType = {
  language: SupportedLanguage;
  texts: StaticTextsType;
  setLanguage: (lang: SupportedLanguage) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  texts: getTexts('en'),
  setLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    const validLang = lang === 'ta' ? 'ta' : 'en';
    setLanguageState(validLang);
  }, []);

  const texts = getTexts(language);

  return (
    <LanguageContext.Provider value={{ language, texts, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
