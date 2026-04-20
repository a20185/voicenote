import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export function useAudioPlayback() {
  const [source, setSource] = useState<string | null>(null);
  const pendingPlay = useRef(false);

  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  // When source changes and player finishes loading, auto-play if pending
  useEffect(() => {
    if (pendingPlay.current && status.isLoaded) {
      try {
        player.play();
      } catch (e) {
        console.warn('Audio play failed:', e);
      }
      pendingPlay.current = false;
    }
  }, [status.isLoaded, player]);

  const isPlaying = status.playing;
  const playbackPosition = (status.currentTime || 0) * 1000;
  const playbackDuration = (status.duration || 0) * 1000;

  const loadAndPlay = useCallback((uri: string) => {
    if (uri === source) {
      // Same source — seek to start and play
      if (status.isLoaded) {
        try {
          player.seekTo(0);
          player.play();
        } catch {
          // Ignore errors during seek/play
        }
      }
      return;
    }
    pendingPlay.current = true;
    setSource(uri);
  }, [source, player, status.isLoaded]);

  const loadSound = useCallback((uri: string) => {
    pendingPlay.current = false;
    setSource(uri);
  }, []);

  const playSound = useCallback(() => {
    if (!status.isLoaded) return;
    try { player.play(); } catch { /* ignore */ }
  }, [player, status.isLoaded]);

  const pauseSound = useCallback(() => {
    if (!status.isLoaded) return;
    try { player.pause(); } catch { /* ignore */ }
  }, [player, status.isLoaded]);

  const stopSound = useCallback(() => {
    if (!status.isLoaded) return;
    try {
      player.pause();
      player.seekTo(0);
    } catch { /* ignore */ }
  }, [player, status.isLoaded]);

  const seekTo = useCallback((positionMs: number) => {
    if (!status.isLoaded) return;
    try { player.seekTo(positionMs / 1000); } catch { /* ignore */ }
  }, [player, status.isLoaded]);

  const unload = useCallback(() => {
    pendingPlay.current = false;
    setSource(null);
  }, []);

  return {
    isPlaying,
    playbackPosition,
    playbackDuration,
    loadSound,
    loadAndPlay,
    playSound,
    pauseSound,
    stopSound,
    seekTo,
    unload,
  };
}
