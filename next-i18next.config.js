const path = require('path');
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'ar'],
    localeDetection: true,
  },
  localePath: path.resolve('./public/locales'),
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  debug: true,
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },
};