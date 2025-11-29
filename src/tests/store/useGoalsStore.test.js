import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGoalsStore, GOAL_TYPES, GOAL_PERIODS } from '../../store/useGoalsStore';

// Mock the services
vi.mock('../../services/goalsService', () => ({
  createGoal: vi.fn().mockResolvedValue({}),
  fetchUserGoals: vi.fn().mockResolvedValue([]),
  updateGoal: vi.fn().mockResolvedValue({}),
  deleteGoal: vi.fn().mockResolvedValue({}),
  calculateGoalProgress: vi.fn().mockReturnValue({
    current: 2,
    target: 5,
    percentage: 40,
    isCompleted: false,
    daysRemaining: 3,
  }),
  shouldShowReminder: vi.fn().mockReturnValue(false),
  getReminderMessage: vi.fn().mockReturnValue(null),
  GOAL_TYPES: {
    SESSIONS: 'sessions',
    TIME: 'time',
    MASTERY: 'mastery',
    STREAK: 'streak',
  },
  GOAL_PERIODS: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
  },
}));

// Mock auth store
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: { uid: 'test-user-123' },
    }),
  },
}));

describe('useGoalsStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useGoalsStore());
    act(() => {
      result.current.reset();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useGoalsStore());

    expect(result.current.goals).toEqual([]);
    expect(result.current.activeReminders).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add a goal', async () => {
    const { result } = renderHook(() => useGoalsStore());

    const goalData = {
      name: 'Test Goal',
      type: GOAL_TYPES.SESSIONS,
      target: 5,
      period: GOAL_PERIODS.WEEKLY,
    };

    let newGoal;
    await act(async () => {
      newGoal = await result.current.addGoal(goalData);
    });

    expect(newGoal).toBeTruthy();
    expect(newGoal.name).toBe('Test Goal');
    expect(newGoal.type).toBe(GOAL_TYPES.SESSIONS);
    expect(newGoal.target).toBe(5);
    expect(result.current.goals).toHaveLength(1);
  });

  it('should remove a goal', async () => {
    const { result } = renderHook(() => useGoalsStore());

    // First add a goal
    let newGoal;
    await act(async () => {
      newGoal = await result.current.addGoal({
        name: 'Test Goal',
        type: GOAL_TYPES.SESSIONS,
        target: 5,
      });
    });

    expect(result.current.goals).toHaveLength(1);

    // Then remove it
    await act(async () => {
      await result.current.removeGoal(newGoal.id);
    });

    expect(result.current.goals).toHaveLength(0);
  });

  it('should toggle goal active status', async () => {
    const { result } = renderHook(() => useGoalsStore());

    let newGoal;
    await act(async () => {
      newGoal = await result.current.addGoal({
        name: 'Test Goal',
        type: GOAL_TYPES.SESSIONS,
        target: 5,
        isActive: true,
      });
    });

    expect(result.current.goals[0].isActive).toBe(true);

    await act(async () => {
      await result.current.toggleGoalActive(newGoal.id);
    });

    expect(result.current.goals[0].isActive).toBe(false);
  });

  it('should get goals with progress', async () => {
    const { result } = renderHook(() => useGoalsStore());

    await act(async () => {
      await result.current.addGoal({
        name: 'Test Goal',
        type: GOAL_TYPES.SESSIONS,
        target: 5,
        isActive: true,
      });
    });

    const goalsWithProgress = result.current.getGoalsWithProgress([]);

    expect(goalsWithProgress).toHaveLength(1);
    expect(goalsWithProgress[0].progress).toBeDefined();
  });

  it('should reset store', async () => {
    const { result } = renderHook(() => useGoalsStore());

    await act(async () => {
      await result.current.addGoal({
        name: 'Test Goal',
        type: GOAL_TYPES.SESSIONS,
        target: 5,
      });
    });

    expect(result.current.goals).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.goals).toEqual([]);
    expect(result.current.activeReminders).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should dismiss a reminder', async () => {
    const { result } = renderHook(() => useGoalsStore());

    // Manually set some reminders for testing
    act(() => {
      useGoalsStore.setState({
        activeReminders: [
          { goalId: 'goal-1', message: 'Test reminder' },
          { goalId: 'goal-2', message: 'Another reminder' },
        ],
      });
    });

    expect(result.current.activeReminders).toHaveLength(2);

    act(() => {
      result.current.dismissReminder('goal-1');
    });

    expect(result.current.activeReminders).toHaveLength(1);
    expect(result.current.activeReminders[0].goalId).toBe('goal-2');
  });

  it('should clear all reminders', () => {
    const { result } = renderHook(() => useGoalsStore());

    act(() => {
      useGoalsStore.setState({
        activeReminders: [
          { goalId: 'goal-1', message: 'Test reminder' },
          { goalId: 'goal-2', message: 'Another reminder' },
        ],
      });
    });

    expect(result.current.activeReminders).toHaveLength(2);

    act(() => {
      result.current.clearReminders();
    });

    expect(result.current.activeReminders).toHaveLength(0);
  });
});

