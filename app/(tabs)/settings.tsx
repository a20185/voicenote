import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useOverlayStore } from '@/store/useOverlayStore';

/**
 * Settings route - redirects to home with settings overlay open.
 * This route exists for deep link compatibility.
 * Settings are now accessed via overlay from the home screen header.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { openOverlay } = useOverlayStore();

  useEffect(() => {
    // Navigate to home and open settings overlay
    openOverlay('settings');
    router.replace('/');
  }, [openOverlay, router]);

  return null;
}
