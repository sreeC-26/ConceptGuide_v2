import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import {
  saveSessionToFirebase,
  fetchUserSessions,
  deleteSessionFromFirebase,
  updateSessionInFirebase,
} from '../services/historyService';

const buildQAFromResponses = (responses = []) => {
  if (!Array.isArray(responses) || responses.length === 0) {
    return null;
  }

  const questions = responses.map((resp, index) => ({
    level: resp.level ?? index + 1,
    question: resp.question ?? `Question ${index + 1}`,
    type: resp.type ?? resp.confusionType ?? 'Review',
  }));

  const answers = responses.map((resp) => resp.answer ?? '');
  return { questions, answers };
};

export const useAppStore = create((set, get) => ({
  // PDF state
  fullText: '',
  pageTexts: [],
  pageCount: 0,
  fileName: '',
  pdfFile: null,
  pdfDocument: null,

  // Selection state
  selectedText: '',
  surroundingContext: '',
  showConfusionButton: false,
  confusionButtonPosition: { x: 0, y: 0 },

  // Question state
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  showQuestionModal: false,
  qaData: null,

  // Session / review state
  currentSessionId: null,
  reviewMode: false,
  reviewAnalysis: null,
  refreshInsightsTimestamp: null,

  // Core actions
  setPdfData: (data) => set({
    fullText: data.fullText || '',
    pageTexts: data.pageTexts || [],
    pageCount: data.pageCount || 0,
    fileName: data.fileName || '',
    pdfFile: data.pdfFile || null,
    pdfDocument: data.pdfDocument || null,
    currentSessionId: null,
    qaData: null,
    reviewMode: false,
    reviewAnalysis: null,
  }),

  setSelection: (selectedText, surroundingContext) => set({
    selectedText,
    surroundingContext,
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    qaData: null,
  }),

  setConfusionButton: (show, position = { x: 0, y: 0 }) => set({
    showConfusionButton: show,
    confusionButtonPosition: position,
  }),

  setQuestions: (questions) => set({ questions }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  addAnswer: (answer) => set((state) => ({
    answers: [...state.answers, answer],
  })),

  setAnswer: (index, answer) => set((state) => {
    const newAnswers = [...state.answers];
    newAnswers[index] = answer;
    return { answers: newAnswers };
  }),

  setShowQuestionModal: (show) => set({ showQuestionModal: show }),
  setQAData: (qaData) => set({ qaData, refreshInsightsTimestamp: Date.now() }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setReviewMode: (value) => set({ reviewMode: value }),
  setReviewAnalysis: (analysis) => set({ reviewAnalysis: analysis, refreshInsightsTimestamp: Date.now() }),
  setRefreshInsightsTimestamp: (timestamp = Date.now()) => set({ refreshInsightsTimestamp: timestamp }),

  reset: () => set((state) => ({
    fullText: '',
    pageTexts: [],
    pageCount: 0,
    fileName: '',
    pdfFile: null,
    pdfDocument: null,
    selectedText: '',
    surroundingContext: '',
    showConfusionButton: false,
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    showQuestionModal: false,
    qaData: null,
    currentSessionId: null,
    reviewMode: false,
    reviewAnalysis: null,
    refreshInsightsTimestamp: null,
    history: state.history,
  })),

  loadSessionForReview: (sessionId) => {
    if (!sessionId) return;
    const session = get().history.getSessionById(sessionId);
    if (!session) return;

    const qaPayload = buildQAFromResponses(session.questionResponses);

    const analysisResult = session.analysisResult || {
      mindMap: session.mindMapData ?? null,
      repairPath: session.repairPathData ?? [],
      diagnosticSummary: session.diagnosticSummary ?? '',
      confusionType: session.confusionType ?? null,
      masteryScore: session.masteryScore ?? null,
      levelScores: session.levelScores ?? [],
      overallAccuracy: session.overallAccuracy ?? (session.masteryScore ? session.masteryScore / 100 : 0),
      overallConfidence: session.overallConfidence ?? (session.masteryScore ? session.masteryScore / 100 : 0),
      specificGaps: session.specificGaps ?? [],
      secondaryTypes: session.secondaryTypes ?? [],
    };

    set({
      currentSessionId: sessionId,
      selectedText: session.fullSelectedText ?? session.selectedText ?? '',
      qaData: qaPayload,
      reviewMode: true,
      reviewAnalysis: analysisResult,
      showQuestionModal: false,
    });
  },

  exitReviewMode: () => set({
    reviewMode: false,
    reviewAnalysis: null,
    qaData: null,
    currentSessionId: null,
  }),

  history: {
    sessions: [],

    addSession: (sessionData = {}) => {
      const userId = useAuthStore.getState().user?.uid || null;
      const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const baseText = sessionData.fullSelectedText || '';
      
      const newSession = {
        id: sessionData.id || generateId(),
        timestamp: new Date().toISOString(),
        pdfName: sessionData.pdfName ?? get().fileName ?? '',
        selectedText: baseText.slice(0, 100),
        fullSelectedText: baseText,
        confusionType: sessionData.confusionType ?? null,
        masteryScore: typeof sessionData.masteryScore === 'number' ? sessionData.masteryScore : null,
        timeSpent: typeof sessionData.timeSpent === 'number' ? sessionData.timeSpent : 0,
        totalSteps: typeof sessionData.totalSteps === 'number' ? sessionData.totalSteps : 0,
        completedSteps: typeof sessionData.completedSteps === 'number' ? sessionData.completedSteps : 0,
        mindMapData: sessionData.mindMapData ?? null,
        repairPathData: sessionData.repairPathData ?? null,
        questionResponses: Array.isArray(sessionData.questionResponses) ? sessionData.questionResponses : [],
        diagnosticSummary: sessionData.diagnosticSummary ?? '',
        levelScores: Array.isArray(sessionData.levelScores) ? sessionData.levelScores : [],
        analysisComplete: sessionData.analysisComplete || false,
        analysisResult: sessionData.analysisResult ?? null,
        overallAccuracy: sessionData.overallAccuracy ?? 0,
        overallConfidence: sessionData.overallConfidence ?? 0,
        specificGaps: sessionData.specificGaps ?? [],
        secondaryTypes: sessionData.secondaryTypes ?? [],
      };

      set((state) => {
        const existingHistory = state.history || {};
        const existingSessions = existingHistory.sessions || [];
        
        // Check for duplicate
        const existingIndex = existingSessions.findIndex(s => s.id === newSession.id);
        let updatedSessions;
        
        if (existingIndex >= 0) {
          // Update existing
          updatedSessions = [...existingSessions];
          updatedSessions[existingIndex] = { ...existingSessions[existingIndex], ...newSession };
          console.log('[Store] Updated session:', newSession.id);
        } else {
          // Add new
          updatedSessions = [newSession, ...existingSessions];
          console.log('[Store] Added session:', newSession.id);
        }

        return {
          history: { ...existingHistory, sessions: updatedSessions },
          currentSessionId: newSession.id,
          reviewMode: false,
          reviewAnalysis: null,
          refreshInsightsTimestamp: Date.now(),
        };
      });

      // Only save to Firebase if session has analysis complete
      // (Initial session creation just stores locally, Firebase save happens after analysis)
      if (userId && newSession.analysisComplete) {
        saveSessionToFirebase(userId, newSession)
          .then(() => console.log('[Store] Saved to Firebase:', newSession.id))
          .catch(err => console.error('[Store] Firebase save error:', err));
      }

      return newSession.id;
    },

    getSessionById: (id) => {
      const { history } = get();
      if (!history?.sessions) return null;
      return history.sessions.find((s) => s.id === id) || null;
    },

    deleteSession: (id) => {
      const userId = useAuthStore.getState().user?.uid || null;

      set((state) => {
        const existingHistory = state.history || {};
        const filtered = (existingHistory.sessions || []).filter((s) => s.id !== id);
        const isDeletingCurrent = state.currentSessionId === id;

        return {
          history: { ...existingHistory, sessions: filtered },
          currentSessionId: isDeletingCurrent ? null : state.currentSessionId,
          reviewMode: isDeletingCurrent ? false : state.reviewMode,
          reviewAnalysis: isDeletingCurrent ? null : state.reviewAnalysis,
          qaData: isDeletingCurrent ? null : state.qaData,
          refreshInsightsTimestamp: Date.now(),
        };
      });

      if (userId) {
        deleteSessionFromFirebase(userId, id).catch(console.error);
      }
    },

    getAllSessions: () => {
      const { history } = get();
      if (!history?.sessions) return [];
      return [...history.sessions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    updateSessionProgress: (id, completedSteps, timeSpent, updates = {}) => {
      const userId = useAuthStore.getState().user?.uid || null;

      let updatedSession = null;
      
      set((state) => {
        const existingHistory = state.history || {};
        const updatedSessions = (existingHistory.sessions || []).map((session) => {
          if (session.id !== id) return session;
          
          // Build updated session with all data
          updatedSession = {
            ...session,
            completedSteps: typeof completedSteps === 'number' ? completedSteps : session.completedSteps,
            timeSpent: typeof timeSpent === 'number' ? (session.timeSpent || 0) + timeSpent : session.timeSpent,
            ...updates,
          };
          
          // Ensure analysisComplete is set properly
          if (updates.analysisComplete || updates.analysisResult) {
            updatedSession.analysisComplete = true;
          }
          
          return updatedSession;
        });

        return {
          history: { ...existingHistory, sessions: updatedSessions },
          refreshInsightsTimestamp: updates.analysisComplete ? Date.now() : state.refreshInsightsTimestamp,
        };
      });

      // Save to Firebase
      if (userId && updatedSession) {
        // Clean the session data for Firebase (remove circular references, ensure serializable)
        const cleanSession = {
          id: updatedSession.id,
          timestamp: updatedSession.timestamp,
          pdfName: updatedSession.pdfName || '',
          selectedText: updatedSession.selectedText || '',
          fullSelectedText: updatedSession.fullSelectedText || '',
          confusionType: updatedSession.confusionType || null,
          masteryScore: updatedSession.masteryScore || null,
          timeSpent: updatedSession.timeSpent || 0,
          totalSteps: updatedSession.totalSteps || 0,
          completedSteps: updatedSession.completedSteps || 0,
          analysisComplete: updatedSession.analysisComplete || false,
          diagnosticSummary: updatedSession.diagnosticSummary || '',
          overallAccuracy: updatedSession.overallAccuracy || 0,
          overallConfidence: updatedSession.overallConfidence || 0,
          questionResponses: Array.isArray(updatedSession.questionResponses) ? updatedSession.questionResponses : [],
          levelScores: Array.isArray(updatedSession.levelScores) ? updatedSession.levelScores : [],
          specificGaps: Array.isArray(updatedSession.specificGaps) ? updatedSession.specificGaps : [],
          secondaryTypes: Array.isArray(updatedSession.secondaryTypes) ? updatedSession.secondaryTypes : [],
          // Store mind map and repair path as serializable data
          mindMapData: updatedSession.mindMapData || updatedSession.analysisResult?.mindMap || null,
          repairPathData: updatedSession.repairPathData || updatedSession.analysisResult?.repairPath || [],
        };

        // If analysis is complete, save the full session
        if (updates.analysisComplete || updatedSession.analysisComplete) {
          console.log('[Store] Saving complete session to Firebase:', id);
          saveSessionToFirebase(userId, cleanSession)
            .then(() => console.log('[Store] Saved to Firebase successfully:', id))
            .catch(err => console.error('[Store] Firebase save error:', err));
        } else if (typeof completedSteps === 'number' || typeof timeSpent === 'number') {
          // Just update progress fields
          const progressUpdate = {};
          if (typeof completedSteps === 'number') progressUpdate.completedSteps = completedSteps;
          if (typeof timeSpent === 'number') progressUpdate.timeSpent = cleanSession.timeSpent;
          updateSessionInFirebase(userId, id, progressUpdate).catch(console.error);
        }
      }
    },
  },

  syncSessionsFromFirebase: async () => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) return [];

    try {
      const remoteSessions = await fetchUserSessions(userId);
      console.log('[Store] Fetched sessions from Firebase:', remoteSessions.length);
      
      set((state) => {
        const existingHistory = state.history || {};
        const existingSessions = existingHistory.sessions || [];
        
        // Merge sessions
        const sessionMap = new Map();
        existingSessions.forEach(s => s.id && sessionMap.set(s.id, s));
        remoteSessions.forEach(s => s.id && sessionMap.set(s.id, { ...sessionMap.get(s.id), ...s }));
        
        const merged = Array.from(sessionMap.values()).sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );

        return {
          history: { ...existingHistory, sessions: merged },
          refreshInsightsTimestamp: Date.now(),
        };
      });

      return remoteSessions;
    } catch (error) {
      console.error('[Store] Sync error:', error);
      return [];
    }
  },
}));
