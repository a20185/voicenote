import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { resources } from './resources';

export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]['code'];

const supportedCodes = supportedLanguages.map((l) => l.code);

function getDeviceLanguage(): string {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageTag || 'en';

  if (supportedCodes.includes(deviceLang as any)) return deviceLang;

  const langPrefix = deviceLang.split('-')[0];

  if (langPrefix === 'zh') {
    return deviceLang.includes('Hant') || deviceLang.includes('TW') ? 'zh-TW' : 'zh-CN';
  }

  const match = supportedCodes.find((c) => c.startsWith(langPrefix));
  return match || 'en';
}

const allNamespaces = [
  'common',
  'nav',
  'settings',
  'recording',
  'note',
  'search',
  'errors',
  'dates',
  'dialog',
  'selection',
  'media',
  'ai',
  'inspiration',
  'camera',
  'attachment',
  'voice',
  'stats',
  'category',
  'optimization',
  'share',
] as const;

i18n.use(initReactI18next).init({
  resources,
  lng: undefined,
  fallbackLng: 'en',
  supportedLngs: supportedCodes,
  ns: [...allNamespaces],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function initLanguage(storedLang?: string) {
  const lang =
    storedLang && supportedCodes.includes(storedLang as any) ? storedLang : getDeviceLanguage();
  i18n.changeLanguage(lang);
  return lang;
}

export default i18n;
