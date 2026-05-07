import React, { useEffect, useState } from 'react';
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCompetitions,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getActivitiesForCompetition,
  createActivity,
  deleteActivity,
} from '../../services/competitions';
import { Competition, Activity } from '../../types';
import { colors, commonStyles } from '../../styles/theme';

type Tab = 'competitions' | 'activities';

export default function AdminScreen() {
  const { userProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Competition modal state
  const [compModalVisible, setCompModalVisible] = useState(false);
  const [compName, setCompName] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compStart, setCompStart] = useState('');
  const [compEnd, setCompEnd] = useState('');
  const [compActive, setCompActive] = useState(true);
  const [savingComp, setSavingComp] = useState(false);

  // Activity modal state
  const [actModalVisible, setActModalVisible] = useState(false);
  const [actName, setActName] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actPoints, setActPoints] = useState('');
  const [actCategory, setActCategory] = useState('');
  const [savingAct, setSavingAct] = useState(false);

  async function loadCompetitions() {
    try {
      const comps = await getCompetitions();
      setCompetitions(comps);
      if (!selectedComp && comps.length > 0) {
        setSelectedComp(comps[0]);
        const acts = await getActivitiesForCompetition(comps[0].id);
        setActivities(acts);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities(comp: Competition) {
    try {
      const acts = await getActivitiesForCompetition(comp.id);
      setActivities(acts);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  useEffect(() => {
    loadCompetitions();
  }, []);

  function openNewCompModal() {
    setCompName('');
    setCompDesc('');
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setCompStart(today);
    setCompEnd(nextMonth);
    setCompActive(true);
    setCompModalVisible(true);
  }

  async function handleSaveCompetition() {
    if (!compName.trim()) {
      Alert.alert('Error', 'Competition name is required.');
      return;
    }
    const startTs = new Date(compStart).getTime();
    const endTs = new Date(compEnd).getTime();
    if (isNaN(startTs) || isNaN(endTs)) {
      Alert.alert('Error', 'Invalid dates. Use YYYY-MM-DD format.');
      return;
    }
    if (endTs <= startTs) {
      Alert.alert('Error', 'End date must be after start date.');
      return;
    }
    setSavingComp(true);
    try {
      await createCompetition({
        name: compName.trim(),
        description: compDesc.trim(),
        startDate: startTs,
        endDate: endTs,
        createdBy: userProfile?.uid ?? '',
        isActive: compActive,
      });
      setCompModalVisible(false);
      await loadCompetitions();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingComp(false);
    }
  }

  async function handleToggleActive(comp: Competition) {
    try {
      await updateCompetition(comp.id, { isActive: !comp.isActive });
      await loadCompetitions();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleDeleteCompetition(comp: Competition) {
    Alert.alert('Delete Competition', `Delete "${comp.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCompetition(comp.id);
            if (selectedComp?.id === comp.id) setSelectedComp(null);
            await loadCompetitions();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  function openNewActModal() {
    setActName('');
    setActDesc('');
    setActPoints('');
    setActCategory('');
    setActModalVisible(true);
  }

  async function handleSaveActivity() {
    if (!actName.trim()) {
      Alert.alert('Error', 'Activity name is required.');
      return;
    }
    const pts = parseInt(actPoints, 10);
    if (isNaN(pts) || pts <= 0) {
      Alert.alert('Error', 'Points must be a positive number.');
      return;
    }
    if (!selectedComp) {
      Alert.alert('Error', 'Select a competition first.');
      return;
    }
    setSavingAct(true);
    try {
      await createActivity({
        name: actName.trim(),
        description: actDesc.trim(),
        points: pts,
        category: actCategory.trim(),
        competitionId: selectedComp.id,
      });
      setActModalVisible(false);
      await loadActivities(selectedComp);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingAct(false);
    }
  }

  async function handleDeleteActivity(act: Activity) {
    Alert.alert('Delete Activity', `Delete "${act.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteActivity(act.id);
            if (selectedComp) await loadActivities(selectedComp);
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
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
      <Text style={styles.screenTitle}>Admin Panel</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'competitions' && styles.tabActive]}
          onPress={() => setTab('competitions')}
        >
          <Text style={[styles.tabText, tab === 'competitions' && styles.tabTextActive]}>
            Competitions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'activities' && styles.tabActive]}
          onPress={() => setTab('activities')}
        >
          <Text style={[styles.tabText, tab === 'activities' && styles.tabTextActive]}>
            Activities
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {tab === 'competitions' ? (
          <View style={commonStyles.screenPadding}>
            <TouchableOpacity style={styles.addButton} onPress={openNewCompModal}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>New Competition</Text>
            </TouchableOpacity>

            {competitions.length === 0 ? (
              <View style={[commonStyles.card, styles.emptyState]}>
                <Ionicons name="trophy-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No competitions yet</Text>
              </View>
            ) : (
              competitions.map((comp) => (
                <View key={comp.id} style={commonStyles.card}>
                  <View style={styles.compHeader}>
                    <Text style={styles.compName}>{comp.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: comp.isActive ? colors.success + '20' : colors.textMuted + '20' }]}>
                      <Text style={[styles.statusText, { color: comp.isActive ? colors.success : colors.textMuted }]}>
                        {comp.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  {comp.description ? (
                    <Text style={styles.compDesc}>{comp.description}</Text>
                  ) : null}
                  <Text style={styles.compDates}>
                    {new Date(comp.startDate).toLocaleDateString()} — {new Date(comp.endDate).toLocaleDateString()}
                  </Text>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setSelectedComp(comp);
                        loadActivities(comp);
                        setTab('activities');
                      }}
                    >
                      <Ionicons name="list-outline" size={16} color={colors.primary} />
                      <Text style={styles.actionBtnText}>Activities</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleToggleActive(comp)}
                    >
                      <Ionicons
                        name={comp.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={16}
                        color={colors.warning}
                      />
                      <Text style={[styles.actionBtnText, { color: colors.warning }]}>
                        {comp.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDeleteCompetition(comp)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                      <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={commonStyles.screenPadding}>
            {/* Competition selector for activities */}
            {competitions.length > 0 && (
              <View style={styles.compPickerRow}>
                <Text style={styles.compPickerLabel}>Competition:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {competitions.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.compChip, selectedComp?.id === c.id && styles.compChipActive]}
                      onPress={() => { setSelectedComp(c); loadActivities(c); }}
                    >
                      <Text style={[styles.compChipText, selectedComp?.id === c.id && styles.compChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {selectedComp ? (
              <>
                <TouchableOpacity style={styles.addButton} onPress={openNewActModal}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>New Activity</Text>
                </TouchableOpacity>

                {activities.length === 0 ? (
                  <View style={[commonStyles.card, styles.emptyState]}>
                    <Ionicons name="list-outline" size={40} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No activities yet</Text>
                  </View>
                ) : (
                  activities.map((act) => (
                    <View key={act.id} style={[commonStyles.card, styles.actRow]}>
                      <View style={styles.actInfo}>
                        <Text style={styles.actName}>{act.name}</Text>
                        {act.category ? (
                          <Text style={styles.actCategory}>{act.category}</Text>
                        ) : null}
                        {act.description ? (
                          <Text style={styles.actDesc}>{act.description}</Text>
                        ) : null}
                      </View>
                      <View style={styles.actRight}>
                        <View style={styles.ptsBadge}>
                          <Text style={styles.ptsBadgeText}>{act.points} pts</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteActivity(act)} style={styles.deleteBtn}>
                          <Ionicons name="trash-outline" size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            ) : (
              <View style={[commonStyles.card, styles.emptyState]}>
                <Text style={styles.emptyText}>Select a competition to manage activities</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Competition Modal */}
      <Modal
        visible={compModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>New Competition</Text>
            <TextInput style={commonStyles.input} placeholder="Name *" placeholderTextColor={colors.textMuted} value={compName} onChangeText={setCompName} />
            <TextInput style={[commonStyles.input, { height: 80 }]} placeholder="Description" placeholderTextColor={colors.textMuted} multiline value={compDesc} onChangeText={setCompDesc} />
            <TextInput style={commonStyles.input} placeholder="Start date (YYYY-MM-DD) *" placeholderTextColor={colors.textMuted} value={compStart} onChangeText={setCompStart} />
            <TextInput style={commonStyles.input} placeholder="End date (YYYY-MM-DD) *" placeholderTextColor={colors.textMuted} value={compEnd} onChangeText={setCompEnd} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Active immediately</Text>
              <Switch value={compActive} onValueChange={setCompActive} trackColor={{ true: colors.primary }} />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[commonStyles.buttonOutline, { flex: 1, marginRight: 8 }]} onPress={() => setCompModalVisible(false)}>
                <Text style={commonStyles.buttonOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[commonStyles.button, { flex: 1, marginLeft: 8 }]} onPress={handleSaveCompetition} disabled={savingComp}>
                {savingComp ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Create Activity Modal */}
      <Modal
        visible={actModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>New Activity</Text>
            <Text style={styles.modalSubtitle}>For: {selectedComp?.name}</Text>
            <TextInput style={commonStyles.input} placeholder="Activity name *" placeholderTextColor={colors.textMuted} value={actName} onChangeText={setActName} />
            <TextInput style={[commonStyles.input, { height: 80 }]} placeholder="Description" placeholderTextColor={colors.textMuted} multiline value={actDesc} onChangeText={setActDesc} />
            <TextInput style={commonStyles.input} placeholder="Points *" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={actPoints} onChangeText={setActPoints} />
            <TextInput style={commonStyles.input} placeholder="Category (e.g. Fitness, Learning)" placeholderTextColor={colors.textMuted} value={actCategory} onChangeText={setActCategory} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[commonStyles.buttonOutline, { flex: 1, marginRight: 8 }]} onPress={() => setActModalVisible(false)}>
                <Text style={commonStyles.buttonOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[commonStyles.button, { flex: 1, marginLeft: 8 }]} onPress={handleSaveActivity} disabled={savingAct}>
                {savingAct ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4, backgroundColor: colors.border + '60', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20, marginBottom: 16, justifyContent: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: colors.textMuted, marginTop: 8, fontSize: 14, textAlign: 'center' },
  compHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  compName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  compDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  compDates: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  compPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  compPickerLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  compChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  compChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  compChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  compChipTextActive: { color: '#fff' },
  actRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actInfo: { flex: 1 },
  actName: { fontSize: 15, fontWeight: '700', color: colors.text },
  actCategory: { fontSize: 11, color: colors.secondary, fontWeight: '600', marginTop: 2 },
  actDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actRight: { alignItems: 'flex-end', gap: 8 },
  ptsBadge: { backgroundColor: colors.success + '20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  ptsBadgeText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  deleteBtn: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  switchLabel: { fontSize: 15, color: colors.text },
  modalButtons: { flexDirection: 'row', marginTop: 8 },
});
