import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import {
  createGoal,
  fetchUserGoals,
  updateGoal,
  deleteGoal,
  calculateGoalProgress,
  shouldShowReminder,
  getReminderMessage,
  GOAL_TYPES,
  GOAL_PERIODS,
} from '../services/goalsService';

export { GOAL_TYPES, GOAL_PERIODS };

export const useGoalsStore = create((set, get) => ({
  goals: [],
  activeReminders: [],
  isLoading: false,
  error: null,

  // Fetch all goals from Firebase
  fetchGoals: async () => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) {
      set({ goals: [], isLoading: false });
      return [];
    }

    set({ isLoading: true, error: null });

    try {
      const goals = await fetchUserGoals(userId);
      set({ goals, isLoading: false });
      return goals;
    } catch (error) {
      console.error('[GoalsStore] Failed to fetch goals:', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  // Create a new goal
  addGoal: async (goalData) => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) {
      console.error('[GoalsStore] Cannot create goal: No user logged in');
      return null;
    }

    const goalId = `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newGoal = {
      id: goalId,
      name: goalData.name || 'Study Goal',
      type: goalData.type || GOAL_TYPES.SESSIONS,
      target: goalData.target || 5,
      period: goalData.period || GOAL_PERIODS.WEEKLY,
      startDate: goalData.startDate || new Date().toISOString(),
      isActive: true,
      reminderEnabled: goalData.reminderEnabled !== false,
      reminderTime: goalData.reminderTime || '09:00',
    };

    try {
      await createGoal(userId, newGoal);
      set((state) => ({
        goals: [newGoal, ...state.goals],
      }));
      console.log('[GoalsStore] Goal created:', goalId);
      return newGoal;
    } catch (error) {
      console.error('[GoalsStore] Failed to create goal:', error);
      set({ error: error.message });
      return null;
    }
  },

  // Update an existing goal
  updateGoal: async (goalId, updates) => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) return;

    try {
      await updateGoal(userId, goalId, updates);
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId ? { ...g, ...updates } : g
        ),
      }));
      console.log('[GoalsStore] Goal updated:', goalId);
    } catch (error) {
      console.error('[GoalsStore] Failed to update goal:', error);
      set({ error: error.message });
    }
  },

  // Delete a goal
  removeGoal: async (goalId) => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) return;

    try {
      await deleteGoal(userId, goalId);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
      }));
      console.log('[GoalsStore] Goal deleted:', goalId);
    } catch (error) {
      console.error('[GoalsStore] Failed to delete goal:', error);
      set({ error: error.message });
    }
  },

  // Toggle goal active status
  toggleGoalActive: async (goalId) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (goal) {
      await get().updateGoal(goalId, { isActive: !goal.isActive });
    }
  },

  // Get progress for all active goals
  getGoalsWithProgress: (sessions) => {
    const { goals } = get();
    return goals
      .filter((g) => g.isActive)
      .map((goal) => ({
        ...goal,
        progress: calculateGoalProgress(goal, sessions),
      }));
  },

  // Check and update reminders
  checkReminders: (sessions) => {
    const { goals } = get();
    const reminders = [];

    goals.forEach((goal) => {
      if (!goal.isActive || !goal.reminderEnabled) return;

      const progress = calculateGoalProgress(goal, sessions);
      
      if (shouldShowReminder(goal, progress)) {
        const reminder = getReminderMessage(goal, progress);
        if (reminder) {
          reminders.push({
            goalId: goal.id,
            goalName: goal.name,
            ...reminder,
            progress,
          });
        }
      }
    });

    set({ activeReminders: reminders });
    return reminders;
  },

  // Dismiss a reminder
  dismissReminder: (goalId) => {
    set((state) => ({
      activeReminders: state.activeReminders.filter((r) => r.goalId !== goalId),
    }));
  },

  // Clear all reminders
  clearReminders: () => {
    set({ activeReminders: [] });
  },

  // Reset store
  reset: () => {
    set({
      goals: [],
      activeReminders: [],
      isLoading: false,
      error: null,
    });
  },
}));

