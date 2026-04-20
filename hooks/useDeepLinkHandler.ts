import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useOverlayStore, type OverlayType } from '@/store/useOverlayStore';

const VALID_OVERLAYS: Record<string, OverlayType> = {
  record: 'record',
  camera: 'camera',
  text: 'text',
  attachment: 'attachment',
};

function parseOverlayFromURL(url: string | null): OverlayType {
  if (!url) return null;
  try {
    const { hostname, path } = Linking.parse(url);
    const key = hostname || path?.replace(/^\//, '') || '';
    return VALID_OVERLAYS[key] ?? null;
  } catch {
    return null;
  }
}

export function useDeepLinkHandler() {
  const openOverlay = useOverlayStore((s) => s.openOverlay);

  useEffect(() => {
    // Cold start: check initial URL
    Linking.getInitialURL().then((url) => {
      const overlay = parseOverlayFromURL(url);
      if (overlay) openOverlay(overlay);
    });

    // Warm start: listen for incoming URLs
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const overlay = parseOverlayFromURL(url);
      if (overlay) openOverlay(overlay);
    });

    return () => subscription.remove();
  }, [openOverlay]);
}
