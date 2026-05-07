import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getActiveCompetitions } from '../../services/competitions';
import { getLeaderboard } from '../../services/submissions';
import { Competition, LeaderboardEntry } from '../../types';
import { colors, commonStyles } from '../../styles/theme';

const MEDAL_COLORS = [colors.gold, colors.silver, colors.bronze];
const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { firebaseUser } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(comp?: Competition | null) {
    try {
      const comps = await getActiveCompetitions();
      setCompetitions(comps);
      const target = comp ?? comps[0] ?? null;
      setSelectedComp(target);
      if (target) {
        const board = await getLeaderboard(target.id);
        setEntries(board);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(selectedComp);
    setRefreshing(false);
  }, [selectedComp]);

  useEffect(() => {
    load();
  }, []);

  function renderEntry({ item, index }: { item: LeaderboardEntry; index: number }) {
    const isMe = item.userId === firebaseUser?.uid;
    const top3 = index < 3;

    return (
      <View style={[styles.row, isMe && styles.myRow, top3 && styles.topRow]}>
        <View style={styles.rankContainer}>
          {top3 ? (
            <Text style={styles.medal}>{MEDAL_ICONS[index]}</Text>
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.displayName, isMe && styles.myName]}>
            {item.displayName}{isMe ? ' (You)' : ''}
          </Text>
          <Text style={styles.subCount}>{item.submissionCount} activities logged</Text>
        </View>
        <View style={[styles.pointsPill, top3 && { backgroundColor: MEDAL_COLORS[index] + '25' }]}>
          <Text style={[styles.pointsPillText, top3 && { color: MEDAL_COLORS[index] }]}>
            {item.totalPoints}
          </Text>
          <Text style={[styles.pointsPillLabel, top3 && { color: MEDAL_COLORS[index] }]}>pts</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.screenTitle}>Leaderboard</Text>

      {/* Competition tabs */}
      {competitions.length > 1 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={competitions}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.compSelector}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.compChip, selectedComp?.id === item.id && styles.compChipActive]}
              onPress={() => load(item)}
            >
              <Text style={[styles.compChipText, selectedComp?.id === item.id && styles.compChipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyText}>No entries yet</Text>
          <Text style={styles.emptySubtext}>Start logging activities to appear here!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.userId}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  compSelector: { paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  compChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  compChipText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  compChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  myRow: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  topRow: {
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  medal: { fontSize: 22 },
  rankText: { fontSize: 18, fontWeight: '700', color: colors.textMuted },
  userInfo: { flex: 1, marginLeft: 10 },
  displayName: { fontSize: 15, fontWeight: '700', color: colors.text },
  myName: { color: colors.primary },
  subCount: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pointsPill: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pointsPillText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  pointsPillLabel: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.textMuted, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: 6 },
});
