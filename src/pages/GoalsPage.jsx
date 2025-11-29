import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoalsStore, GOAL_TYPES, GOAL_PERIODS } from '../store/useGoalsStore';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import TopNavBar from '../components/TopNavBar';
import GoalCard from '../components/GoalCard';
import CreateGoalModal from '../components/CreateGoalModal';
import NotificationToast from '../components/NotificationToast';

export default function GoalsPage() {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const sessions = useAppStore((state) => state.history?.sessions) || [];
  const syncSessionsFromFirebase = useAppStore((state) => state.syncSessionsFromFirebase);
  
  const { 
    goals, 
    fetchGoals, 
    addGoal, 
    removeGoal, 
    toggleGoalActive,
    getGoalsWithProgress,
    activeReminders,
    checkReminders,
    dismissReminder,
    isLoading 
  } = useGoalsStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => setIsDesktop(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch goals and sessions when user logs in
  useEffect(() => {
    if (user?.uid) {
      fetchGoals();
      syncSessionsFromFirebase();
    }
  }, [user?.uid, fetchGoals, syncSessionsFromFirebase]);

  // Check reminders when goals or sessions change
  useEffect(() => {
    if (goals.length > 0 && sessions.length >= 0) {
      checkReminders(sessions);
    }
  }, [goals, sessions, checkReminders]);

  const goalsWithProgress = getGoalsWithProgress(sessions);
  
  // Calculate overall stats
  const activeGoals = goalsWithProgress.filter(g => g.isActive);
  const completedGoals = activeGoals.filter(g => g.progress?.isCompleted);
  const totalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + (g.progress?.percentage || 0), 0) / activeGoals.length)
    : 0;

  const handleCreateGoal = async (goalData) => {
    await addGoal(goalData);
    setShowCreateModal(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#1A1A1A] text-pink-100 flex flex-col">
        <TopNavBar isDesktop={isDesktop} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-pink-400 mb-2">Sign In Required</h2>
            <p className="text-gray-400 mb-4">Please sign in to set and track your study goals.</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary px-6 py-2"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] text-pink-100 flex flex-col">
      <TopNavBar isDesktop={isDesktop} />
      
      {/* Notification Toasts */}
      <NotificationToast 
        reminders={activeReminders} 
        onDismiss={dismissReminder} 
      />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-pink-400 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                🎯 Study Goals
              </h1>
              <p className="text-gray-400">Set targets and track your learning progress</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              New Goal
            </button>
          </div>

          {/* Overall Progress Card */}
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl p-6 mb-8 border border-pink-500/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400">{activeGoals.length}</div>
                <div className="text-gray-400 text-sm">Active Goals</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400">{completedGoals.length}</div>
                <div className="text-gray-400 text-sm">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400">{totalProgress}%</div>
                <div className="text-gray-400 text-sm">Avg Progress</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400">
                  {sessions.filter(s => s.analysisComplete).length}
                </div>
                <div className="text-gray-400 text-sm">Total Sessions</div>
              </div>
            </div>
            
            {/* Overall Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Overall Goal Progress</span>
                <span>{totalProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalProgress}%`,
                    background: totalProgress >= 100 
                      ? 'linear-gradient(90deg, #22c55e, #10b981)' 
                      : 'linear-gradient(90deg, #FF4081, #E0007A)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
            </div>
          ) : goalsWithProgress.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">No Goals Yet</h3>
              <p className="text-gray-500 mb-4">Create your first study goal to start tracking progress!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary px-6 py-2"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goalsWithProgress.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggle={() => toggleGoalActive(goal.id)}
                  onDelete={() => removeGoal(goal.id)}
                />
              ))}
            </div>
          )}

          {/* Quick Tips */}
          <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold text-pink-400 mb-4">💡 Goal Setting Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Start with achievable weekly goals like 3-5 study sessions</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Track time spent to build consistent study habits</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Enable reminders to stay on track with your goals</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGoal}
        />
      )}
    </div>
  );
}

