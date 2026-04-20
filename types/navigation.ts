import { LinkProps } from 'expo-router';

export type RootStackParamList = {
  '(tabs)': undefined;
  'note/[id]': { id: string };
  'recording/[id]': { id: string };
  modal: undefined;
};

export type TabParamList = {
  index: undefined;
  record: undefined;
  notes: undefined;
  settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
