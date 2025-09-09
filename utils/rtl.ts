import { useI18n } from '@/context/I18nProvider';

/**
 * Hook to get RTL-related utilities
 */
export const useRTL = () => {
  const { currentLanguage, isRTL } = useI18n();
  
  return {
    isRTL,
    currentLanguage,
    // Utility function to get appropriate classes based on RTL
    getRTLClasses: (ltrClasses: string, rtlClasses: string) => {
      return isRTL ? rtlClasses : ltrClasses;
    },
    // Get text alignment class
    getTextAlign: (defaultAlign: 'left' | 'right' | 'center' = 'left') => {
      if (isRTL) {
        return defaultAlign === 'left' ? 'text-right' : 
               defaultAlign === 'right' ? 'text-left' : 'text-center';
      }
      return `text-${defaultAlign}`;
    },
    // Get margin/padding direction
    getDirection: (property: 'margin' | 'padding', side: 'left' | 'right', value: string) => {
      if (isRTL) {
        const oppositeSide = side === 'left' ? 'right' : 'left';
        return `${property}-${oppositeSide}-${value}`;
      }
      return `${property}-${side}-${value}`;
    }
  };
};

/**
 * Utility function to check if current language is RTL
 */
export const isRTLLanguage = (language: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
};

/**
 * Get appropriate direction attribute
 */
export const getDirection = (language: string): 'ltr' | 'rtl' => {
  return isRTLLanguage(language) ? 'rtl' : 'ltr';
};
