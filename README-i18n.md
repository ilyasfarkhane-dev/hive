# Internationalization (i18n) Setup Guide

This project now includes full internationalization support with next-i18next, supporting English (default), French, and Arabic with RTL support.

## Features

- ✅ **Three Languages**: English (EN), French (FR), Arabic (AR)
- ✅ **RTL Support**: Automatic RTL layout for Arabic
- ✅ **Language Switcher**: Available in Burger Menu and Login page
- ✅ **Instant Switching**: No page reload required
- ✅ **Persistent Selection**: Language choice saved in localStorage
- ✅ **Translation Files**: Organized in `public/locales/{lang}/common.json`

## File Structure

```
hive/
├── next-i18next.config.js          # i18n configuration
├── pages/_app.tsx                  # App wrapper with i18n
├── context/I18nProvider.tsx        # i18n context provider
├── components/
│   ├── LanguageSwitcher.tsx        # Language switcher component
│   └── BurgerMenu.tsx              # Updated with translations
├── utils/rtl.ts                    # RTL utility functions
├── public/locales/
│   ├── en/common.json              # English translations
│   ├── fr/common.json              # French translations
│   └── ar/common.json              # Arabic translations
└── app/
    ├── layout.tsx                  # Updated with i18n provider
    └── login/page.tsx              # Updated with translations
```

## Usage Examples

### 1. Using Translations in Components

```tsx
"use client";
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>{t('common.description')}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
};
```

### 2. Using RTL Utilities

```tsx
"use client";
import { useRTL } from '@/utils/rtl';

const MyComponent = () => {
  const { isRTL, getTextAlign, getDirection } = useRTL();
  
  return (
    <div className={getTextAlign('left')}>
      <p className={getDirection('margin', 'left', '4')}>
        {isRTL ? 'النص العربي' : 'English text'}
      </p>
    </div>
  );
};
```

### 3. Adding Language Switcher

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Dropdown variant (default)
<LanguageSwitcher variant="dropdown" showLabels={true} />

// Button variant
<LanguageSwitcher variant="buttons" showLabels={false} />
```

## Adding New Translations

1. **Add to translation files** (`public/locales/{lang}/common.json`):
```json
{
  "common": {
    "newKey": "New Value",
    "newKeyFr": "Nouvelle Valeur",
    "newKeyAr": "قيمة جديدة"
  }
}
```

2. **Use in components**:
```tsx
const { t } = useTranslation('common');
return <span>{t('common.newKey')}</span>;
```

## RTL Support

Arabic language automatically applies RTL layout:
- Text alignment changes to right
- Margins and padding are mirrored
- Dropdown menus appear on the left
- All UI elements adapt to RTL

## Configuration

The i18n configuration is in `next-i18next.config.js`:
- Default language: English
- Supported locales: en, fr, ar
- Locale detection: enabled
- RTL support: automatic for Arabic

## Browser Support

- Modern browsers with localStorage support
- RTL layout support for Arabic
- Font fallbacks for Arabic text

## Development

1. **Start development server**:
```bash
npm run dev
```

2. **Test language switching**:
   - Use the language switcher in the top-right corner of login page
   - Use the language switcher in the burger menu (when authenticated)

3. **Add new languages**:
   - Add locale to `next-i18next.config.js`
   - Create translation files in `public/locales/{lang}/`
   - Update `LanguageSwitcher.tsx` with new language options

## Troubleshooting

- **Translations not loading**: Check if translation files exist in `public/locales/`
- **RTL not working**: Ensure `dir="rtl"` is set on HTML element
- **Language not persisting**: Check localStorage for `i18nextLng` key
- **Build errors**: Ensure all translation files have matching keys
