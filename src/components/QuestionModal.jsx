import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import VoiceRecorder from './VoiceRecorder';
import { ENDPOINTS } from '../config';

const SAMPLE_QUESTIONS = [
  {
    level: 1,
    type: "Vocabulary/Definition",
    question: "What does the main concept mean in your own words?",
    expectedKeywords: []
  },
  {
    level: 2,
    type: "Purpose/Motivation",
    question: "Why would we need to understand this concept?",
    expectedKeywords: []
  },
  {
    level: 3,
    type: "Foundation/Prerequisites",
    question: "What other concepts do you need to know first?",
    expectedKeywords: []
  },
  {
    level: 4,
    type: "Misconception Check",
    question: "How is this different from related concepts?",
    expectedKeywords: []
  },
  {
    level: 5,
    type: "Application/Real-world",
    question: "Can you explain how this would work in a new scenario?",
    expectedKeywords: []
  }
];

export default function QuestionModal() {
  const {
    questions,
    currentQuestionIndex,
    answers,
    showQuestionModal,
    setQuestions,
    setCurrentQuestionIndex,
    setAnswer,
    setShowQuestionModal,
    selectedText,
    currentSessionId,
    history,
  } = useAppStore();

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch questions from API when modal first opens
  useEffect(() => {
    if (showQuestionModal && questions.length === 0) {
      loadQuestions();
    }
  }, [showQuestionModal]);

  // Load saved answer when switching between questions
  useEffect(() => {
    if (answers[currentQuestionIndex]) {
      setCurrentAnswer(answers[currentQuestionIndex]);
    } else {
      setCurrentAnswer('');
    }
  }, [currentQuestionIndex, answers]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const { fullText } = useAppStore.getState();
      const response = await fetch(ENDPOINTS.GENERATE_QUESTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          fullPdfText: fullText,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }
      
      const data = await response.json();
      const questionsArray = Array.isArray(data.questions) ? data.questions : [];
      const finalQuestions = questionsArray.slice(0, 5).map((q, idx) => {
        if (q && typeof q === 'object' && q.question) {
          return q;
        }
        // Transform string questions into structured format
        return {
          level: idx + 1,
          type: ['Vocabulary', 'Purpose', 'Foundation', 'Misconception', 'Application'][idx],
          question: typeof q === 'string' ? q : `Question ${idx + 1}: Can you explain this in your own words?`,
          expectedKeywords: []
        };
      });
      // Ensure we always have exactly 5 questions
      while (finalQuestions.length < 5) {
        const idx = finalQuestions.length;
        finalQuestions.push({
          level: idx + 1,
          type: ['Vocabulary', 'Purpose', 'Foundation', 'Misconception', 'Application'][idx],
          question: `Question ${idx + 1}: Can you explain this in your own words?`,
          expectedKeywords: []
        });
      }
      setQuestions(finalQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      // Use predefined questions if API fails
      setQuestions(SAMPLE_QUESTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setAnswer(currentQuestionIndex, currentAnswer);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setAnswer(currentQuestionIndex, currentAnswer);
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setAnswer(currentQuestionIndex, currentAnswer);

    const storeState = useAppStore.getState();
    const updatedQuestions = storeState.questions || [];
    const updatedAnswers = storeState.answers || [];

    const responses = updatedQuestions.map((questionObj, idx) => {
      const questionText = typeof questionObj === 'string'
        ? questionObj
        : (questionObj?.question || '');
      const level = typeof questionObj === 'object' && questionObj !== null && typeof questionObj.level === 'number'
        ? questionObj.level
        : idx + 1;
      return {
        question: questionText,
        answer: updatedAnswers[idx] || '',
        level,
      };
    });

    if (storeState.currentSessionId && storeState.history?.updateSessionProgress) {
      storeState.history.updateSessionProgress(
        storeState.currentSessionId,
        undefined,
        undefined,
        { questionResponses: responses }
      );
    }

    storeState.setQAData({
      questions: updatedQuestions,
      answers: updatedAnswers,
    });
    
    setShowQuestionModal(false);
  };

  const handleTranscription = (transcribedText) => {
    setCurrentAnswer(transcribedText);
  };

  if (!showQuestionModal) return null;

  const currentQuestionObj = questions[currentQuestionIndex] || {};
  const currentQuestion = typeof currentQuestionObj === 'string' 
    ? currentQuestionObj 
    : (currentQuestionObj.question || '');
  const questionType = currentQuestionObj.type || '';
  const questionLevel = currentQuestionObj.level || currentQuestionIndex + 1;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-2 sm:p-4">
      <div className="w-full max-w-2xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 gradient-border rounded-lg">
        {/* Header */}
        <div className="p-3 sm:p-6" style={{ borderBottom: '1px solid #FF4081' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="window-controls hidden sm:flex" style={{ marginBottom: 0 }}>
                <div className="window-dot window-dot-red"></div>
                <div className="window-dot window-dot-yellow"></div>
                <div className="window-dot window-dot-green"></div>
              </div>
              <h2 className="text-lg sm:text-2xl" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>Question Ladder</h2>
            </div>
            <button
              onClick={() => setShowQuestionModal(false)}
              className="transition-colors duration-200 rounded-full p-1"
              style={{ color: '#FF4081' }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full rounded-full h-2 sm:h-3" style={{ backgroundColor: '#1A1A1A' }}>
            <div
              className="h-2 sm:h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(135deg, #FF4081 0%, #E0007A 100%)'
              }}
            />
          </div>
          <p className="text-xs sm:text-sm mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#FF4081' }}>
            Question {currentQuestionIndex + 1} of 5
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6" style={{ backgroundColor: '#2D2D2D' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2" style={{ borderColor: '#FF4081' }}></div>
            </div>
          ) : (
            <>
              {questionType && (
                <div className="mb-2 sm:mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: '#1A1A1A', color: '#FF4081' }}>
                    Level {questionLevel}
                  </span>
                  <span className="text-[10px] sm:text-xs" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{questionType}</span>
                </div>
              )}
              <h3 className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg" style={{ 
                fontFamily: 'Poppins, sans-serif', 
                color: '#FFFFFF', 
                backgroundColor: '#1A1A1A', 
                borderLeft: '4px solid #FF4081'
              }}>
                {currentQuestion}
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-24 sm:h-32 p-3 sm:p-4 text-sm sm:text-base rounded-lg resize-none transition-all duration-200"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    color: '#F5D9E4',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #FF4081',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#E0007A'}
                  onBlur={(e) => e.target.style.borderColor = '#FF4081'}
                />
                
                <VoiceRecorder onTranscription={handleTranscription} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-6 flex justify-between gap-3" style={{ borderTop: '1px solid #FF4081', backgroundColor: '#2D2D2D' }}>
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="btn-secondary text-sm sm:text-base px-3 sm:px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
