import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateGoalProgress,
  shouldShowReminder,
  getReminderMessage,
  GOAL_TYPES,
  GOAL_PERIODS,
} from '../../services/goalsService';

describe('goalsService', () => {
  describe('calculateGoalProgress', () => {
    const mockSessions = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        analysisComplete: true,
        timeSpent: 30,
        masteryScore: 85,
      },
      {
        id: '2',
        timestamp: new Date().toISOString(),
        analysisComplete: true,
        timeSpent: 45,
        masteryScore: 75,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        analysisComplete: true,
        timeSpent: 20,
        masteryScore: 90,
      },
    ];

    it('should calculate session count progress correctly', () => {
      const goal = {
        type: GOAL_TYPES.SESSIONS,
        target: 5,
        period: GOAL_PERIODS.WEEKLY,
      };

      const progress = calculateGoalProgress(goal, mockSessions);

      expect(progress.current).toBeLessThanOrEqual(3);
      expect(progress.target).toBe(5);
      expect(progress.percentage).toBeGreaterThanOrEqual(0);
      expect(progress.percentage).toBeLessThanOrEqual(100);
    });

    it('should calculate time progress correctly', () => {
      const goal = {
        type: GOAL_TYPES.TIME,
        target: 120,
        period: GOAL_PERIODS.WEEKLY,
      };

      const progress = calculateGoalProgress(goal, mockSessions);

      expect(progress.target).toBe(120);
      expect(typeof progress.current).toBe('number');
      expect(typeof progress.percentage).toBe('number');
    });

    it('should calculate mastery progress correctly', () => {
      const goal = {
        type: GOAL_TYPES.MASTERY,
        target: 80,
        period: GOAL_PERIODS.WEEKLY,
      };

      const progress = calculateGoalProgress(goal, mockSessions);

      expect(progress.target).toBe(80);
      expect(typeof progress.current).toBe('number');
    });

    it('should return 0 progress for empty sessions', () => {
      const goal = {
        type: GOAL_TYPES.SESSIONS,
        target: 5,
        period: GOAL_PERIODS.WEEKLY,
      };

      const progress = calculateGoalProgress(goal, []);

      expect(progress.current).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should handle null/undefined goal gracefully', () => {
      const progress = calculateGoalProgress(null, mockSessions);

      expect(progress.current).toBe(0);
      expect(progress.target).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should cap percentage at 100', () => {
      const goal = {
        type: GOAL_TYPES.SESSIONS,
        target: 1,
        period: GOAL_PERIODS.MONTHLY,
      };

      // Create many sessions
      const manySessions = Array(10).fill(null).map((_, i) => ({
        id: String(i),
        timestamp: new Date().toISOString(),
        analysisComplete: true,
        timeSpent: 30,
        masteryScore: 80,
      }));

      const progress = calculateGoalProgress(goal, manySessions);

      expect(progress.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('shouldShowReminder', () => {
    it('should return false for completed goals', () => {
      const goal = { isActive: true, reminderEnabled: true };
      const progress = { isCompleted: true, percentage: 100, daysRemaining: 3 };

      expect(shouldShowReminder(goal, progress)).toBe(false);
    });

    it('should return true for goals ending soon with low progress', () => {
      const goal = { isActive: true, reminderEnabled: true };
      const progress = { isCompleted: false, percentage: 30, daysRemaining: 1 };

      expect(shouldShowReminder(goal, progress)).toBe(true);
    });

    it('should return true for goals on last day not completed', () => {
      const goal = { isActive: true, reminderEnabled: true };
      const progress = { isCompleted: false, percentage: 90, daysRemaining: 0 };

      expect(shouldShowReminder(goal, progress)).toBe(true);
    });

    it('should return false for goals with good progress and time remaining', () => {
      const goal = { isActive: true, reminderEnabled: true };
      const progress = { isCompleted: false, percentage: 70, daysRemaining: 5 };

      expect(shouldShowReminder(goal, progress)).toBe(false);
    });

    it('should handle null inputs gracefully', () => {
      expect(shouldShowReminder(null, null)).toBe(false);
      expect(shouldShowReminder({}, null)).toBe(false);
    });
  });

  describe('getReminderMessage', () => {
    it('should return success message for completed goals', () => {
      const goal = { name: 'Test Goal', type: GOAL_TYPES.SESSIONS };
      const progress = { isCompleted: true, percentage: 100 };

      const message = getReminderMessage(goal, progress);

      expect(message.type).toBe('success');
      expect(message.title).toContain('Completed');
    });

    it('should return urgent message for last day', () => {
      const goal = { name: 'Test Goal', type: GOAL_TYPES.SESSIONS };
      const progress = { isCompleted: false, percentage: 50, daysRemaining: 0, current: 2, target: 5 };

      const message = getReminderMessage(goal, progress);

      expect(message.type).toBe('urgent');
      expect(message.title).toContain('Last Day');
    });

    it('should return warning message for almost there', () => {
      const goal = { name: 'Test Goal', type: GOAL_TYPES.SESSIONS };
      const progress = { isCompleted: false, percentage: 60, daysRemaining: 1, current: 3, target: 5 };

      const message = getReminderMessage(goal, progress);

      expect(message.type).toBe('warning');
    });

    it('should return null for goals with no reminder needed', () => {
      const goal = { name: 'Test Goal', type: GOAL_TYPES.SESSIONS };
      const progress = { isCompleted: false, percentage: 70, daysRemaining: 5, current: 3, target: 5 };

      const message = getReminderMessage(goal, progress);

      expect(message).toBeNull();
    });
  });
});

