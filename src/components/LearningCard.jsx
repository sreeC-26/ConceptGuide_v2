import { useState, useEffect } from 'react';

export default function LearningCard(props) {
  return <LearningCardContent key={props.step.stepNumber} {...props} />;
}

function LearningCardContent({ step, onMarkComplete, isLastStep, sharedAnswer, onAnswerChange }) {
  const [showSolution, setShowSolution] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Reset state when step changes (key change should handle this, but just in case)
  useEffect(() => {
    setShowSolution(false);
    setSelectedAnswer(null);
  }, [step?.stepNumber, step?.conceptName]);

  useEffect(() => {
    if (sharedAnswer !== null && sharedAnswer !== undefined) {
      setSelectedAnswer(sharedAnswer);
    }
  }, [sharedAnswer]);

  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
    if (onAnswerChange) {
      onAnswerChange(option);
    }
  };

  return (
    <div className="rounded-lg p-6" style={{ backgroundColor: '#1A1A1A', border: '2px solid #FF4081' }}>
      {/* Why This Step - Very Important Personalization Feature at the Top */}
      {step.whyThisStep && (
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#2D2D2D', border: '2px solid #E0007A' }}>
          <h4 className="font-semibold mb-2 flex items-center" style={{ fontFamily: 'Poppins, sans-serif', color: '#FF4081', fontSize: '1.25rem' }}>
            <span className="mr-2">🎯</span>
            Why This Step Matters
          </h4>
          <p className="leading-relaxed font-medium" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{step.whyThisStep}</p>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '1.75rem' }}>
            Step {step.stepNumber}: {step.conceptName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#2D2D2D', color: '#FF4081', fontFamily: 'Poppins, sans-serif' }}>
              Concept {step.stepNumber}
            </span>
            {step.timeEstimate && (
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#2D2D2D', color: '#FFBD2E', fontFamily: 'Poppins, sans-serif' }}>
                ⏱️ ~{step.timeEstimate} min
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Explanation */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#2D2D2D', border: '1px solid #FF4081' }}>
          <h4 className="font-semibold mb-2 flex items-center" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '1.25rem' }}>
            <span className="mr-2">💡</span>
            Explanation
          </h4>
          <p className="leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{step.explanation}</p>
        </div>

        {/* Examples */}
        {step.examples && step.examples.length > 0 && (
          <div className="rounded-lg p-4" style={{ backgroundColor: '#2D2D2D', border: '1px solid #FF4081' }}>
            <h4 className="font-semibold mb-2 flex items-center" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '1.25rem' }}>
              <span className="mr-2">📝</span>
              Examples
            </h4>
            <div className="space-y-3">
              {step.examples.map((example, index) => (
                <div key={index} className="rounded-lg p-3" style={{ backgroundColor: '#1A1A1A', borderLeft: '4px solid #FF4081' }}>
                  <h5 className="font-semibold mb-1" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '1.125rem' }}>{example.title}</h5>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{example.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Problem */}
        {step.practiceProblem && (
          <div className="rounded-lg p-4" style={{ backgroundColor: '#2D2D2D', border: '1px solid #FF4081' }}>
            <h4 className="font-semibold mb-2 flex items-center" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '1.25rem' }}>
              <span className="mr-2">✏️</span>
              Practice Problem
            </h4>
            <div className="rounded p-3 mb-3" style={{ backgroundColor: '#1A1A1A', border: '1px solid #FFBD2E' }}>
              <p className="font-medium" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{step.practiceProblem.question}</p>
            </div>

            {/* Multiple Choice Options */}
            {step.practiceProblem.options && step.practiceProblem.options.length > 0 && (
              <div className="space-y-2 mb-3">
                {step.practiceProblem.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === step.practiceProblem.correctAnswer;
                  const showResult = showSolution && isSelected;

                  return (
                    <button
                      key={index}
                      onClick={() => !showSolution && handleAnswerSelect(option)}
                      disabled={showSolution}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        showSolution && isCorrect
                          ? 'border-green-500'
                          : showResult && !isCorrect
                          ? 'border-red-500'
                          : isSelected
                          ? 'border-blue-500'
                          : 'border-gray-300 hover:border-pink-400'
                      } ${showSolution ? 'cursor-default' : 'cursor-pointer'}`}
                      style={{
                        backgroundColor: showSolution && isCorrect ? '#1A3A1A' : showResult && !isCorrect ? '#3A1A1A' : isSelected ? '#1A1A3A' : '#2D2D2D',
                        borderColor: showSolution && isCorrect ? '#27C93F' : showResult && !isCorrect ? '#FF5F56' : isSelected ? '#FF4081' : '#FF4081',
                        fontFamily: 'Poppins, sans-serif',
                        color: '#F5D9E4',
                      }}
                    >
                      <span className={showSolution && isCorrect ? 'font-semibold' : ''} style={{ color: showSolution && isCorrect ? '#27C93F' : '#F5D9E4' }}>
                        {option}
                        {showSolution && isCorrect && ' ✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!showSolution ? (
              <button
                onClick={() => setShowSolution(true)}
                className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                style={{ backgroundColor: '#FFBD2E', color: '#1A1A1A', fontFamily: 'Poppins, sans-serif' }}
              >
                {selectedAnswer ? 'Check Answer' : 'Show Solution'}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="rounded p-3" style={{ backgroundColor: '#1A3A1A', border: '1px solid #27C93F' }}>
                  <p style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>
                    <span className="font-semibold" style={{ color: '#27C93F' }}>Correct Answer: </span>
                    {step.practiceProblem.correctAnswer}
                  </p>
                </div>
                {step.practiceProblem.explanation && (
                  <div className="rounded p-3" style={{ backgroundColor: '#1A1A3A', border: '1px solid #FF4081' }}>
                    <p style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>
                      <span className="font-semibold" style={{ color: '#FF4081' }}>Explanation: </span>
                      {step.practiceProblem.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Connection to Next - Only show if not last step */}
        {!isLastStep && step.connectionToNext && (
          <div className="rounded-lg p-4" style={{ backgroundColor: '#2D2D2D', border: '2px solid #E0007A' }}>
            <h4 className="font-semibold mb-2 flex items-center" style={{ fontFamily: 'Poppins, sans-serif', color: '#FF4081', fontSize: '1.25rem' }}>
              <span className="mr-2">🔗</span>
              What's Next?
            </h4>
            <p className="leading-relaxed font-medium" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{step.connectionToNext}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4">
          {step.practiceProblem && !showSolution ? (
            <button
              disabled
              className="w-full px-6 py-3 rounded-lg transition-all font-semibold text-lg opacity-50 cursor-not-allowed"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.25rem',
                backgroundColor: '#2D2D2D',
                color: '#F5D9E4',
                border: '1px solid #FF4081',
              }}
            >
              Please solve the practice problem first
            </button>
          ) : (
            <button
              onClick={onMarkComplete}
              className="w-full px-6 py-3 rounded-lg transition-all font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] btn-primary"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem' }}
            >
              {isLastStep ? 'Complete Learning Path ✓' : 'Mark Complete & Continue →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
