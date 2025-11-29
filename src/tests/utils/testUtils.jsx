import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with providers
 */
export function renderWithProviders(ui, options = {}) {
  const { route = '/', ...renderOptions } = options;

  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Create mock session data for testing
 */
export function createMockSession(overrides = {}) {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    pdfName: 'test.pdf',
    selectedText: 'Test selected text',
    fullSelectedText: 'Full test selected text for analysis',
    confusionType: 'vocabulary',
    masteryScore: 75,
    timeSpent: 15,
    totalSteps: 5,
    completedSteps: 3,
    analysisComplete: true,
    questionResponses: [
      { question: 'What is this?', answer: 'It is a test', level: 1 },
      { question: 'Why is it important?', answer: 'For testing', level: 2 },
    ],
    mindMapData: {
      nodes: [
        { id: 'concept-1', label: 'Concept 1' },
        { id: 'concept-2', label: 'Concept 2' },
      ],
      edges: [{ source: 'concept-1', target: 'concept-2' }],
    },
    repairPathData: [
      {
        stepNumber: 1,
        conceptName: 'Basic Concept',
        explanation: 'This is the basic concept.',
        practiceProblem: {
          question: 'What is it?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'A is correct.',
        },
      },
    ],
    ...overrides,
  };
}

/**
 * Create mock goal data for testing
 */
export function createMockGoal(overrides = {}) {
  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Goal',
    type: 'sessions',
    target: 5,
    period: 'weekly',
    startDate: new Date().toISOString(),
    isActive: true,
    reminderEnabled: true,
    reminderTime: '09:00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock analysis result for testing
 */
export function createMockAnalysisResult(overrides = {}) {
  return {
    overallAccuracy: 0.75,
    overallConfidence: 0.8,
    confusionType: 'missing_foundation',
    secondaryTypes: ['misconception'],
    diagnosticSummary: 'Student shows understanding but needs more foundation.',
    specificGaps: ['concept-1', 'concept-2'],
    levelScores: [
      { level: 1, accuracy: 0.8, confidence: 0.9 },
      { level: 2, accuracy: 0.7, confidence: 0.7 },
    ],
    mindMap: {
      nodes: [
        { id: 'node-1', label: 'Concept 1', depth: 0 },
        { id: 'node-2', label: 'Concept 2', depth: 1 },
      ],
      edges: [{ source: 'node-1', target: 'node-2' }],
    },
    repairPath: [
      {
        stepNumber: 1,
        conceptName: 'Foundation',
        explanation: 'Start with the basics.',
        practiceProblem: {
          question: 'What is the foundation?',
          options: ['A) This', 'B) That', 'C) Other', 'D) None'],
          correctAnswer: 'A) This',
          explanation: 'This is the foundation.',
        },
      },
    ],
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock fetch response
 */
export function mockFetchResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

/**
 * Create mock questions for testing
 */
export function createMockQuestions() {
  return [
    {
      question: 'What is this concept?',
      level: 1,
      type: 'Vocabulary/Definition',
      expectedKeywords: ['definition', 'meaning'],
    },
    {
      question: 'Why is this important?',
      level: 2,
      type: 'Purpose/Motivation',
      expectedKeywords: ['purpose', 'reason'],
    },
    {
      question: 'What prerequisites are needed?',
      level: 3,
      type: 'Foundation/Prerequisites',
      expectedKeywords: ['foundation', 'prior knowledge'],
    },
    {
      question: 'What is a common misconception?',
      level: 4,
      type: 'Misconception Check',
      expectedKeywords: ['misconception', 'mistake'],
    },
    {
      question: 'How would you apply this?',
      level: 5,
      type: 'Application/Real-world',
      expectedKeywords: ['apply', 'real-world'],
    },
  ];
}

