import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { api, Song } from '../services/api';

type RepeatMode = 'off' | 'all' | 'one';

export type Playlist = {
  id: string;
  name: string;
  songs: Song[];
};

export type DownloadedSong = Song & { 
  localUri: string; 
};

type PlayerState = {
  currentSong: Song | null;
  queue: Song[];
  originalQueue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  isPlayerOpen: boolean;
  likedSongs: Song[];
  playlists: Playlist[];
  downloadedSongs: DownloadedSong[];
  shuffle: boolean;
  repeat: RepeatMode;

  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  playFolder: (songs: Song[], forceShuffle?: boolean) => void;
  togglePlay: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  setPlayerOpen: (open: boolean) => void;
  toggleLike: (song: Song) => void;
  isLiked: (id: string) => boolean;
  addToQueue: (song: Song) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  loadData: () => Promise<void>;
  
  createPlaylist: (name: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  downloadSong: (song: Song) => Promise<void>;
};

// Hold the Expo AV Sound instance globally outside the store state
let soundInstance: Audio.Sound | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  originalQueue: [],
  queueIndex: 0,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  isPlayerOpen: false,
  likedSongs: [],
  playlists: [],
  downloadedSongs: [],
  shuffle: false,
  repeat: 'off',

  loadData: async () => {
    try {
      const storedLikes = await AsyncStorage.getItem('likedSongs');
      const storedPlaylists = await AsyncStorage.getItem('playlists');
      const storedDownloads = await AsyncStorage.getItem('downloadedSongs');
      
      if (storedLikes) set({ likedSongs: JSON.parse(storedLikes) });
      if (storedPlaylists) set({ playlists: JSON.parse(storedPlaylists) });
      if (storedDownloads) set({ downloadedSongs: JSON.parse(storedDownloads) });
    } catch (err) {
      console.error("Error loading saved data:", err);
    }
  },

  playFolder: (songs, forceShuffle = false) => {
    if (songs.length === 0) return;
    if (forceShuffle) {
      set({ shuffle: true });
      const randomIdx = Math.floor(Math.random() * songs.length);
      get().playSong(songs[randomIdx], songs);
    } else {
      set({ shuffle: false });
      get().playSong(songs[0], songs);
    }
  },

  playSong: async (song, queue) => {
    const state = get();
    set({ isLoading: true, currentSong: song, isPlaying: false, position: 0 });

    if (queue) {
      const idx = queue.findIndex(s => s.id === song.id);
      let q = [...queue];
      if (state.shuffle) {
        const rest = q.filter(s => s.id !== song.id);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        q = [song, ...rest];
        set({ queue: q, originalQueue: queue, queueIndex: 0 });
      } else {
        set({ queue: q, originalQueue: q, queueIndex: idx >= 0 ? idx : 0 });
      }
    }

    try {
      let audioSource = '';
      const offlineSong = get().downloadedSongs.find(s => s.id === song.id);
      
      if (offlineSong && offlineSong.localUri) {
        audioSource = offlineSong.localUri;
      } else {
        const streamData = await api.getStream(song.id);
        audioSource = streamData.streamUrl;
      }

      // --- EXPO AV INTEGRATION ---
      
      // 1. Unload the previous song if it exists
      if (soundInstance) {
        await soundInstance.unloadAsync();
      }

      // 2. Load and play the new song
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioSource },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            // Automatically sync UI with native playback progress
            set({
              position: status.positionMillis,
              duration: status.durationMillis || song.duration * 1000,
              isPlaying: status.isPlaying,
            });

            // Handle automatic track switching when a song finishes
            if (status.didJustFinish) {
              const { repeat, playNext, seekTo } = get();
              if (repeat === 'one') {
                seekTo(0).then(() => soundInstance?.playAsync());
              } else {
                playNext();
              }
            }
          }
        }
      );

      soundInstance = sound;
      set({ isLoading: false, isPlaying: true, duration: song.duration * 1000 });
      
    } catch (err) {
      console.error('Play error:', err);
      set({ isLoading: false });
    }
  },

  togglePlay: async () => {
    const { isPlaying } = get();
    if (soundInstance) {
      if (isPlaying) {
        await soundInstance.pauseAsync();
      } else {
        await soundInstance.playAsync();
      }
    }
  },

  seekTo: async (positionMs) => {
    if (soundInstance) {
      await soundInstance.setPositionAsync(positionMs);
      set({ position: positionMs });
    }
  },

  playNext: async () => {
    const { queue, queueIndex, currentSong, repeat } = get();
    
    if (queue.length === 0) return;

    if (repeat === 'all') {
      const nextIndex = (queueIndex + 1) % queue.length;
      set({ queueIndex: nextIndex });
      get().playSong(queue[nextIndex], queue);
    } else if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      set({ queueIndex: nextIndex });
      get().playSong(queue[nextIndex], queue);
    } else {
      if (currentSong) {
        try {
          const suggestions = await api.getSuggestions(currentSong.id);
          if (suggestions.length > 0) {
            const newQueue = [...queue, ...suggestions];
            const nextIndex = queueIndex + 1;
            set({ queue: newQueue, originalQueue: newQueue, queueIndex: nextIndex });
            get().playSong(suggestions[0], newQueue);
          }
        } catch (err) {
          console.error("Autoplay fetch failed", err);
        }
      }
    }
  },

  playPrev: async () => {
    const { queue, queueIndex, position } = get();
    if (position > 3000) {
      get().seekTo(0);
      return;
    }
    if (queue.length === 0) return;
    const prevIndex = queueIndex === 0 ? 0 : queueIndex - 1;
    set({ queueIndex: prevIndex });
    get().playSong(queue[prevIndex], queue);
  },

  setPlayerOpen: (open) => set({ isPlayerOpen: open }),

  toggleLike: async (song) => {
    const { likedSongs } = get();
    const exists = likedSongs.some(s => s.id === song.id);
    const updated = exists
      ? likedSongs.filter(s => s.id !== song.id)
      : [song, ...likedSongs];
    set({ likedSongs: updated });
    try {
      await AsyncStorage.setItem('likedSongs', JSON.stringify(updated));
    } catch {}
  },

  isLiked: (id) => get().likedSongs.some(s => s.id === id),

  addToQueue: (song) => {
    const { queue } = get();
    set({ queue: [...queue, song] });
  },

  toggleShuffle: () => {
    const { shuffle, queue, originalQueue, currentSong } = get();
    if (!shuffle) {
      const rest = queue.filter(s => s.id !== currentSong?.id);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const newQueue = currentSong ? [currentSong, ...rest] : rest;
      set({ shuffle: true, queue: newQueue, queueIndex: 0 });
    } else {
      set({ shuffle: false, queue: originalQueue });
    }
  },

  toggleRepeat: () => {
    const { repeat } = get();
    const next: RepeatMode = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
    set({ repeat: next });
  },

  createPlaylist: async (name) => {
    const { playlists } = get();
    const newPlaylist: Playlist = { id: Date.now().toString(), name, songs: [] };
    const updated = [newPlaylist, ...playlists];
    set({ playlists: updated });
    try {
      await AsyncStorage.setItem('playlists', JSON.stringify(updated));
    } catch {}
  },

  addToPlaylist: async (playlistId, song) => {
    const { playlists } = get();
    const updated = playlists.map(pl => {
      if (pl.id === playlistId) {
        if (pl.songs.some(s => s.id === song.id)) return pl;
        return { ...pl, songs: [...pl.songs, song] };
      }
      return pl;
    });
    set({ playlists: updated });
    try {
      await AsyncStorage.setItem('playlists', JSON.stringify(updated));
    } catch {}
  },

  downloadSong: async (song) => {
    const { downloadedSongs } = get();
    
    if (downloadedSongs.some(s => s.id === song.id)) return;

    try {
      const streamData = await api.getStream(song.id);
      const streamUrl = streamData.streamUrl;

      const safeId = song.id.replace(/[^a-zA-Z0-9]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeId}.m4a`;

      const downloadRes = await FileSystem.downloadAsync(streamUrl, fileUri);

      const downloadedSong: DownloadedSong = { ...song, localUri: downloadRes.uri };
      const updatedDownloads = [downloadedSong, ...downloadedSongs];
      
      set({ downloadedSongs: updatedDownloads });
      await AsyncStorage.setItem('downloadedSongs', JSON.stringify(updatedDownloads));
      
      console.log('Download complete for:', song.name);
    } catch (err) {
      console.error('Download failed:', err);
    }
  },
}));