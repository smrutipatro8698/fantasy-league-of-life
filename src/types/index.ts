export interface User {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  startDate: number;
  endDate: number;
  createdBy: string;
  isActive: boolean;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  points: number;
  competitionId: string;
  category: string;
}

export interface Submission {
  id: string;
  userId: string;
  displayName: string;
  activityId: string;
  activityName: string;
  points: number;
  competitionId: string;
  timestamp: number;
  note?: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalPoints: number;
  submissionCount: number;
}
