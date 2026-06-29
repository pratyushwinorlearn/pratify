import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ─── FIXED IMPORTS (Added an extra '../') ───
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { usePlayerStore } from '../../store/playerStore';
import { SongRow } from '../../components/SongRow';

export default function OfflineScreen() {
  const router = useRouter();
  const { 
    downloadedSongs, playSong, currentSong, 
    playFolder, isPlaying, togglePlay 
  } = usePlayerStore();

  const isCurrentFolderPlaying = downloadedSongs.some(s => s.id === currentSong?.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={15} style={styles.backBtn}>
          <Feather name="arrow-left" size={28} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.detailTitle}>Offline Tracks</Text>
        {/* Spacer for centering */}
        <View style={{ width: 28 }} /> 
      </View>

      {/* ─── FOLDER CONTROLS (PLAY / SHUFFLE) ─── */}
      {downloadedSongs.length > 0 && (
        <View style={styles.folderControls}>
          <Pressable 
            style={styles.mainPlayBtn}
            onPress={() => {
              if (isCurrentFolderPlaying && isPlaying) {
                togglePlay();
              } else {
                playFolder(downloadedSongs, false); // Play serially
              }
            }}
          >
            <Ionicons 
              name={isCurrentFolderPlaying && isPlaying ? "pause" : "play"} 
              size={22} 
              color={Colors.white} 
              style={{ marginLeft: isCurrentFolderPlaying && isPlaying ? 0 : 2 }} 
            />
            <Text style={styles.mainPlayText}>
              {isCurrentFolderPlaying && isPlaying ? "Pause" : "Play"}
            </Text>
          </Pressable>

          <Pressable 
            style={styles.shuffleBtn}
            onPress={() => playFolder(downloadedSongs, true)} // Play shuffled
          >
            <Ionicons name="shuffle" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>
      )}

      {/* List / Empty State */}
      {downloadedSongs.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="download-cloud" size={48} color={Colors.borderLight} style={{ marginBottom: Spacing.sm }} />
          <Text style={styles.emptyTitle}>No offline music yet</Text>
          <Text style={styles.emptyHint}>
            Tap the download icon on any song to save it for offline listening.
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadedSongs}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={({ item, index }) => (
            <SongRow
              song={item}
              onPress={() => playSong(item, downloadedSongs)}
              index={index + 1}
              isActive={currentSong?.id === item.id}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 140 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backBtn: { 
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  // Folder Controls
  folderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  mainPlayBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    height: 52,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mainPlayText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  shuffleBtn: {
    width: 52,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  list: { paddingHorizontal: Spacing.md },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: 100,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { ...Typography.bodyLarge, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  emptyHint: { ...Typography.bodyMedium, textAlign: 'center', marginTop: 4 },
});