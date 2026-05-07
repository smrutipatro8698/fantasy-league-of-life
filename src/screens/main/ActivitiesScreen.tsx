import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getActiveCompetitions, getActivitiesForCompetition } from '../../services/competitions';
import { submitActivity, getUserSubmissions } from '../../services/submissions';
import { Competition, Activity, Submission } from '../../types';
import { colors, commonStyles } from '../../styles/theme';

export default function ActivitiesScreen() {
  const { firebaseUser, userProfile } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load(comp?: Competition | null) {
    if (!firebaseUser) return;
    const target = comp ?? selectedComp;
    try {
      const comps = await getActiveCompetitions();
      setCompetitions(comps);
      const activeComp = target ?? comps[0] ?? null;
      if (activeComp) {
        setSelectedComp(activeComp);
        const [acts, subs] = await Promise.all([
          getActivitiesForCompetition(activeComp.id),
          getUserSubmissions(firebaseUser.uid, activeComp.id),
        ]);
        setActivities(acts);
        setSubmissions(subs);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [selectedComp, firebaseUser]);

  useEffect(() => {
    load();
  }, [firebaseUser]);

  function openNoteModal(activity: Activity) {
    setSelectedActivity(activity);
    setNote('');
    setNoteModalVisible(true);
  }

  async function handleSubmit() {
    if (!selectedActivity || !selectedComp || !firebaseUser || !userProfile) return;
    setSubmitting(true);
    try {
      await submitActivity({
        userId: firebaseUser.uid,
        displayName: userProfile.displayName,
        activityId: selectedActivity.id,
        activityName: selectedActivity.name,
        points: selectedActivity.points,
        competitionId: selectedComp.id,
        timestamp: Date.now(),
        note: note.trim() || undefined,
      });
      setNoteModalVisible(false);
      await load(selectedComp);
      Alert.alert('Done!', `+${selectedActivity.points} points earned!`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalPoints = submissions.reduce((sum, s) => sum + s.points, 0);

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
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Log Activity</Text>
        <View style={styles.myPointsBadge}>
          <Text style={styles.myPointsText}>{totalPoints} pts</Text>
        </View>
      </View>

      {/* Competition selector */}
      {competitions.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compSelector}
        >
          {competitions.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.compChip, selectedComp?.id === c.id && styles.compChipActive]}
              onPress={() => load(c)}
            >
              <Text
                style={[styles.compChipText, selectedComp?.id === c.id && styles.compChipTextActive]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={commonStyles.screenPadding}>
          {activities.length === 0 ? (
            <View style={[commonStyles.card, styles.emptyState]}>
              <Ionicons name="list-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No activities defined yet</Text>
              <Text style={styles.emptySubtext}>Ask your admin to add activities</Text>
            </View>
          ) : (
            activities.map((activity) => (
              <View key={activity.id} style={commonStyles.card}>
                <View style={styles.activityHeader}>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    {activity.category ? (
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryText}>{activity.category}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.pointsChip}>
                    <Text style={styles.pointsChipText}>{activity.points} pts</Text>
                  </View>
                </View>
                {activity.description ? (
                  <Text style={styles.activityDesc}>{activity.description}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.logButton}
                  onPress={() => openNoteModal(activity)}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.logButtonText}>Log this activity</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Note / confirm modal */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Activity</Text>
            <Text style={styles.modalActivityName}>{selectedActivity?.name}</Text>
            <Text style={styles.modalPoints}>+{selectedActivity?.points} points</Text>
            <TextInput
              style={[commonStyles.input, { marginTop: 16 }]}
              placeholder="Optional note (e.g. details, proof…)"
              placeholderTextColor={colors.textMuted}
              multiline
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[commonStyles.buttonOutline, { flex: 1, marginRight: 8 }]}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={commonStyles.buttonOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.button, { flex: 1, marginLeft: 8 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={commonStyles.buttonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  myPointsBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  myPointsText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
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
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, color: colors.textMuted, marginTop: 12, fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 11, color: colors.secondary, fontWeight: '600' },
  pointsChip: {
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  pointsChipText: { color: colors.success, fontWeight: '700', fontSize: 14 },
  activityDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  logButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  modalActivityName: { fontSize: 16, color: colors.text },
  modalPoints: { fontSize: 24, fontWeight: '800', color: colors.primary, marginTop: 4 },
  modalButtons: { flexDirection: 'row', marginTop: 8 },
});
