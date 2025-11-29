import { useState, useEffect, useRef } from 'react'
import LearningCard from './LearningCard'
import { useAppStore } from '../store/useAppStore'

export default function RepairPath({ steps, onComplete, sessionId }) {
  const currentSessionId = useAppStore((state) => state.currentSessionId)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [sharedAnswers, setSharedAnswers] = useState({})
  const startTimeRef = useRef(Date.now())
  const hasInitializedRef = useRef(false)

  // Get the session ID to use
  const sessionIdToUse = sessionId || currentSessionId

  // Restore progress on mount
  useEffect(() => {
    if (hasInitializedRef.current) return
    if (!sessionIdToUse || !steps || steps.length === 0) return
    
    const history = useAppStore.getState().history
    if (!history?.getSessionById) return
    
    const session = history.getSessionById(sessionIdToUse)
    if (session?.completedSteps !== undefined && session?.totalSteps) {
      if (session.completedSteps < session.totalSteps) {
        const restoredIndex = Math.min(session.completedSteps, steps.length - 1)
        setCurrentStepIndex(Math.max(0, restoredIndex))
      }
    }
    hasInitializedRef.current = true
  }, [sessionIdToUse, steps])

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleMarkComplete = () => {
    console.log('[RepairPath] handleMarkComplete called, currentStepIndex:', currentStepIndex, 'isLastStep:', isLastStep)
    
    // Calculate time spent
    const elapsedMinutes = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / (1000 * 60)))
    
    if (isLastStep) {
      // Save progress to store if we have a session
      if (sessionIdToUse) {
        const history = useAppStore.getState().history
        if (history?.updateSessionProgress) {
          history.updateSessionProgress(sessionIdToUse, steps.length, elapsedMinutes, {
            completedSteps: steps.length,
            totalSteps: steps.length,
          })
        }
      }
      // Call onComplete to show congratulations
      if (onComplete) {
        onComplete()
      }
    } else {
      // Advance to next step
      const newIndex = currentStepIndex + 1
      console.log('[RepairPath] Advancing to step:', newIndex)
      setCurrentStepIndex(newIndex)
      startTimeRef.current = Date.now()
      
      // Save progress to store if we have a session
      if (sessionIdToUse) {
        const history = useAppStore.getState().history
        if (history?.updateSessionProgress) {
          history.updateSessionProgress(sessionIdToUse, newIndex, elapsedMinutes, {
            completedSteps: newIndex,
            totalSteps: steps.length,
          })
        }
      }
    }
  }

  const handleAnswerChange = (stepNumber, answer) => {
    setSharedAnswers(prev => ({
      ...prev,
      [stepNumber]: answer
    }))
  }

  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-pink-400">No learning steps available.</p>
      </div>
    )
  }

  return (
    <div className="gradient-border rounded-lg p-6">
      <div className="window-controls mb-4">
        <div className="window-dot window-dot-red"></div>
        <div className="window-dot window-dot-yellow"></div>
        <div className="window-dot window-dot-green"></div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl flex items-center" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '2rem' }}>
            <span className="mr-2">🎓</span>
            Personalized Learning Path
          </h2>
          <span className="text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full rounded-full h-2.5 mb-4" style={{ backgroundColor: '#1A1A1A' }}>
          <div
            className="h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(135deg, #FF4081 0%, #E0007A 100%)'
            }}
          ></div>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 justify-center flex-wrap">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                index < currentStepIndex
                  ? 'text-white'
                  : index === currentStepIndex
                  ? 'text-white ring-2'
                  : 'text-gray-600'
              }`}
              style={{
                backgroundColor: index < currentStepIndex ? '#27C93F' : index === currentStepIndex ? '#FF4081' : '#2D2D2D',
                border: index === currentStepIndex ? '2px solid #E0007A' : 'none',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1rem'
              }}
            >
              {index < currentStepIndex ? '✓' : index + 1}
            </div>
          ))}
        </div>
      </div>

      {!isFirstStep && (
        <div className="flex gap-4 mb-4">
          <button
            onClick={handlePrevious}
            className="btn-secondary flex-1"
          >
            ← Previous Step
          </button>
        </div>
      )}

      {currentStep && (
        <LearningCard
          key={`step-${currentStepIndex}`}
          step={currentStep}
          onMarkComplete={handleMarkComplete}
          isLastStep={isLastStep}
          sharedAnswer={sharedAnswers[currentStep.stepNumber]}
          onAnswerChange={(answer) => handleAnswerChange(currentStep.stepNumber, answer)}
        />
      )}
    </div>
  )
}
