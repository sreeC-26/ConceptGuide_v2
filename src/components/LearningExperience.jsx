import { useState, useEffect, useRef } from 'react';
import AnalysisResultsPage from './AnalysisResultsPage';
import MindMapPage from './MindMapPage';
import RepairPath from './RepairPath';
import Congratulations from './Congratulations';
import { useAppStore } from '../store/useAppStore';


export default function LearningExperience({ sessionData, sessionId }) {


  const hasPersistedCompletionRef = useRef(false);
  const analyzedSessionIdRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  
  // Only subscribe to specific values we need
  const reviewMode = useAppStore((state) => state.reviewMode);
  const reviewAnalysis = useAppStore((state) => state.reviewAnalysis);


  // Initialize analyzing state - false if we have existing analysis or are in review mode
  const [analyzing, setAnalyzing] = useState(() => {
    // If we have reviewAnalysis, don't analyze
    if (reviewMode && reviewAnalysis) return false;
    // If we have a sessionId, check if it has analysis in history
    if (sessionId) {
      const history = useAppStore.getState().history;
      const session = history?.getSessionById?.(sessionId);
      if (session?.analysisResult) return false;
    }
    // Otherwise, we need to analyze
    return true;
  });
  // Flow states: 'results' | 'mindmap' | 'path' | 'congratulations'
  const [currentView, setCurrentView] = useState('results');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);


  useEffect(() => {
    // Reset analyzing flag when sessionId changes (new session)
    if (analyzedSessionIdRef.current !== sessionId) {
      isAnalyzingRef.current = false;
      // Reset analysis result for new session
      if (!reviewMode) {
        setAnalysisResult(null);
        setCurrentView('results');
      }
    }

    // FIRST: Check if we have analysis result already (from state, store, or history) - restore immediately
    if (sessionId) {
      const history = useAppStore.getState().history;
      const session = history?.getSessionById?.(sessionId);
     
      // Priority 1: If we have analysisResult in component state, use it directly
      // CRITICAL: Only return early if we've already analyzed for THIS session
      if (analysisResult && analyzedSessionIdRef.current === sessionId) {
        setAnalyzing(false);
       
        // Restore view based on progress
        if (session?.completedSteps !== undefined && session?.totalSteps) {
          if (session.completedSteps >= session.totalSteps) {
            // Completed - show congratulations
            setCurrentView('congratulations');
          } else if (session.completedSteps > 0 && analysisResult.repairPath && analysisResult.repairPath.length > 0) {
            // In middle of learning path - show it directly
            setCurrentView('path');
          } else {
            // Start at results page
            setCurrentView('results');
          }
        } else {
          // Start at results page
          setCurrentView('results');
        }
        return;
      }
     
      // Priority 2: If we have reviewAnalysis in store for current session (not review mode), use it
      // CRITICAL: Only use reviewAnalysis if we haven't already analyzed for this session
      if (reviewAnalysis && !reviewMode && sessionId === useAppStore.getState().currentSessionId && analyzedSessionIdRef.current !== sessionId) {
        setAnalyzing(false);
        setAnalysisResult(reviewAnalysis);
        analyzedSessionIdRef.current = sessionId;
       
        // Restore view based on progress
        if (session?.completedSteps !== undefined && session?.totalSteps) {
          if (session.completedSteps >= session.totalSteps) {
            setCurrentView('congratulations');
          } else if (session.completedSteps > 0 && reviewAnalysis.repairPath && reviewAnalysis.repairPath.length > 0) {
            setCurrentView('path');
          } else {
            setCurrentView('results');
          }
        } else {
          setCurrentView('results');
        }
        return;
      }
     
      // Priority 3: If we don't have analysisResult but have it in session history, restore it
      // CRITICAL: Only restore if we haven't already analyzed for this session
      if (session?.analysisResult && analyzedSessionIdRef.current !== sessionId) {
        setAnalyzing(false);
        setAnalysisResult(session.analysisResult);
        analyzedSessionIdRef.current = sessionId;
       
        // Restore view based on progress
        if (session.completedSteps !== undefined && session.totalSteps) {
          if (session.completedSteps >= session.totalSteps) {
            setCurrentView('congratulations');
          } else if (session.completedSteps > 0 && session.analysisResult.repairPath && session.analysisResult.repairPath.length > 0) {
            setCurrentView('path');
          } else {
            setCurrentView('results');
          }
        } else {
          setCurrentView('results');
        }
        return;
      }
     
      // If already analyzed for this session AND we have analysisResult, skip
      if (analyzedSessionIdRef.current === sessionId && analysisResult) {
        setAnalyzing(false);
        return;
      }
    }


    // SECOND: Handle review mode (when reviewing an old session)
    if (reviewMode && reviewAnalysis) {
      setAnalyzing(false);
      setError(null);
      setAnalysisResult(reviewAnalysis);
     
      // Determine what to show based on stored progress
      const history = useAppStore.getState().history;
      const session = history?.getSessionById?.(sessionId);
      if (session?.completedSteps !== undefined && session?.totalSteps) {
        if (session.completedSteps >= session.totalSteps) {
          // Completed - show mindmap (as per user requirement)
          setCurrentView('mindmap');
        } else if (session.completedSteps > 0 && reviewAnalysis.repairPath && reviewAnalysis.repairPath.length > 0) {
          // Resume at learning path where they left off
          setCurrentView('path');
        } else {
          // Show results page
          setCurrentView('results');
        }
      } else {
        setCurrentView('results');
      }
      analyzedSessionIdRef.current = sessionId;
      return;
    }


    // Don't analyze if we don't have sessionData
    if (!sessionData || !sessionData.qaPairs || sessionData.qaPairs.length === 0) {
      setAnalyzing(false);
      return;
    }

    // CRITICAL: Prevent multiple simultaneous analysis calls
    // Check if we're already analyzing
    if (isAnalyzingRef.current) {
      console.log('[LearningExperience] Already analyzing, skipping...');
      return;
    }
    
    // Only skip if we've already analyzed AND have the result for this exact session
    // Don't skip if we have a different sessionId or no result yet
    if (analyzedSessionIdRef.current === sessionId && analysisResult && analysisResult.overallAccuracy !== undefined) {
      console.log('[LearningExperience] Already analyzed for this session with result, skipping...');
      setAnalyzing(false);
      return;
    }
    
    // If sessionId changed, reset the ref
    if (analyzedSessionIdRef.current !== sessionId && analyzedSessionIdRef.current !== null) {
      console.log('[LearningExperience] Session changed, resetting analysis state');
      isAnalyzingRef.current = false;
    }

    let cancelled = false;

    const fetchAnalysis = async () => {
      // Mark as analyzing to prevent duplicate calls
      isAnalyzingRef.current = true;
      
      try {
        setAnalyzing(true);
        setError(null);

        console.log('[LearningExperience] Starting analysis with sessionData:', {
          sessionId,
          hasSelectedText: !!sessionData.selectedText,
          qaPairsCount: sessionData.qaPairs?.length,
          qaPairs: sessionData.qaPairs,
          analyzedSessionIdRef: analyzedSessionIdRef.current,
          hasAnalysisResult: !!analysisResult
        });

        const response = await fetch('http://localhost:3001/api/analyze-and-generate-path', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        });

        console.log('[LearningExperience] Response status:', response.status);

        if (!response.ok) {
          let errorMessage = `Analysis failed: ${response.statusText}`;
          try {
            const errorData = await response.json();
            console.error('[LearningExperience] Error data:', errorData);
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) {
              errorMessage += ` - ${errorData.details}`;
            }
          } catch (e) {
            console.error('[LearningExperience] Could not parse error response');
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('[LearningExperience] Analysis complete, has mindMap:', !!data.mindMap);
        
        if (!cancelled) {
          console.log('[LearningExperience] Analysis successful, setting result and showing results page');
          setAnalysisResult(data);
          setAnalyzing(false);
          setCurrentView('results'); // Start with results page
          analyzedSessionIdRef.current = sessionId;
          isAnalyzingRef.current = false; // Clear the flag
         
          if (sessionId === useAppStore.getState().currentSessionId && !reviewMode) {
            useAppStore.getState().setReviewAnalysis(data);
          }
         
          const history = useAppStore.getState().history;
          if (sessionId && history?.updateSessionProgress) {
            // Update session with analysis results
            history.updateSessionProgress(sessionId, undefined, undefined, {
              analysisResult: data,
              mindMapData: data.mindMap || null,
              repairPathData: data.repairPath || [],
              diagnosticSummary: data.diagnosticSummary || '',
              confusionType: data.confusionType || null,
              masteryScore: data.masteryScore || (data.overallAccuracy ? Math.round(data.overallAccuracy * 100) : null),
              levelScores: data.levelScores || [],
              overallAccuracy: data.overallAccuracy || 0,
              overallConfidence: data.overallConfidence || 0,
              specificGaps: data.specificGaps || [],
              secondaryTypes: data.secondaryTypes || [],
              analysisComplete: true,
            });
            
            // Also ensure the session is added/updated in history with analysisComplete flag
            const session = history.getSessionById(sessionId);
            if (session) {
              // Session exists, update is already done above
              console.log('[LearningExperience] Session updated with analysis results');
            } else {
              // Session doesn't exist yet, create it
              console.log('[LearningExperience] Creating new session with analysis results');
              history.addSession({
                id: sessionId,
                analysisResult: data,
                mindMapData: data.mindMap || null,
                repairPathData: data.repairPath || [],
                diagnosticSummary: data.diagnosticSummary || '',
                confusionType: data.confusionType || null,
                masteryScore: data.masteryScore || (data.overallAccuracy ? Math.round(data.overallAccuracy * 100) : null),
                levelScores: data.levelScores || [],
                overallAccuracy: data.overallAccuracy || 0,
                overallConfidence: data.overallConfidence || 0,
                specificGaps: data.specificGaps || [],
                secondaryTypes: data.secondaryTypes || [],
                analysisComplete: true,
              });
            }
          }
        }
      } catch (err) {
        console.error('[LearningExperience] Analysis error:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setAnalyzing(false);
          isAnalyzingRef.current = false; // Clear the flag on error
        }
      }
    };

    fetchAnalysis();

    return () => {
      cancelled = true;
      isAnalyzingRef.current = false; // Clear the flag on cleanup
    };
  }, [sessionData, reviewMode, reviewAnalysis, sessionId]); // reviewAnalysis needed to detect when it's set, but guards prevent re-analysis


  const handleViewMindMap = () => {
    setCurrentView('mindmap');
  };

  const handleBackFromMindMap = () => {
    setCurrentView('results');
  };

  const handleContinueToPath = () => {
    setCurrentView('path');
  };

  const handlePathComplete = () => {
    // Learning path completed - show congratulations
    setCurrentView('congratulations');

    const history = useAppStore.getState().history;
    if (!hasPersistedCompletionRef.current && history?.updateSessionProgress && sessionId && analysisResult?.repairPath) {
      const totalSteps = analysisResult.repairPath.length;
      // Save completion with all analysis data
      history.updateSessionProgress(sessionId, totalSteps, undefined, {
        completedSteps: totalSteps,
        totalSteps,
        analysisResult: analysisResult,
        mindMapData: analysisResult.mindMap || null,
        repairPathData: analysisResult.repairPath || [],
        diagnosticSummary: analysisResult.diagnosticSummary || '',
        confusionType: analysisResult.confusionType || null,
        masteryScore: analysisResult.masteryScore || (analysisResult.overallAccuracy ? Math.round(analysisResult.overallAccuracy * 100) : null),
        levelScores: analysisResult.levelScores || [],
        overallAccuracy: analysisResult.overallAccuracy || 0,
        overallConfidence: analysisResult.overallConfidence || 0,
        specificGaps: analysisResult.specificGaps || [],
        secondaryTypes: analysisResult.secondaryTypes || [],
      });
      hasPersistedCompletionRef.current = true;
      useAppStore.getState().setRefreshInsightsTimestamp(Date.now());
    }
  };


  const handleCongratulationsComplete = () => {
    // Reset to home screen
    useAppStore.getState().reset();
    setCurrentView('results');
    // Reload page to return to home
    window.location.reload();
  };


  if (analyzing) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="text-center gradient-border rounded-lg p-8">
          <div className="window-controls mb-4">
            <div className="window-dot window-dot-red"></div>
            <div className="window-dot window-dot-yellow"></div>
            <div className="window-dot window-dot-green"></div>
          </div>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: '#FF4081' }}></div>
          <p className="text-lg mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '1.5rem' }}>Analyzing your responses...</p>
          <p className="text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>This may take a few moments</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="gradient-border rounded-lg p-8 max-w-md">
          <div className="window-controls mb-4">
            <div className="window-dot window-dot-red"></div>
            <div className="window-dot window-dot-yellow"></div>
            <div className="window-dot window-dot-green"></div>
          </div>
          <div className="text-2xl mb-4" style={{ color: '#FF4081' }}>⚠️</div>
          <h2 className="text-xl mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '1.75rem' }}>Analysis Error</h2>
          <p className="mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  // If we're analyzing, show loading state
  if (analyzing) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="text-center gradient-border rounded-lg p-8">
          <div className="window-controls mb-4">
            <div className="window-dot window-dot-red"></div>
            <div className="window-dot window-dot-yellow"></div>
            <div className="window-dot window-dot-green"></div>
          </div>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: '#FF4081' }}></div>
          <p className="text-lg mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '1.5rem' }}>Analyzing your responses...</p>
          <p className="text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>This may take a few moments</p>
        </div>
      </div>
    );
  }

  // If we have reviewAnalysis but no analysisResult yet, wait for useEffect to set it
  if (!analysisResult && !reviewMode && !reviewAnalysis && !analyzing) {
    // Show a loading state instead of null
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: '#FF4081' }}></div>
          <p className="text-lg" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>Preparing analysis...</p>
        </div>
      </div>
    );
  }

  // Use reviewAnalysis if available, otherwise use analysisResult
  const displayResult = reviewAnalysis || analysisResult;
 
  if (!displayResult) {
    return null;
  }

  // Render based on current view
  if (currentView === 'congratulations') {
    return <Congratulations onComplete={handleCongratulationsComplete} />;
  }

  if (currentView === 'mindmap') {
    return (
      <MindMapPage
        mindMap={displayResult.mindMap}
        onBack={handleBackFromMindMap}
        onContinueToPath={handleContinueToPath}
      />
    );
  }

  if (currentView === 'path') {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="container mx-auto max-w-6xl">
          <RepairPath
            steps={displayResult.repairPath || []}
            onComplete={handlePathComplete}
            sessionId={sessionId}
          />
        </div>
      </div>
    );
  }

  // Default: Show analysis results page
  return (
    <AnalysisResultsPage
      analysisResult={displayResult}
      onViewMindMap={handleViewMindMap}
    />
  );
}



