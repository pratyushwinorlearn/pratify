import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { usePlayerStore } from '../../store/playerStore';
import { SongRow } from '../../components/SongRow';

type ViewState = 'hub' | 'liked' | string; 

export default function LibraryScreen() {
  const { 
    likedSongs, playlists, playSong, currentSong, 
    createPlaylist, playFolder, isPlaying, togglePlay 
  } = usePlayerStore();
  
  const [activeView, setActiveView] = useState<ViewState>('hub');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setCreateModalVisible(false);
    }
  };

  if (activeView !== 'hub') {
    const isLiked = activeView === 'liked';
    const activePlaylist = !isLiked ? playlists.find(p => p.id === activeView) : null;
    
    const folderTitle = isLiked ? 'Liked Songs' : activePlaylist?.name || 'Playlist';
    const folderSongs = isLiked ? likedSongs : activePlaylist?.songs || [];

    // Check if any song from this specific folder is currently playing
    const isCurrentFolderPlaying = folderSongs.some(s => s.id === currentSong?.id);

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => setActiveView('hub')} hitSlop={15} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.detailTitle}>{folderTitle}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* ─── NEW: FOLDER CONTROLS (PLAY / SHUFFLE) ─── */}
        {folderSongs.length > 0 && (
          <View style={styles.folderControls}>
            <Pressable 
              style={styles.mainPlayBtn}
              onPress={() => {
                if (isCurrentFolderPlaying && isPlaying) {
                  togglePlay();
                } else {
                  playFolder(folderSongs, false); // Play serially
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
              onPress={() => playFolder(folderSongs, true)} // Play shuffled
            >
              <Ionicons name="shuffle" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>
        )}

        {folderSongs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>This folder is empty</Text>
            <Text style={styles.emptyHint}>
              {isLiked ? 'Tap the heart on any song to save it here' : 'Add songs to this playlist from the song menu'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={folderSongs}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            renderItem={({ item, index }) => (
              <SongRow
                song={item}
                onPress={() => playSong(item, folderSongs)}
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      <View style={styles.list}>
        
        <Pressable style={styles.libItem} onPress={() => setActiveView('liked')}>
          <View style={[styles.libIconWrap, { backgroundColor: Colors.accent }]}>
            <Ionicons name="heart" size={28} color={Colors.white} />
          </View>
          <View style={styles.libInfo}>
            <Text style={styles.libTitle}>Liked Songs</Text>
            <Text style={styles.libSubtitle}>
              {likedSongs.length} {likedSongs.length === 1 ? 'Song' : 'Songs'}
            </Text>
          </View>
        </Pressable>

        {playlists.map((pl) => (
          <Pressable key={pl.id} style={styles.libItem} onPress={() => setActiveView(pl.id)}>
            <View style={[styles.libIconWrap, { backgroundColor: Colors.surface }]}>
              <Feather name="music" size={24} color={Colors.textSecondary} />
            </View>
            <View style={styles.libInfo}>
              <Text style={styles.libTitle}>{pl.name}</Text>
              <Text style={styles.libSubtitle}>
                {pl.songs.length} {pl.songs.length === 1 ? 'Song' : 'Songs'}
              </Text>
            </View>
          </Pressable>
        ))}

        <Pressable style={styles.libItem} onPress={() => setCreateModalVisible(true)}>
          <View style={[styles.libIconWrap, styles.addIconWrap]}>
            <Feather name="plus" size={28} color={Colors.textPrimary} />
          </View>
          <View style={styles.libInfo}>
            <Text style={styles.libTitle}>Create Playlist</Text>
          </View>
        </Pressable>
      </View>

      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>New Playlist</Text>
              <Pressable onPress={() => setCreateModalVisible(false)} hitSlop={10}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Give your playlist a name..."
              placeholderTextColor={Colors.textMuted}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            
            <Pressable 
              style={[styles.saveBtn, !newPlaylistName.trim() && styles.saveBtnDisabled]}
              disabled={!newPlaylistName.trim()}
              onPress={handleCreatePlaylist}
            >
              <Text style={styles.saveBtnText}>Create</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.textPrimary,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm, // Reduced to bring controls closer
  },
  backBtn: { padding: 4 },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    height: 48,
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
    width: 48,
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  list: { paddingHorizontal: Spacing.md },

  libItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  libIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconWrap: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  libInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  libTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  libSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { ...Typography.bodyLarge, color: Colors.textSecondary, textAlign: 'center' },
  emptyHint: { ...Typography.bodyMedium, textAlign: 'center' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.elevated,
    color: Colors.textPrimary,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.border,
  },
  saveBtnText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
});