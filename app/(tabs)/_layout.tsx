import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { Player } from '../../components/Player'; // <-- Only import the unified Player
import { usePlayerStore } from '../../store/playerStore';

function TabIcon({ focused, label, icon }: { focused: boolean; label: string; icon: keyof typeof Feather.glyphMap }) {
  return (
    <View style={styles.tabIcon}>
      <Feather name={icon} size={22} color={focused ? Colors.accent : Colors.textMuted} />
      <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { currentSong } = usePlayerStore(); // No longer need isPlayerOpen here!

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" icon="home" /> }} />
        <Tabs.Screen name="search" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Search" icon="search" /> }} />
        <Tabs.Screen name="library" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Library" icon="layers" /> }} />
        <Tabs.Screen name="offline" options={{ href: null }} />
      </Tabs>

      {/* The Unified Player engine handles its own morphing state */}
      {currentSong && <Player />} 
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabIcon: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 64 },
  label: { fontSize: 10, fontWeight: '500', color: Colors.textMuted, textAlign: 'center' },
  labelActive: { color: Colors.accent },
});