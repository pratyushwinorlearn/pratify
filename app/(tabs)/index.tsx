import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { api, Song } from '../../services/api';
import { usePlayerStore } from '../../store/playerStore';
import { SongRow } from '../../components/SongRow';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pulled in downloadedSongs to show a dynamic count on the new tile!
  const { playFolder, playSong, currentSong, downloadedSongs } = usePlayerStore();

  const load = async () => {
    try {
      let songs: Song[] = [];
      try {
        const data = await api.getTrending();
        songs = Array.isArray(data) ? data : [];
      } catch {
        const data = await api.search('top hindi songs', 'songs', 1);
        songs = data.results || [];
      }
      setTrending(songs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleBentoPress = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
      >
        {/* Sleek Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Pratify</Text>
          <Pressable style={styles.profileBtn}>
            <Feather name="user" size={20} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {/* ─── BENTO BOX DASHBOARD ─── */}
        <View style={styles.bentoGrid}>
          
          {/* 1. Main Feature Tile (Accent Color) */}
          <Pressable 
            style={({ pressed }) => [styles.bentoLarge, pressed && styles.pressed]}
            onPress={() => handleBentoPress(() => playFolder(trending, true))}
          >
            <View style={styles.bentoIconWrap}>
              {/* FIXED: Changed color from Colors.black to Colors.white */}
              <Ionicons name="play" size={32} color={Colors.white} style={{ marginLeft: 4 }} />
            </View>
            <View style={styles.bentoTextWrap}>
              <Text style={styles.bentoTitleDark}>Trending Mix</Text>
              <Text style={styles.bentoSubDark}>Play the hottest tracks right now</Text>
            </View>
            <View style={styles.accentGlow} />
          </Pressable>

          {/* 2. Middle Row: Library & Downloads */}
          <View style={styles.bentoRow}>
            <Pressable 
              style={({ pressed }) => [styles.bentoSmall, pressed && styles.pressed]}
              onPress={() => handleBentoPress(() => router.push('/library'))}
            >
              <Ionicons name="heart" size={28} color={Colors.accent} />
              <View>
                <Text style={styles.bentoTitle}>Library</Text>
                <Text style={styles.bentoSub}>Your saved tracks</Text>
              </View>
            </Pressable>

            {/* NEW: Downloads Tile */}
            <Pressable 
              style={({ pressed }) => [styles.bentoSmall, pressed && styles.pressed]}
              onPress={() => handleBentoPress(() => router.push('/offline'))}
            >
              <Feather name="download-cloud" size={28} color={Colors.textPrimary} />
              <View>
                <Text style={styles.bentoTitle}>Offline</Text>
                <Text style={styles.bentoSub}>
                  {downloadedSongs.length} {downloadedSongs.length === 1 ? 'Track' : 'Tracks'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* 3. Bottom Banner: Discover */}
          <Pressable 
            style={({ pressed }) => [styles.bentoBanner, pressed && styles.pressed]}
            onPress={() => handleBentoPress(() => router.push('/search'))}
          >
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bentoTitle}>Discover</Text>
              <Text style={styles.bentoSub}>Find new music and artists</Text>
            </View>
            <View style={styles.bannerIconWrap}>
               {/* FIXED: Changed color from Colors.black to Colors.white */}
               <Ionicons name="search" size={24} color={Colors.white} />
            </View>
          </Pressable>
        </View>

        {/* ─── QUICK PLAY (Recent/Top Tracks) ─── */}
        <Text style={styles.sectionLabel}>QUICK PLAY</Text>
        <View style={styles.list}>
          {trending.slice(0, 5).map((song) => (
            <SongRow
              key={song.id}
              song={song}
              onPress={() => playSong(song, trending)}
              isActive={currentSong?.id === song.id}
            />
          ))}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingTop: Spacing.sm },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1.2,
    color: Colors.accent,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── BENTO GRID STYLES ───
  bentoGrid: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  
  // Large Accent Tile
  bentoLarge: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    height: 180,
    justifyContent: 'space-between',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  bentoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoTextWrap: { zIndex: 2 },
  
  // FIXED: Changed bentoTitleDark color to Colors.white
  bentoTitleDark: { fontSize: 24, fontWeight: '800', color: Colors.white, letterSpacing: -0.5, marginBottom: 4 },
  
  // FIXED: Changed bentoSubDark color to semi-transparent white
  bentoSubDark: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  
  accentGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 1,
  },

  // Middle Row Tiles
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  bentoSmall: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    height: 140,
    justifyContent: 'space-between',
  },
  bentoTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3, marginBottom: 2 },
  bentoSub: { fontSize: 12, color: Colors.textSecondary },

  // Bottom Banner Tile
  bentoBanner: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },

  // List Styles
  sectionLabel: { ...Typography.labelSmall, color: Colors.textMuted, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  list: { paddingHorizontal: Spacing.md },
});