import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoalCard from '../../components/GoalCard';
import { GOAL_TYPES, GOAL_PERIODS } from '../../store/useGoalsStore';

describe('GoalCard', () => {
  const mockGoal = {
    id: 'goal-1',
    name: 'Weekly Study Sessions',
    type: GOAL_TYPES.SESSIONS,
    target: 5,
    period: GOAL_PERIODS.WEEKLY,
    isActive: true,
    reminderEnabled: true,
    progress: {
      current: 3,
      target: 5,
      percentage: 60,
      isCompleted: false,
      daysRemaining: 4,
    },
  };

  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render goal information', () => {
    render(
      <GoalCard goal={mockGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('Weekly Study Sessions')).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('should show correct status badge for active goal', () => {
    render(
      <GoalCard goal={mockGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should show completed status for completed goals', () => {
    const completedGoal = {
      ...mockGoal,
      progress: {
        ...mockGoal.progress,
        current: 5,
        percentage: 100,
        isCompleted: true,
      },
    };

    render(
      <GoalCard goal={completedGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  it('should show ending soon badge for goals with 1 day remaining', () => {
    const urgentGoal = {
      ...mockGoal,
      progress: {
        ...mockGoal.progress,
        daysRemaining: 1,
      },
    };

    render(
      <GoalCard goal={urgentGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText(/Ending Soon/)).toBeInTheDocument();
  });

  it('should show paused status for inactive goals', () => {
    const pausedGoal = {
      ...mockGoal,
      isActive: false,
    };

    render(
      <GoalCard goal={pausedGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('should call onToggle when pause/resume button is clicked', () => {
    render(
      <GoalCard goal={mockGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    const pauseButton = screen.getByText(/Pause/);
    fireEvent.click(pauseButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should show confirmation before deleting', () => {
    render(
      <GoalCard goal={mockGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByText('🗑️');
    fireEvent.click(deleteButton);

    // First click should show confirmation
    expect(screen.getByText('Confirm?')).toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should delete on second click (confirmation)', () => {
    render(
      <GoalCard goal={mockGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByText('🗑️');
    fireEvent.click(deleteButton);

    // Click confirm
    const confirmButton = screen.getByText('Confirm?');
    fireEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should show days remaining for active incomplete goals', () => {
    render(
      <GoalCard goal={mockGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText(/4 days remaining/)).toBeInTheDocument();
  });

  it('should show last day message when 0 days remaining', () => {
    const lastDayGoal = {
      ...mockGoal,
      progress: {
        ...mockGoal.progress,
        daysRemaining: 0,
      },
    };

    render(
      <GoalCard goal={lastDayGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('Last day!')).toBeInTheDocument();
  });

  it('should show reminder enabled indicator', () => {
    render(
      <GoalCard goal={mockGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('Reminders enabled')).toBeInTheDocument();
  });

  it('should not show reminder indicator when disabled', () => {
    const noReminderGoal = {
      ...mockGoal,
      reminderEnabled: false,
    };

    render(
      <GoalCard goal={noReminderGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.queryByText('Reminders enabled')).not.toBeInTheDocument();
  });

  it('should display correct icon for each goal type', () => {
    const timeGoal = {
      ...mockGoal,
      type: GOAL_TYPES.TIME,
    };

    const { rerender } = render(
      <GoalCard goal={timeGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('⏱️')).toBeInTheDocument();

    const masteryGoal = {
      ...mockGoal,
      type: GOAL_TYPES.MASTERY,
    };

    rerender(
      <GoalCard goal={masteryGoal} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('🎯')).toBeInTheDocument();
  });
});

