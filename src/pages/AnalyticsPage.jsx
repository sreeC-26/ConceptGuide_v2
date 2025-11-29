import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export default function AnalyticsPage() {
  const { history } = useAppStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const allSessions = history?.getAllSessions?.() || [];
    
    // Filter sessions that have some analysis data
    const completeSessions = allSessions.filter(s => 
      s.analysisComplete === true || 
      s.analysisResult != null ||
      s.masteryScore != null ||
      s.confusionType != null
    );
    
    console.log('[AnalyticsPage] All:', allSessions.length, 'With analysis:', completeSessions.length);
    
    calculateStats(completeSessions);
  }, [history]);

  const calculateStats = (sessions) => {
    const totalSessions = sessions.length;
    const totalSteps = sessions.reduce((sum, s) => sum + (s.completedSteps || 0), 0);
    const totalTime = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    
    const avgMastery = totalSessions > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.masteryScore || 0), 0) / totalSessions)
      : 0;

    // Calculate streak
    const streak = calculateStreak(sessions);

    // Confusion type breakdown - exclude Unknown
    const confusionBreakdown = {};
    sessions.forEach(s => {
      if (s.confusionType && 
          s.confusionType !== 'Unknown' && 
          s.confusionType.toLowerCase() !== 'unknown') {
        confusionBreakdown[s.confusionType] = (confusionBreakdown[s.confusionType] || 0) + 1;
      }
    });

    setStats({
      totalSessions,
      totalSteps,
      totalTime,
      avgMastery,
      streak,
      confusionBreakdown
    });
  };

  const calculateStreak = (sessions) => {
    if (sessions.length === 0) return 0;

    const dates = sessions
      .map(s => new Date(s.timestamp).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 1;
    const today = new Date().toDateString();
    const yesterday = getYesterday();

    if (dates[0] !== today && dates[0] !== yesterday) {
      return 0;
    }

    for (let i = 1; i < dates.length; i++) {
      const current = new Date(dates[i]);
      const previous = new Date(dates[i - 1]);
      const diffDays = Math.floor((previous - current) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1A1A1A]">
        <div className="text-pink-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-6 flex flex-col">
      <div className="max-w-7xl mx-auto flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-pink-400 mb-2">📊 Learning Analytics</h1>
            <p className="text-gray-400">Track your progress and identify patterns</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
          >
            Back to History
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 flex-shrink-0">
          <StatCard
            icon="📚"
            title="Completed Sessions"
            value={stats.totalSessions}
            subtitle="With full analysis"
            color="pink"
          />
          <StatCard
            icon="✅"
            title="Steps Completed"
            value={stats.totalSteps}
            color="green"
          />
          <StatCard
            icon="🎯"
            title="Average Mastery"
            value={`${stats.avgMastery}%`}
            color="blue"
          />
          <StatCard
            icon="⏱️"
            title="Total Time"
            value={formatTime(stats.totalTime)}
            color="purple"
          />
        </div>

        {/* Streak */}
        <div className="bg-gray-800 rounded-lg p-8 border border-pink-500 mb-8 flex-shrink-0">
          <h2 className="text-2xl font-bold text-pink-400 mb-4">🔥 Study Streak</h2>
          <div className="flex items-center gap-6">
            <div className="text-7xl font-bold text-pink-400">
              {stats.streak}
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-200">days</div>
              <div className="text-gray-400">Keep the momentum going!</div>
            </div>
          </div>
        </div>

        {/* Confusion Breakdown */}
        <div className="flex-1 flex flex-col min-h-0">
        {Object.keys(stats.confusionBreakdown).length > 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 border border-pink-500 flex-1 flex flex-col">
            <h2 className="text-2xl font-bold text-pink-400 mb-6 flex-shrink-0">📊 Confusion Type Breakdown</h2>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {Object.entries(stats.confusionBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const percentage = Math.round((count / stats.totalSessions) * 100);
                  return (
                    <div key={type}>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 capitalize">
                          {formatConfusionType(type)}
                        </span>
                        <span className="text-pink-400">{count} sessions ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-pink-500 h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 border border-pink-500 text-center flex-1 flex items-center justify-center">
            <div>
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-pink-400 mb-2">No Analytics Yet</h3>
              <p className="text-gray-400">Complete your first learning session to see analytics!</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon, title, value, subtitle, color }) {
  const colorClasses = {
    pink: 'border-pink-500',
    green: 'border-green-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500'
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <div className="text-4xl font-bold text-pink-400">{value}</div>
      </div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function formatTime(minutes) {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatConfusionType(type) {
  if (!type) return 'Unknown';
  return type
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}