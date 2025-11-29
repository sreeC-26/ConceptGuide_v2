import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';

// Mock the stores
vi.mock('../../store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      history: {
        sessions: [],
        addSession: vi.fn().mockReturnValue('test-session-id'),
        getSessionById: vi.fn().mockReturnValue(null),
        updateSessionProgress: vi.fn(),
      },
      currentSessionId: 'test-session-id',
      setCurrentSessionId: vi.fn(),
      fileName: 'test.pdf',
      reviewMode: false,
      reviewAnalysis: null,
      syncSessionsFromFirebase: vi.fn().mockResolvedValue([]),
      reset: vi.fn(),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { uid: 'test-user', email: 'test@example.com' },
      signOut: vi.fn(),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../../store/useGoalsStore', () => ({
  useGoalsStore: vi.fn((selector) => {
    const state = {
      goals: [],
      fetchGoals: vi.fn().mockResolvedValue([]),
      addGoal: vi.fn().mockResolvedValue({ id: 'test-goal' }),
      removeGoal: vi.fn(),
      getGoalsWithProgress: vi.fn().mockReturnValue([]),
      activeReminders: [],
      checkReminders: vi.fn(),
      dismissReminder: vi.fn(),
      isLoading: false,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
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

// Import components after mocking
import RepairPath from '../../components/RepairPath';
import { useAppStore } from '../../store/useAppStore';

describe('Learning Flow Integration', () => {
  const mockSteps = [
    {
      stepNumber: 1,
      conceptName: 'Variables',
      timeEstimate: 5,
      explanation: 'Variables store data.',
      practiceProblem: {
        question: 'What is a variable?',
        options: ['A) Storage', 'B) Function', 'C) Loop', 'D) Class'],
        correctAnswer: 'A) Storage',
        explanation: 'Variables store data in memory.',
      },
      connectionToNext: 'Next we learn about functions.',
    },
    {
      stepNumber: 2,
      conceptName: 'Functions',
      timeEstimate: 8,
      explanation: 'Functions are reusable code blocks.',
      practiceProblem: {
        question: 'What is a function?',
        options: ['A) Variable', 'B) Reusable code', 'C) Loop', 'D) Array'],
        correctAnswer: 'B) Reusable code',
        explanation: 'Functions contain reusable code.',
      },
      connectionToNext: 'Now we learn about loops.',
    },
    {
      stepNumber: 3,
      conceptName: 'Loops',
      timeEstimate: 10,
      explanation: 'Loops repeat code.',
      practiceProblem: {
        question: 'What is a loop?',
        options: ['A) Single execution', 'B) Repeated execution', 'C) Declaration', 'D) Export'],
        correctAnswer: 'B) Repeated execution',
        explanation: 'Loops repeat code multiple times.',
      },
    },
  ];

  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('should display the first step initially', () => {
    renderWithRouter(
      <RepairPath steps={mockSteps} onComplete={mockOnComplete} sessionId="test-session" />
    );

    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    expect(screen.getByText(/Variables/)).toBeInTheDocument();
    expect(screen.getByText(/Variables store data/)).toBeInTheDocument();
  });

  it('should show progress bar', () => {
    renderWithRouter(
      <RepairPath steps={mockSteps} onComplete={mockOnComplete} sessionId="test-session" />
    );

    // Progress should start at 1/3 (33%)
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('should show step indicators', () => {
    renderWithRouter(
      <RepairPath steps={mockSteps} onComplete={mockOnComplete} sessionId="test-session" />
    );

    // Should have indicators for all 3 steps
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should advance to next step when marking complete', async () => {
    renderWithRouter(
      <RepairPath steps={mockSteps} onComplete={mockOnComplete} sessionId="test-session" />
    );

    // First step - show solution and complete
    const showSolutionBtn = screen.getByText('Show Solution');
    fireEvent.click(showSolutionBtn);

    const completeBtn = screen.getByText('Mark Complete & Continue →');
    fireEvent.click(completeBtn);

    // Should now be on step 2
    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
    });
  });

  it('should show previous button after advancing', async () => {
    renderWithRouter(
      <RepairPath steps={mockSteps} onComplete={mockOnComplete} sessionId="test-session" />
    );

    // Initially no previous button (on step 1)
    expect(screen.queryByText('← Previous Step')).not.toBeInTheDocument();

    // Advance to step 2
    const showSolutionBtn = screen.getByText('Show Solution');
    fireEvent.click(showSolutionBtn);

    const completeBtn = screen.getByText('Mark Complete & Continue →');
    fireEvent.click(completeBtn);

    // Now previous button should appear
    await waitFor(() => {
      expect(screen.getByText('← Previous Step')).toBeInTheDocument();
    });
  });

  it('should go back to previous step', async () => {
    renderWithRouter(
      <RepairPath steps={mockSteps} onComplete={mockOnComplete} sessionId="test-session" />
    );

    // Advance to step 2
    let showSolutionBtn = screen.getByText('Show Solution');
    fireEvent.click(showSolutionBtn);

    let completeBtn = screen.getByText('Mark Complete & Continue →');
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
    });

    // Go back to step 1
    const prevBtn = screen.getByText('← Previous Step');
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    });
  });

  it('should call onComplete when finishing last step', async () => {
    renderWithRouter(
      <RepairPath steps={mockSteps} onComplete={mockOnComplete} sessionId="test-session" />
    );

    // Complete all 3 steps
    for (let i = 0; i < 3; i++) {
      const showSolutionBtn = screen.getByText('Show Solution');
      fireEvent.click(showSolutionBtn);

      const buttonText = i === 2 ? 'Complete Learning Path ✓' : 'Mark Complete & Continue →';
      const completeBtn = screen.getByText(buttonText);
      fireEvent.click(completeBtn);

      if (i < 2) {
        await waitFor(() => {
          expect(screen.getByText(`Step ${i + 2} of 3`)).toBeInTheDocument();
        });
      }
    }

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('should handle empty steps array', () => {
    renderWithRouter(
      <RepairPath steps={[]} onComplete={mockOnComplete} sessionId="test-session" />
    );

    expect(screen.getByText('No learning steps available.')).toBeInTheDocument();
  });

  it('should display practice problem for each step', () => {
    renderWithRouter(
      <RepairPath steps={mockSteps} onComplete={mockOnComplete} sessionId="test-session" />
    );

    expect(screen.getByText('What is a variable?')).toBeInTheDocument();
    expect(screen.getByText('A) Storage')).toBeInTheDocument();
    expect(screen.getByText('B) Function')).toBeInTheDocument();
  });
});

describe('Session Management', () => {
  it('should work without a session ID', () => {
    const mockSteps = [
      {
        stepNumber: 1,
        conceptName: 'Test',
        explanation: 'Test explanation',
        practiceProblem: null,
      },
    ];

    render(
      <BrowserRouter>
        <RepairPath steps={mockSteps} onComplete={vi.fn()} />
      </BrowserRouter>
    );

    // Should still render and work
    expect(screen.getByText(/Test/)).toBeInTheDocument();
    
    // Complete button should work
    const completeBtn = screen.getByText('Complete Learning Path ✓');
    fireEvent.click(completeBtn);
  });
});

