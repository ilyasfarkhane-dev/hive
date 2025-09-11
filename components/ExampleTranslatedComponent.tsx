"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/utils/rtl';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Example component demonstrating how to use translations and RTL support
 * This can be used as a reference for implementing i18n in other components
 */
const ExampleTranslatedComponent: React.FC = () => {
  const { t } = useTranslation('common');
  const { isRTL, getTextAlign } = useRTL();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header with language switcher */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold text-gray-800 ${getTextAlign('left')}`}>
          {t('common.title')}
        </h1>
        <LanguageSwitcher  showLabels={true} />
      </div>

      {/* Description */}
      <p className={`text-gray-600 mb-6 ${getTextAlign('left')}`}>
        {t('common.description')}
      </p>

      {/* Form example */}
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${getTextAlign('left')}`}>
            {t('common.login')}
          </label>
          <input
            type="text"
            placeholder={t('common.enterLogin')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0e7378] focus:border-transparent"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${getTextAlign('left')}`}>
            {t('common.password')}
          </label>
          <input
            type="password"
            placeholder={t('common.enterPassword')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0e7378] focus:border-transparent"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className={`flex gap-4 mt-6 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        <button className="px-6 py-2 bg-[#0e7378] text-white rounded-lg hover:bg-[#0a5559] transition-colors">
          {t('common.submit')}
        </button>
        <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
          {t('common.cancel')}
        </button>
      </div>

      {/* Status messages */}
      <div className="mt-6 space-y-2">
        <div className="p-3 bg-green-100 text-green-700 rounded-lg">
          {t('common.success')}
        </div>
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
          {t('common.error')}
        </div>
      </div>

      {/* Language info */}
      <div className={`mt-6 p-4 bg-gray-50 rounded-lg ${getTextAlign('left')}`}>
        <h3 className="font-semibold text-gray-800 mb-2">
          Current Language: {isRTL ? 'Arabic (RTL)' : 'English/French (LTR)'}
        </h3>
        <p className="text-sm text-gray-600">
          {isRTL 
            ? 'النص يظهر من اليمين إلى اليسار مع دعم كامل للغة العربية'
            : 'Text displays from left to right with full English/French support'
          }
        </p>
      </div>
    </div>
  );
};

export default ExampleTranslatedComponent;
