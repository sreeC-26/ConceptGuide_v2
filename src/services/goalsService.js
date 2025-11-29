import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const getUserGoalsCollection = (userId) => {
  if (!userId) {
    throw new Error('User ID is required to access goals');
  }
  return collection(db, 'users', userId, 'goals');
};

// Goal types
export const GOAL_TYPES = {
  SESSIONS: 'sessions',
  TIME: 'time',
  MASTERY: 'mastery',
  STREAK: 'streak',
};

// Goal periods
export const GOAL_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

/**
 * Create a new goal
 */
export const createGoal = async (userId, goalData) => {
  if (!goalData?.id) {
    throw new Error('Goal data must include an id');
  }

  const goalsCollection = getUserGoalsCollection(userId);
  const goalDocRef = doc(goalsCollection, goalData.id);
  
  const goal = {
    ...goalData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await setDoc(goalDocRef, goal);
  return goal;
};

/**
 * Fetch all goals for a user
 */
export const fetchUserGoals = async (userId) => {
  const goalsCollection = getUserGoalsCollection(userId);
  const q = query(goalsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};

/**
 * Update an existing goal
 */
export const updateGoal = async (userId, goalId, updates) => {
  const goalsCollection = getUserGoalsCollection(userId);
  const goalDocRef = doc(goalsCollection, goalId);
  
  await updateDoc(goalDocRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Delete a goal
 */
export const deleteGoal = async (userId, goalId) => {
  const goalsCollection = getUserGoalsCollection(userId);
  const goalDocRef = doc(goalsCollection, goalId);
  await deleteDoc(goalDocRef);
};

/**
 * Calculate progress for a goal based on sessions
 */
export const calculateGoalProgress = (goal, sessions) => {
  if (!goal || !sessions) return { current: 0, target: goal?.target || 0, percentage: 0 };
  
  const now = new Date();
  const startOfPeriod = getStartOfPeriod(goal.period, goal.startDate);
  const endOfPeriod = getEndOfPeriod(goal.period, goal.startDate);
  
  // Filter sessions within the goal period
  const relevantSessions = sessions.filter(session => {
    const sessionDate = new Date(session.timestamp);
    return sessionDate >= startOfPeriod && sessionDate <= endOfPeriod;
  });
  
  let current = 0;
  
  switch (goal.type) {
    case GOAL_TYPES.SESSIONS:
      current = relevantSessions.filter(s => s.analysisComplete).length;
      break;
    case GOAL_TYPES.TIME:
      current = relevantSessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
      break;
    case GOAL_TYPES.MASTERY:
      const scoresWithMastery = relevantSessions.filter(s => s.masteryScore != null);
      current = scoresWithMastery.length > 0
        ? Math.round(scoresWithMastery.reduce((sum, s) => sum + s.masteryScore, 0) / scoresWithMastery.length)
        : 0;
      break;
    case GOAL_TYPES.STREAK:
      current = calculateStreak(sessions);
      break;
    default:
      current = 0;
  }
  
  const target = goal.target || 1;
  const percentage = Math.min(100, Math.round((current / target) * 100));
  
  return {
    current,
    target,
    percentage,
    isCompleted: current >= target,
    startOfPeriod,
    endOfPeriod,
    daysRemaining: Math.max(0, Math.ceil((endOfPeriod - now) / (1000 * 60 * 60 * 24))),
  };
};

/**
 * Get start of period based on goal period type
 */
const getStartOfPeriod = (period, customStartDate) => {
  const now = new Date();
  
  if (customStartDate) {
    return new Date(customStartDate);
  }
  
  switch (period) {
    case GOAL_PERIODS.DAILY:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case GOAL_PERIODS.WEEKLY:
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      return new Date(now.getFullYear(), now.getMonth(), diff);
    case GOAL_PERIODS.MONTHLY:
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }
};

/**
 * Get end of period based on goal period type
 */
const getEndOfPeriod = (period, customStartDate) => {
  const start = getStartOfPeriod(period, customStartDate);
  
  switch (period) {
    case GOAL_PERIODS.DAILY:
      return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    case GOAL_PERIODS.WEEKLY:
      return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    case GOAL_PERIODS.MONTHLY:
      return new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
    default:
      return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  }
};

/**
 * Calculate study streak
 */
const calculateStreak = (sessions) => {
  if (!sessions || sessions.length === 0) return 0;
  
  const sortedSessions = [...sessions]
    .filter(s => s.analysisComplete)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  if (sortedSessions.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const sessionDates = new Set(
    sortedSessions.map(s => {
      const d = new Date(s.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  
  // Check if there's a session today or yesterday to start the streak
  const today = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
  const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
  
  if (!sessionDates.has(today) && !sessionDates.has(yesterdayStr)) {
    return 0;
  }
  
  // Count consecutive days
  let checkDate = new Date(currentDate);
  if (!sessionDates.has(today)) {
    checkDate = yesterday;
  }
  
  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (sessionDates.has(dateStr)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }
  
  return streak;
};

/**
 * Check if a reminder should be shown for a goal
 */
export const shouldShowReminder = (goal, progress) => {
  if (!goal || !progress) return false;
  if (progress.isCompleted) return false;
  
  const { daysRemaining, percentage } = progress;
  
  // Show reminder if:
  // - Less than 2 days remaining and less than 50% progress
  // - Less than 1 day remaining and less than 80% progress
  // - Goal is about to expire (same day) and not completed
  if (daysRemaining <= 0 && percentage < 100) return true;
  if (daysRemaining <= 1 && percentage < 80) return true;
  if (daysRemaining <= 2 && percentage < 50) return true;
  
  return false;
};

/**
 * Get reminder message based on goal status
 */
export const getReminderMessage = (goal, progress) => {
  if (!goal || !progress) return null;
  
  const { daysRemaining, percentage, current, target } = progress;
  const remaining = target - current;
  
  if (percentage >= 100) {
    return {
      type: 'success',
      title: '🎉 Goal Completed!',
      message: `You've achieved your ${goal.name}!`,
    };
  }
  
  if (daysRemaining <= 0) {
    return {
      type: 'urgent',
      title: '⏰ Last Day!',
      message: `Today is the last day to complete ${remaining} more ${goal.type === 'sessions' ? 'sessions' : goal.type === 'time' ? 'minutes' : 'points'}!`,
    };
  }
  
  if (daysRemaining <= 1) {
    return {
      type: 'warning',
      title: '📅 Almost There!',
      message: `Only ${daysRemaining} day left! You need ${remaining} more ${goal.type === 'sessions' ? 'sessions' : goal.type === 'time' ? 'minutes' : 'points'}.`,
    };
  }
  
  if (percentage < 50 && daysRemaining <= 3) {
    return {
      type: 'info',
      title: '💪 Keep Going!',
      message: `${daysRemaining} days left. Complete ${remaining} more to reach your goal!`,
    };
  }
  
  return null;
};

