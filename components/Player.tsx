import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet,
  Dimensions, Animated, PanResponder, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius } from '../constants/theme';
import { usePlayerStore } from '../store/playerStore';
import { SongRow } from './SongRow';

const { width, height } = Dimensions.get('window');
const SEEK_WIDTH = width - Spacing.md * 2 - 32;
const TAB_BAR_HEIGHT = 60;
const MINI_HEIGHT = 64;

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export function Player() {
  const {
    currentSong, isPlaying, isLoading, position, duration, queue, playSong,
    togglePlay, seekTo, playNext, playPrev, isPlayerOpen, setPlayerOpen,
    toggleLike, isLiked, shuffle, repeat, toggleShuffle, toggleRepeat,
  } = usePlayerStore();

  const [seeking, setSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Core Animation Values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const queueSlideY = useRef(new Animated.Value(height)).current;

  // Cinematic Morph Animation
  useEffect(() => {
    if (isPlayerOpen) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(expandAnim, {
      toValue: isPlayerOpen ? 1 : 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [isPlayerOpen]);

  const toggleQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const opening = !isQueueOpen;
    setIsQueueOpen(opening);
    Animated.spring(queueSlideY, {
      toValue: opening ? 0 : height,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  // Swipe Down to Close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isQueueOpen && isPlayerOpen,
      onMoveShouldSetPanResponder: (_, g) => !isQueueOpen && isPlayerOpen && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => { if (g.dy > 0) dragY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setPlayerOpen(false);
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // Seek bar pan
  const seekPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: e => {
      setSeeking(true);
      const x = Math.max(0, Math.min(e.nativeEvent.locationX, SEEK_WIDTH));
      setSeekPos((x / SEEK_WIDTH) * duration);
    },
    onPanResponderMove: e => {
      const x = Math.max(0, Math.min(e.nativeEvent.locationX, SEEK_WIDTH));
      setSeekPos((x / SEEK_WIDTH) * duration);
    },
    onPanResponderRelease: () => {
      Haptics.selectionAsync();
      seekTo(seekPos);
      setSeeking(false);
    },
  });

  if (!currentSong) return null;

  const liked = isLiked(currentSong.id);
  const progress = duration > 0 ? (seeking ? seekPos : position) / duration : 0;

  // Interpolations for the Cinematic Reveal
  const translateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height - TAB_BAR_HEIGHT - MINI_HEIGHT, 0]
  });
  
  const miniOpacity = expandAnim.interpolate({
    inputRange: [0, 0.2],
    outputRange: [1, 0]
  });

  const fullOpacity = expandAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [0, 1]
  });

  const fullScale = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1]
  });

  const pitchBlackFade = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const handleControl = (action: () => void, haptic: any = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(haptic);
    action();
  };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: Animated.add(translateY, dragY) }] }]}
      pointerEvents={isPlayerOpen ? 'auto' : 'box-none'}
      {...panResponder.panHandlers}
    >
      {/* ─── BASE BACKGROUNDS ─── */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.elevated, opacity: expandAnim }]} pointerEvents="none" />
      
      {/* Monochrome Cinematic Overlay & Blurred Art */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pitchBlackFade, backgroundColor: Colors.bg }]} pointerEvents="none">
        {currentSong.image && (
            <Image source={{ uri: currentSong.image }} style={styles.bgImage} blurRadius={60} />
        )}
        <View style={styles.bgDim} />
      </Animated.View>

      {/* ─── MINI PLAYER UI ─── */}
      <Animated.View style={[styles.miniContainer, { opacity: miniOpacity }]} pointerEvents={isPlayerOpen ? 'none' : 'auto'}>
        <Pressable style={styles.miniInner} onPress={() => handleControl(() => setPlayerOpen(true))}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          
          <View style={styles.miniContent}>
            {currentSong.image ? (
                <Image source={{ uri: currentSong.image }} style={styles.miniArt} />
            ) : (
              <View style={[styles.miniArt, styles.artFallback]}><Ionicons name="musical-notes" size={20} color={Colors.textMuted} /></View>
            )}
            
            <View style={styles.miniInfo}>
              <Text style={styles.miniName} numberOfLines={1}>{currentSong.name}</Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                {currentSong.artists.primary.map(a => a.name).join(', ')}
              </Text>
            </View>

            <View style={styles.miniControls}>
              <Pressable onPress={() => handleControl(togglePlay, Haptics.ImpactFeedbackStyle.Medium)} hitSlop={15}>
                <Ionicons name={isLoading ? "ellipsis-horizontal" : isPlaying ? "pause-sharp" : "play-sharp"} size={26} color={Colors.accent} />
              </Pressable>
              <Pressable onPress={() => handleControl(playNext)} hitSlop={15}>
                <Ionicons name="play-skip-forward-sharp" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* ─── FULL PLAYER UI ─── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fullOpacity, transform: [{ scale: fullScale }] }]} pointerEvents={isPlayerOpen ? 'auto' : 'none'}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <Pressable onPress={() => setPlayerOpen(false)} hitSlop={16} style={styles.iconBtn}>
              <Feather name="chevron-down" size={28} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.topTitle}>NOW PLAYING</Text>
            <Pressable onPress={toggleQueue} hitSlop={16} style={styles.iconBtn}>
              <Feather name="list" size={22} color={isQueueOpen ? Colors.accent : Colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.artWrap}>
            {currentSong.image ? (
                <Image source={{ uri: currentSong.image }} style={styles.fullArt} />
            ) : (
              <View style={[styles.fullArt, styles.artFallback]}><Ionicons name="musical-notes" size={64} color={Colors.textMuted} /></View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoText}>
              <Text style={styles.songName} numberOfLines={1}>{currentSong.name}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {currentSong.artists.primary.map(a => a.name).join(', ')}
              </Text>
            </View>
            <Pressable onPress={() => handleControl(() => toggleLike(currentSong))} hitSlop={15}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={30} color={liked ? Colors.accent : Colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.seekSection}>
            <View style={styles.seekBarWrap} {...seekPan.panHandlers}>
              <View style={styles.seekTrack}>
                <View style={[styles.seekFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
              </View>
              <View style={[styles.seekThumb, { left: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <View style={styles.seekTimes}>
              <Text style={styles.timeText}>{fmt(seeking ? seekPos : position)}</Text>
              <Text style={styles.timeText}>{fmt(duration || currentSong.duration * 1000)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable onPress={() => handleControl(toggleShuffle)} hitSlop={15}>
              <Ionicons name="shuffle" size={26} color={shuffle ? Colors.accent : Colors.textMuted} />
              {shuffle && <View style={styles.activeDot} />}
            </Pressable>

            <Pressable onPress={() => handleControl(playPrev)} hitSlop={15}>
              <Ionicons name="play-skip-back-sharp" size={38} color={Colors.textPrimary} />
            </Pressable>

            <Pressable onPress={() => handleControl(togglePlay, Haptics.ImpactFeedbackStyle.Heavy)} style={[styles.playBtn, isLoading && styles.playBtnLoading]}>
              <Ionicons name={isLoading ? "ellipsis-horizontal" : isPlaying ? "pause-sharp" : "play-sharp"} size={36} color={Colors.white} style={isPlaying ? {} : { marginLeft: 4 }} />
            </Pressable>

            <Pressable onPress={() => handleControl(playNext)} hitSlop={15}>
              <Ionicons name="play-skip-forward-sharp" size={38} color={Colors.textPrimary} />
            </Pressable>

            <Pressable onPress={() => handleControl(toggleRepeat)} hitSlop={15} style={styles.repeatWrap}>
              <Ionicons name="repeat" size={26} color={repeat !== 'off' ? Colors.accent : Colors.textMuted} />
              {repeat === 'one' && <Text style={styles.repeatOneBadge}>1</Text>}
              {repeat !== 'off' && <View style={styles.activeDot} />}
            </Pressable>
          </View>
        </SafeAreaView>

        {/* ─── SLIDING QUEUE SHEET ─── */}
        <Animated.View style={[styles.queueSheet, { transform: [{ translateY: queueSlideY }] }]}>
          <View style={styles.queueHeader}>
            <Text style={styles.queueTitle}>Up Next</Text>
            <Pressable onPress={toggleQueue} hitSlop={15}>
              <Feather name="x" size={28} color={Colors.textPrimary} />
            </Pressable>
          </View>
          <FlatList
            data={queue}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            renderItem={({ item, index }) => (
              <SongRow
                song={item}
                onPress={() => handleControl(() => playSong(item, queue))}
                index={index + 1}
                isActive={currentSong?.id === item.id}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, height: height, zIndex: 100 },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.12 },
  bgDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245, 246, 248, 0.90)' },
  safe: { flex: 1 },

  // Mini Player
  miniContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: MINI_HEIGHT, backgroundColor: Colors.elevated, borderTopWidth: 1, borderTopColor: Colors.border },
  miniInner: { flex: 1 },
  progressBg: { height: 2, backgroundColor: Colors.border },
  progressFill: { height: '100%', backgroundColor: Colors.accent },
  miniContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, flex: 1, gap: Spacing.sm },
  miniArt: { width: 42, height: 42, borderRadius: Radius.sm, backgroundColor: Colors.surface },
  artFallback: { justifyContent: 'center', alignItems: 'center' },
  miniInfo: { flex: 1, justifyContent: 'center' },
  miniName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  miniArtist: { fontSize: 12, color: Colors.textMuted },
  miniControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },

  // Full Player
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, color: Colors.textMuted },

  artWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl, marginVertical: Spacing.sm },
  fullArt: { width: width - Spacing.xl * 2, height: width - Spacing.xl * 2, borderRadius: Radius.lg, backgroundColor: Colors.surface, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl, gap: Spacing.md },
  infoText: { flex: 1 },
  songName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.textPrimary, marginBottom: 6 },
  songArtist: { fontSize: 16, color: Colors.textSecondary },

  seekSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  seekBarWrap: { height: 28, justifyContent: 'center', position: 'relative' },
  seekTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  seekFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  seekThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.accent, top: '50%', marginTop: -7, marginLeft: -7, elevation: 2 },
  seekTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText: { fontSize: 12, color: Colors.textMuted, fontVariant: ['tabular-nums'], fontWeight: '500' },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  repeatWrap: { alignItems: 'center', justifyContent: 'center' },
  repeatOneBadge: { position: 'absolute', fontSize: 9, fontWeight: 'bold', color: Colors.accent, top: -2, right: -6 },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 4, position: 'absolute', bottom: -8 },
  playBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  playBtnLoading: { backgroundColor: Colors.accentDim },

  // Queue Sheet
  queueSheet: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.surface, zIndex: 10 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  queueTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
});