import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Competition, Activity } from '../types';

export async function createCompetition(
  data: Omit<Competition, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'competitions'), data);
  return ref.id;
}

export async function updateCompetition(
  id: string,
  data: Partial<Competition>
): Promise<void> {
  await updateDoc(doc(db, 'competitions', id), data);
}

export async function deleteCompetition(id: string): Promise<void> {
  await deleteDoc(doc(db, 'competitions', id));
}

export async function getCompetitions(): Promise<Competition[]> {
  const snap = await getDocs(
    query(collection(db, 'competitions'), orderBy('startDate', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Competition));
}

export async function getActiveCompetitions(): Promise<Competition[]> {
  const snap = await getDocs(
    query(collection(db, 'competitions'), where('isActive', '==', true))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Competition));
}

export async function createActivity(
  data: Omit<Activity, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'activities'), data);
  return ref.id;
}

export async function updateActivity(
  id: string,
  data: Partial<Activity>
): Promise<void> {
  await updateDoc(doc(db, 'activities', id), data);
}

export async function deleteActivity(id: string): Promise<void> {
  await deleteDoc(doc(db, 'activities', id));
}

export async function getActivitiesForCompetition(
  competitionId: string
): Promise<Activity[]> {
  const snap = await getDocs(
    query(collection(db, 'activities'), where('competitionId', '==', competitionId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
}
