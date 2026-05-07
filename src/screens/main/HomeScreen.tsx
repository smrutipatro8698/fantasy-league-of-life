import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getActiveCompetitions } from '../../services/competitions';
import { getUserSubmissions } from '../../services/submissions';
import { logoutUser } from '../../services/auth';
import { Competition, Submission } from '../../types';
import { colors, commonStyles } from '../../styles/theme';

export default function HomeScreen() {
  const { userProfile, firebaseUser } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const comps = await getActiveCompetitions();
      setCompetitions(comps);
      if (comps.length > 0) {
        const comp = selectedCompetition ?? comps[0];
        setSelectedCompetition(comp);
        if (firebaseUser) {
          const subs = await getUserSubmissions(firebaseUser.uid, comp.id);
          setRecentSubmissions(subs.slice(0, 5));
          setTotalPoints(subs.reduce((sum, s) => sum + s.points, 0));
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [selectedCompetition, firebaseUser]);

  useEffect(() => {
    load();
  }, [firebaseUser]);

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutUser();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{userProfile?.displayName ?? 'Competitor'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Points card */}
        {selectedCompetition && (
          <View style={styles.pointsCard}>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsValue}>{totalPoints}</Text>
            <Text style={styles.competitionName}>{selectedCompetition.name}</Text>
          </View>
        )}

        {/* Active competitions */}
        <View style={commonStyles.screenPadding}>
          <Text style={commonStyles.sectionTitle}>Active Competitions</Text>
          {competitions.length === 0 ? (
            <View style={[commonStyles.card, styles.emptyState]}>
              <Ionicons name="trophy-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No active competitions</Text>
            </View>
          ) : (
            competitions.map((comp) => (
              <TouchableOpacity
                key={comp.id}
                style={[
                  commonStyles.card,
                  selectedCompetition?.id === comp.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedCompetition(comp)}
              >
                <Text style={styles.compName}>{comp.name}</Text>
                <Text style={styles.compDesc} numberOfLines={2}>{comp.description}</Text>
                <View style={styles.compDates}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.compDateText}>
                    {new Date(comp.startDate).toLocaleDateString()} -{' '}
                    {new Date(comp.endDate).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent activity */}
        {recentSubmissions.length > 0 && (
          <View style={commonStyles.screenPadding}>
            <Text style={commonStyles.sectionTitle}>Recent Activity</Text>
            {recentSubmissions.map((sub) => (
              <View key={sub.id} style={[commonStyles.card, styles.submissionRow]}>
                <View style={styles.submissionInfo}>
                  <Text style={styles.submissionActivity}>{sub.activityName}</Text>
                  {sub.note ? (
                    <Text style={styles.submissionNote} numberOfLines={1}>{sub.note}</Text>
                  ) : null}
                  <Text style={styles.submissionDate}>
                    {new Date(sub.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>+{sub.points}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 14,
    color: colors.textMuted,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  logoutBtn: {
    padding: 8,
  },
  pointsCard: {
    margin: 20,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
  },
  competitionName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 14,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  compName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  compDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  compDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compDateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  submissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submissionInfo: {
    flex: 1,
  },
  submissionActivity: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  submissionNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  submissionDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 12,
  },
  pointsBadgeText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
