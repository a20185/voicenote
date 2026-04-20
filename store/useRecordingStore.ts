import { create } from 'zustand';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  currentRecordingUri: string | null;
}

interface RecordingActions {
  setIsRecording: (isRecording: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  setDuration: (duration: number) => void;
  setCurrentRecordingUri: (uri: string | null) => void;
  reset: () => void;
}

const initialState: RecordingState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  currentRecordingUri: null,
};

export const useRecordingStore = create<RecordingState & RecordingActions>((set) => ({
  ...initialState,

  setIsRecording: (isRecording) => set({ isRecording }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setDuration: (duration) => set({ duration }),
  setCurrentRecordingUri: (uri) => set({ currentRecordingUri: uri }),
  reset: () => set(initialState),
}));

// Playback store for audio player
interface PlaybackState {
  isPlaying: boolean;
  currentTrackId: string | null;
  currentPosition: number;
  duration: number;
  playbackRate: number;
}

interface PlaybackActions {
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTrack: (trackId: string | null) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackRate: (rate: number) => void;
  reset: () => void;
}

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTrackId: null,
  currentPosition: 0,
  duration: 0,
  playbackRate: 1,
};

export const usePlaybackStore = create<PlaybackState & PlaybackActions>((set) => ({
  ...initialPlaybackState,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTrack: (trackId) => set({ currentTrackId: trackId, currentPosition: 0 }),
  setCurrentPosition: (position) => set({ currentPosition: position }),
  setDuration: (duration) => set({ duration }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  reset: () => set(initialPlaybackState),
}));
