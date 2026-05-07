import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Submission, LeaderboardEntry } from '../types';

export async function submitActivity(
  data: Omit<Submission, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'submissions'), data);
  return ref.id;
}

export async function getUserSubmissions(
  userId: string,
  competitionId: string
): Promise<Submission[]> {
  const snap = await getDocs(
    query(
      collection(db, 'submissions'),
      where('userId', '==', userId),
      where('competitionId', '==', competitionId),
      orderBy('timestamp', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission));
}

export async function getLeaderboard(
  competitionId: string
): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(
    query(
      collection(db, 'submissions'),
      where('competitionId', '==', competitionId)
    )
  );

  const totals: Record<string, LeaderboardEntry> = {};
  snap.docs.forEach((d) => {
    const s = d.data() as Omit<Submission, 'id'>;
    if (!totals[s.userId]) {
      totals[s.userId] = {
        userId: s.userId,
        displayName: s.displayName,
        totalPoints: 0,
        submissionCount: 0,
      };
    }
    totals[s.userId].totalPoints += s.points;
    totals[s.userId].submissionCount += 1;
  });

  return Object.values(totals).sort((a, b) => b.totalPoints - a.totalPoints);
}
