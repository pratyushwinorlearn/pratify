import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService, setupPlayer } from '../services/playbackService';
import { Colors } from '../constants/theme';
import { usePlayerStore } from '../store/playerStore';

// MUST be registered at the absolute root outside of any React components 
// so the OS can talk to it when the app is minimized or killed
TrackPlayer.registerPlaybackService(() => PlaybackService);

function AppInit() {
  const loadData = usePlayerStore(s => s.loadData);
  
  useEffect(() => { 
    loadData(); 
    setupPlayer(); // Boot up the native audio engine
  }, []);
  
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <AppInit />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}