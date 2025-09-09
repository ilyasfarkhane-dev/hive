/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'ar'],
    localeDetection: true,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Enable RTL support for Arabic
  localePath: './public/locales',
  // Custom interpolation for RTL support
  interpolation: {
    escapeValue: false,
  },
  // Enable namespace support
  ns: ['common'],
  defaultNS: 'common',
  // Custom language detection
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },
};
