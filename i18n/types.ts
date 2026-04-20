import type enCommon from './locales/en/common.json';
import type enNav from './locales/en/nav.json';
import type enSettings from './locales/en/settings.json';
import type enRecording from './locales/en/recording.json';
import type enNote from './locales/en/note.json';
import type enSearch from './locales/en/search.json';
import type enErrors from './locales/en/errors.json';
import type enDates from './locales/en/dates.json';
import type enDialog from './locales/en/dialog.json';
import type enSelection from './locales/en/selection.json';
import type enMedia from './locales/en/media.json';
import type enAi from './locales/en/ai.json';
import type enInspiration from './locales/en/inspiration.json';
import type enCamera from './locales/en/camera.json';
import type enAttachment from './locales/en/attachment.json';
import type enVoice from './locales/en/voice.json';
import type enStats from './locales/en/stats.json';

import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      nav: typeof enNav;
      settings: typeof enSettings;
      recording: typeof enRecording;
      note: typeof enNote;
      search: typeof enSearch;
      errors: typeof enErrors;
      dates: typeof enDates;
      dialog: typeof enDialog;
      selection: typeof enSelection;
      media: typeof enMedia;
      ai: typeof enAi;
      inspiration: typeof enInspiration;
      camera: typeof enCamera;
      attachment: typeof enAttachment;
      voice: typeof enVoice;
      stats: typeof enStats;
    };
  }
}
