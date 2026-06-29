import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList,
  ActivityIndicator, Pressable, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { api, Song } from '../../services/api';
import { usePlayerStore } from '../../store/playerStore';
import { SongRow } from '../../components/SongRow';

const HISTORY_KEY = 'searchHistory';
const MAX_HISTORY = 10;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then(val => {
      if (val) setHistory(JSON.parse(val));
    });
  }, []);

  const saveToHistory = async (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...history.filter(h => h !== q)].slice(0, MAX_HISTORY);
    setHistory(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const removeFromHistory = async (q: string) => {
    const updated = history.filter(h => h !== q);
    setHistory(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  };

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.search(q, 'songs');
      setResults(data.results || []);
      await saveToHistory(q.trim());
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [history]);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => doSearch(text), 500);
  };

  const handlePlay = (song: Song, index: number) => {
    playSong(song, results.slice(index));
    Keyboard.dismiss();
  };

  const handleHistoryTap = (q: string) => {
    setQuery(q);
    doSearch(q);
  };

  const showHistory = !searched && !loading && history.length > 0 && !query;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            placeholder="Songs, artists, albums..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={onChangeText}
            returnKeyType="search"
            onSubmitEditing={() => { if (query.trim()) doSearch(query); }}
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={Colors.accent}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => { setQuery(''); setResults([]); setSearched(false); }}
              hitSlop={8}
            >
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptyHint}>Try a different search</Text>
        </View>
      )}

      {/* Recent searches */}
      {!loading && showHistory && (
        <View style={styles.historyWrap}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>RECENT SEARCHES</Text>
            <Pressable onPress={clearHistory} hitSlop={8}>
              <Text style={styles.clearAllBtn}>Clear all</Text>
            </Pressable>
          </View>
          {history.map((q, i) => (
            <Pressable
              key={i}
              style={styles.historyRow}
              onPress={() => handleHistoryTap(q)}
            >
              <Text style={styles.historyIcon}>↺</Text>
              <Text style={styles.historyText} numberOfLines={1}>{q}</Text>
              <Pressable onPress={() => removeFromHistory(q)} hitSlop={8}>
                <Text style={styles.historyRemove}>✕</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      {/* Empty state - no history, not searched */}
      {!loading && !searched && !showHistory && (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Search anything</Text>
          <Text style={styles.emptyHint}>Songs · Artists · Albums</Text>
        </View>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <SongRow
              song={item}
              onPress={() => handlePlay(item, index)}
              index={index + 1}
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 140 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },

  searchWrap: { padding: Spacing.md, paddingBottom: Spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 20, color: Colors.textMuted },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    height: '100%',
  },
  clearBtn: { fontSize: 13, color: Colors.textMuted },

  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  emptyTitle: { ...Typography.bodyLarge, color: Colors.textSecondary },
  emptyHint: { ...Typography.bodyMedium },

  // History
  historyWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyTitle: { ...Typography.labelSmall, color: Colors.textMuted },
  clearAllBtn: { ...Typography.bodySmall, color: Colors.accent },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyIcon: { fontSize: 16, color: Colors.textMuted },
  historyText: { flex: 1, ...Typography.bodyLarge },
  historyRemove: { fontSize: 12, color: Colors.textMuted, padding: 4 },
});
