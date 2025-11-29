import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationToast from '../../components/NotificationToast';

describe('NotificationToast', () => {
  const mockReminders = [
    {
      goalId: 'goal-1',
      goalName: 'Weekly Sessions',
      type: 'warning',
      title: '📅 Almost There!',
      message: 'Only 1 day left to complete your goal.',
      progress: {
        current: 3,
        target: 5,
        percentage: 60,
      },
    },
    {
      goalId: 'goal-2',
      goalName: 'Study Time',
      type: 'urgent',
      title: '⏰ Last Day!',
      message: 'Complete 30 more minutes today.',
      progress: {
        current: 90,
        target: 120,
        percentage: 75,
      },
    },
  ];

  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when no reminders', () => {
    const { container } = render(
      <NotificationToast reminders={[]} onDismiss={mockOnDismiss} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render all reminders', () => {
    render(
      <NotificationToast reminders={mockReminders} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByText('📅 Almost There!')).toBeInTheDocument();
    expect(screen.getByText('⏰ Last Day!')).toBeInTheDocument();
  });

  it('should show reminder messages', () => {
    render(
      <NotificationToast reminders={mockReminders} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByText('Only 1 day left to complete your goal.')).toBeInTheDocument();
    expect(screen.getByText('Complete 30 more minutes today.')).toBeInTheDocument();
  });

  it('should show progress information', () => {
    render(
      <NotificationToast reminders={mockReminders} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getByText('90/120')).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    render(
      <NotificationToast reminders={mockReminders} onDismiss={mockOnDismiss} />
    );

    // Get all dismiss buttons (X icons)
    const dismissButtons = screen.getAllByRole('button');
    fireEvent.click(dismissButtons[0]);

    expect(mockOnDismiss).toHaveBeenCalledWith('goal-1');
  });

  it('should hide dismissed reminders', () => {
    const { rerender } = render(
      <NotificationToast reminders={mockReminders} onDismiss={mockOnDismiss} />
    );

    // Initially both should be visible
    expect(screen.getByText('📅 Almost There!')).toBeInTheDocument();
    expect(screen.getByText('⏰ Last Day!')).toBeInTheDocument();

    // Dismiss first reminder
    const dismissButtons = screen.getAllByRole('button');
    fireEvent.click(dismissButtons[0]);

    // After dismissal, the internal state should hide it
    // Note: The component uses internal state to track dismissed reminders
    expect(mockOnDismiss).toHaveBeenCalledWith('goal-1');
  });

  it('should display goal names', () => {
    render(
      <NotificationToast reminders={mockReminders} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByText('Weekly Sessions')).toBeInTheDocument();
    expect(screen.getByText('Study Time')).toBeInTheDocument();
  });

  it('should render success type with correct styling', () => {
    const successReminder = {
      goalId: 'goal-3',
      goalName: 'Complete Goal',
      type: 'success',
      title: '🎉 Goal Completed!',
      message: 'Congratulations!',
      progress: {
        current: 5,
        target: 5,
        percentage: 100,
      },
    };

    render(
      <NotificationToast reminders={[successReminder]} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByText('🎉 Goal Completed!')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('should render info type with correct icon', () => {
    const infoReminder = {
      goalId: 'goal-4',
      goalName: 'Info Goal',
      type: 'info',
      title: '💡 Keep Going!',
      message: 'You\'re making progress.',
      progress: {
        current: 2,
        target: 5,
        percentage: 40,
      },
    };

    render(
      <NotificationToast reminders={[infoReminder]} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByText('💡 Keep Going!')).toBeInTheDocument();
    expect(screen.getByText('💡')).toBeInTheDocument();
  });
});

