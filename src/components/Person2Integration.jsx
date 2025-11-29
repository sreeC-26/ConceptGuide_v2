import { useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import LearningExperience from './LearningExperience';

export default function Person2Integration({ questions, answers, selectedText, surroundingContext }) {
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const setCurrentSessionId = useAppStore((state) => state.setCurrentSessionId);
  const fileName = useAppStore((state) => state.fileName);
  const hasCreatedSessionRef = useRef(false);

  const qaPairs = useMemo(() => {
    if (!Array.isArray(questions) || !Array.isArray(answers) || questions.length === 0) {
      return [];
    }

    return questions.map((question, index) => {
      const questionObj = typeof question === 'object' ? question : { question: question };
      
      return {
        question: questionObj.question || questionObj,
        answer: answers[index] || '',
        level: questionObj.level || index + 1,
        type: questionObj.type || ['Vocabulary/Definition', 'Purpose/Motivation', 'Foundation/Prerequisites', 'Misconception Check', 'Application/Real-world'][index],
        expectedKeywords: questionObj.expectedKeywords || []
      };
    });
  }, [questions, answers]);

  // Create session only once
  useEffect(() => {
    if (hasCreatedSessionRef.current || currentSessionId || qaPairs.length === 0) {
      return;
    }

    console.log('[Person2Integration] Creating session with qaPairs:', qaPairs.length);
    hasCreatedSessionRef.current = true;

    const history = useAppStore.getState().history;
    if (!history?.addSession) return;

    const newSessionId = history.addSession({
      fullSelectedText: selectedText || '',
      pdfName: fileName || '',
      questionResponses: qaPairs.map((qa, index) => ({
        question: qa.question,
        answer: qa.answer,
        level: qa.level || index + 1,
        type: qa.type,
        expectedKeywords: qa.expectedKeywords
      })),
    });

    if (newSessionId) {
      setCurrentSessionId(newSessionId);
    }
  }, [currentSessionId, setCurrentSessionId, selectedText, fileName, qaPairs]);

  const sessionData = useMemo(() => {
    if (qaPairs.length === 0) {
      return null;
    }
    
    return {
      selectedText: selectedText || '',
      qaPairs,
    };
  }, [selectedText, qaPairs]);

  if (!sessionData) {
    return null;
  }

  return <LearningExperience sessionData={sessionData} sessionId={currentSessionId} />;
}
