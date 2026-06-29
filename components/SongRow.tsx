import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Modal, TextInput, FlatList } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Song } from '../services/api';
import { usePlayerStore } from '../store/playerStore';

type Props = {
  song: Song;
  onPress: () => void;
  index?: number;
  isActive?: boolean;
};

type MenuState = 'main' | 'playlists' | 'create';

function formatDuration(secs: number) {
  if (!secs) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SongRow({ song, onPress, index, isActive }: Props) {
  const { 
    currentSong, isPlaying, toggleLike, isLiked, addToQueue, 
    playlists, createPlaylist, addToPlaylist, 
    downloadSong, downloadedSongs 
  } = usePlayerStore();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuState, setMenuState] = useState<MenuState>('main');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const active = isActive ?? currentSong?.id === song.id;
  const liked = isLiked(song.id);
  const isDownloaded = downloadedSongs.some(s => s.id === song.id);

  const handleClose = () => {
    setMenuVisible(false);
    setTimeout(() => { setMenuState('main'); setNewPlaylistName(''); }, 300);
  };

  const handleAction = (action: () => void) => {
    action();
    handleClose();
  };

  const renderModalContent = () => {
    if (menuState === 'create') {
      return (
        <View style={styles.modalContent}>
          <View style={styles.modalHeaderRow}>
            <Pressable onPress={() => setMenuState('main')} hitSlop={10}>
              <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <View style={{ width: 24 }} />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Playlist name..."
            placeholderTextColor={Colors.textMuted}
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
            autoFocus
          />
          
          <Pressable 
            style={[styles.saveBtn, !newPlaylistName.trim() && styles.saveBtnDisabled]}
            disabled={!newPlaylistName.trim()}
            onPress={() => {
              createPlaylist(newPlaylistName.trim());
              setNewPlaylistName('');
              setMenuState('playlists'); 
            }}
          >
            <Text style={styles.saveBtnText}>Create</Text>
          </Pressable>
        </View>
      );
    }

    if (menuState === 'playlists') {
      return (
        <View style={styles.modalContent}>
          <View style={styles.modalHeaderRow}>
            <Pressable onPress={() => setMenuState('main')} hitSlop={10}>
              <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.modalTitle}>Add to Playlist</Text>
            <Pressable onPress={() => setMenuState('create')} hitSlop={10}>
              <Feather name="plus" size={24} color={Colors.accent} />
            </Pressable>
          </View>

          {playlists.length === 0 ? (
            <Text style={styles.emptyText}>No playlists yet.</Text>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <Pressable 
                  style={styles.playlistRow} 
                  onPress={() => handleAction(() => addToPlaylist(item.id, song))}
                >
                  <Feather name="music" size={20} color={Colors.textSecondary} />
                  <Text style={styles.playlistName}>{item.name}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      );
    }

    return (
      <View style={styles.modalContent}>
        <Text style={styles.modalTitleTop} numberOfLines={1}>{song.name}</Text>
        
        <Pressable style={styles.modalOption} onPress={() => handleAction(() => toggleLike(song))}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? Colors.accent : Colors.textPrimary} />
          <Text style={styles.modalOptionText}>{liked ? 'Remove from Liked' : 'Like Song'}</Text>
        </Pressable>

        <Pressable 
          style={styles.modalOption} 
          onPress={() => {
            if (!isDownloaded) handleAction(() => downloadSong(song));
          }}
        >
          <Feather 
            name={isDownloaded ? "check-circle" : "download"} 
            size={22} 
            color={isDownloaded ? Colors.accent : Colors.textPrimary} 
          />
          <Text style={[styles.modalOptionText, isDownloaded && { color: Colors.accent }]}>
            {isDownloaded ? 'Downloaded' : 'Download Song'}
          </Text>
        </Pressable>

        <Pressable style={styles.modalOption} onPress={() => handleAction(() => addToQueue(song))}>
          <Feather name="list" size={22} color={Colors.textPrimary} />
          <Text style={styles.modalOptionText}>Add to Queue</Text>
        </Pressable>

        <Pressable style={styles.modalOption} onPress={() => setMenuState('playlists')}>
          <Feather name="plus-square" size={22} color={Colors.textPrimary} />
          <Text style={styles.modalOptionText}>Add to Playlist</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed, active && styles.rowActive]}
        onPress={onPress}
      >
        <View style={styles.thumbWrap}>
          {song.image ? (
              <Image source={{ uri: song.image }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons name="musical-notes" size={20} color={Colors.textMuted} />
            </View>
          )}
          {active && (
            <View style={styles.activeOverlay}>
              <Ionicons name={isPlaying ? "stats-chart" : "play"} size={14} color={Colors.white} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>{song.name}</Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artists.primary.map(a => a.name).join(', ')}
            {song.album ? `  ·  ${song.album.name}` : ''}
          </Text>
        </View>

        <View style={styles.right}>
          {isDownloaded && (
             <Feather name="download-cloud" size={12} color={Colors.accent} style={{ marginRight: 4 }} />
          )}
          <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
          <Pressable onPress={(e) => { e.stopPropagation(); setMenuVisible(true); }} hitSlop={15} style={styles.menuBtn}>
            <Feather name="more-vertical" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={handleClose}>
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <Pressable style={{ width: '100%' }} onPress={(e) => e.stopPropagation()}>
            {renderModalContent()}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: Radius.sm, gap: Spacing.sm },
  rowPressed: { backgroundColor: Colors.surface },
  rowActive: { backgroundColor: 'rgba(0,0,0,0.04)' },

  thumbWrap: { position: 'relative' },
  thumb: { width: 46, height: 46, borderRadius: Radius.sm, backgroundColor: Colors.surface },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.elevated },
  activeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center' },

  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary, marginBottom: 3 },
  nameActive: { color: Colors.accent },
  artist: { fontSize: 13, color: Colors.textMuted },

  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  duration: { fontSize: 12, color: Colors.textMuted, fontVariant: ['tabular-nums'] },
  menuBtn: { padding: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, paddingBottom: 40, paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitleTop: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, gap: 16 },
  modalOptionText: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  playlistRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, gap: 16 },
  playlistName: { fontSize: 16, color: Colors.textPrimary },
  emptyText: { textAlign: 'center', color: Colors.textMuted, paddingVertical: 30 },
  
  input: { backgroundColor: Colors.elevated, color: Colors.textPrimary, marginHorizontal: 24, borderRadius: Radius.sm, padding: 12, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.accent, marginHorizontal: 24, borderRadius: Radius.full, paddingVertical: 12, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: Colors.border },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});