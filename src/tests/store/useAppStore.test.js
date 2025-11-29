import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';

// Mock Firebase services
vi.mock('../../services/historyService', () => ({
  saveSessionToFirebase: vi.fn().mockResolvedValue('test-id'),
  fetchUserSessions: vi.fn().mockResolvedValue([]),
  deleteSessionFromFirebase: vi.fn().mockResolvedValue(undefined),
  updateSessionInFirebase: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth store
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: { uid: 'test-user-123' },
    }),
  },
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.reset();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.fullText).toBe('');
      expect(result.current.pageTexts).toEqual([]);
      expect(result.current.pageCount).toBe(0);
      expect(result.current.fileName).toBe('');
      expect(result.current.selectedText).toBe('');
      expect(result.current.questions).toEqual([]);
      expect(result.current.answers).toEqual([]);
      expect(result.current.showQuestionModal).toBe(false);
      expect(result.current.currentSessionId).toBeNull();
      expect(result.current.reviewMode).toBe(false);
    });
  });

  describe('PDF State', () => {
    it('should set PDF data correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setPdfData({
          fullText: 'Test PDF content',
          pageTexts: ['Page 1', 'Page 2'],
          pageCount: 2,
          fileName: 'test.pdf',
        });
      });

      expect(result.current.fullText).toBe('Test PDF content');
      expect(result.current.pageTexts).toEqual(['Page 1', 'Page 2']);
      expect(result.current.pageCount).toBe(2);
      expect(result.current.fileName).toBe('test.pdf');
    });

    it('should clear session state when setting new PDF', () => {
      const { result } = renderHook(() => useAppStore());

      // Set initial state
      act(() => {
        useAppStore.setState({
          currentSessionId: 'old-session',
          qaData: { questions: [], answers: [] },
        });
      });

      // Set new PDF
      act(() => {
        result.current.setPdfData({
          fullText: 'New content',
          fileName: 'new.pdf',
        });
      });

      expect(result.current.currentSessionId).toBeNull();
      expect(result.current.qaData).toBeNull();
    });
  });

  describe('Selection State', () => {
    it('should set selection correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSelection('Selected text', 'Surrounding context');
      });

      expect(result.current.selectedText).toBe('Selected text');
      expect(result.current.surroundingContext).toBe('Surrounding context');
    });

    it('should clear questions and answers when setting new selection', () => {
      const { result } = renderHook(() => useAppStore());

      // Set initial state
      act(() => {
        useAppStore.setState({
          questions: ['Q1', 'Q2'],
          answers: ['A1', 'A2'],
        });
      });

      // Set new selection
      act(() => {
        result.current.setSelection('New text', '');
      });

      expect(result.current.questions).toEqual([]);
      expect(result.current.answers).toEqual([]);
    });
  });

  describe('Confusion Button', () => {
    it('should toggle confusion button visibility', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setConfusionButton(true, { x: 100, y: 200 });
      });

      expect(result.current.showConfusionButton).toBe(true);
      expect(result.current.confusionButtonPosition).toEqual({ x: 100, y: 200 });

      act(() => {
        result.current.setConfusionButton(false);
      });

      expect(result.current.showConfusionButton).toBe(false);
    });
  });

  describe('Questions and Answers', () => {
    it('should set questions correctly', () => {
      const { result } = renderHook(() => useAppStore());

      const questions = [
        { question: 'Q1', level: 1 },
        { question: 'Q2', level: 2 },
      ];

      act(() => {
        result.current.setQuestions(questions);
      });

      expect(result.current.questions).toEqual(questions);
    });

    it('should add answer correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addAnswer('Answer 1');
        result.current.addAnswer('Answer 2');
      });

      expect(result.current.answers).toEqual(['Answer 1', 'Answer 2']);
    });

    it('should set answer at specific index', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addAnswer('Answer 1');
        result.current.addAnswer('Answer 2');
        result.current.setAnswer(0, 'Updated Answer 1');
      });

      expect(result.current.answers).toEqual(['Updated Answer 1', 'Answer 2']);
    });
  });

  describe('Question Modal', () => {
    it('should toggle question modal', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setShowQuestionModal(true);
      });

      expect(result.current.showQuestionModal).toBe(true);

      act(() => {
        result.current.setShowQuestionModal(false);
      });

      expect(result.current.showQuestionModal).toBe(false);
    });
  });

  describe('Session State', () => {
    it('should set current session ID', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCurrentSessionId('session-123');
      });

      expect(result.current.currentSessionId).toBe('session-123');
    });

    it('should set review mode', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setReviewMode(true);
      });

      expect(result.current.reviewMode).toBe(true);
    });

    it('should set review analysis', () => {
      const { result } = renderHook(() => useAppStore());

      const analysis = {
        overallAccuracy: 0.8,
        confusionType: 'vocabulary',
      };

      act(() => {
        result.current.setReviewAnalysis(analysis);
      });

      expect(result.current.reviewAnalysis).toEqual(analysis);
    });

    it('should exit review mode correctly', () => {
      const { result } = renderHook(() => useAppStore());

      // Set review mode
      act(() => {
        result.current.setReviewMode(true);
        result.current.setReviewAnalysis({ test: true });
        result.current.setCurrentSessionId('session-123');
      });

      // Exit review mode
      act(() => {
        result.current.exitReviewMode();
      });

      expect(result.current.reviewMode).toBe(false);
      expect(result.current.reviewAnalysis).toBeNull();
      expect(result.current.currentSessionId).toBeNull();
    });
  });

  describe('History', () => {
    it('should add session to history', () => {
      const { result } = renderHook(() => useAppStore());

      let sessionId;
      act(() => {
        sessionId = result.current.history.addSession({
          fullSelectedText: 'Test content',
          pdfName: 'test.pdf',
          questionResponses: [],
        });
      });

      expect(sessionId).toBeTruthy();
      expect(result.current.history.sessions.length).toBe(1);
    });

    it('should get session by ID', () => {
      const { result } = renderHook(() => useAppStore());

      let sessionId;
      act(() => {
        sessionId = result.current.history.addSession({
          fullSelectedText: 'Test content',
          pdfName: 'test.pdf',
        });
      });

      const session = result.current.history.getSessionById(sessionId);

      expect(session).toBeTruthy();
      expect(session.pdfName).toBe('test.pdf');
    });

    it('should delete session from history', () => {
      const { result } = renderHook(() => useAppStore());

      let sessionId;
      act(() => {
        sessionId = result.current.history.addSession({
          fullSelectedText: 'Test content',
        });
      });

      expect(result.current.history.sessions.length).toBe(1);

      act(() => {
        result.current.history.deleteSession(sessionId);
      });

      expect(result.current.history.sessions.length).toBe(0);
    });

    it('should get all sessions sorted by timestamp', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.history.addSession({ fullSelectedText: 'First' });
      });

      // Add a small delay to ensure different timestamps
      act(() => {
        result.current.history.addSession({ fullSelectedText: 'Second' });
      });

      const sessions = result.current.history.getAllSessions();

      expect(sessions.length).toBe(2);
      // Most recent should be first
      expect(new Date(sessions[0].timestamp) >= new Date(sessions[1].timestamp)).toBe(true);
    });

    it('should update session progress', () => {
      const { result } = renderHook(() => useAppStore());

      let sessionId;
      act(() => {
        sessionId = result.current.history.addSession({
          fullSelectedText: 'Test content',
          completedSteps: 0,
          totalSteps: 5,
        });
      });

      act(() => {
        result.current.history.updateSessionProgress(sessionId, 3, 10, {
          totalSteps: 5,
        });
      });

      const session = result.current.history.getSessionById(sessionId);

      expect(session.completedSteps).toBe(3);
      expect(session.timeSpent).toBe(10);
    });
  });

  describe('Reset', () => {
    it('should reset all state except history', () => {
      const { result } = renderHook(() => useAppStore());

      // Set various state
      act(() => {
        result.current.setPdfData({ fullText: 'Test', fileName: 'test.pdf' });
        result.current.setSelection('Selected', 'Context');
        result.current.setQuestions([{ question: 'Q1' }]);
        result.current.addAnswer('A1');
        result.current.setCurrentSessionId('session-1');
        result.current.history.addSession({ fullSelectedText: 'Test' });
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      // Check reset state
      expect(result.current.fullText).toBe('');
      expect(result.current.selectedText).toBe('');
      expect(result.current.questions).toEqual([]);
      expect(result.current.answers).toEqual([]);
      expect(result.current.currentSessionId).toBeNull();
      
      // History should be preserved
      expect(result.current.history.sessions.length).toBe(1);
    });
  });
});

