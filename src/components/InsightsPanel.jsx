import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateCustomInsights } from '../services/customAnalytics';

export default function InsightsPanel() {
  const { history, refreshInsightsTimestamp } = useAppStore();
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    const sessions = history?.getAllSessions?.() || [];
    const calculated = calculateCustomInsights(sessions);
    setInsights(calculated);
  }, [history, refreshInsightsTimestamp]);

  if (!insights) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Most Frequent Confusion */}
      <InsightCard
        icon="📊"
        title="Most Frequent Confusion"
        message={insights.mostFrequentConfusion.message}
      />

      {/* Strongest Area */}
      <InsightCard
        icon="💪"
        title="Strongest Concept Area"
        message={insights.strongestArea.message}
      />

      {/* Growth Opportunity */}
      <InsightCard
        icon="🎯"
        title="Growth Opportunity"
        message={insights.growthOpportunity.message}
      />

      {/* Focus Concepts */}
      {insights.focusConcepts.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-pink-500">
          <h3 className="text-lg font-semibold text-pink-400 mb-3">🎯 Focus Concepts</h3>
          <div className="space-y-2">
            {insights.focusConcepts.map((concept, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">{concept.concept}</span>
                <span className="text-pink-400">{concept.mastery}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Wins */}
      {insights.recentWins.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-green-500">
          <h3 className="text-lg font-semibold text-green-400 mb-3">🏆 Recent Wins</h3>
          <div className="space-y-2">
            {insights.recentWins.map((concept, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">{concept.concept}</span>
                <span className="text-green-400">{concept.mastery}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Momentum */}
      <InsightCard
        icon="⏱️"
        title="Study Momentum"
        message={insights.studyMomentum.message}
      />

      {/* Learning Trend */}
      <InsightCard
        icon="📈"
        title="Learning Trend"
        message={insights.learningTrend.message}
      />
    </div>
  );
}

function InsightCard({ icon, title, message }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-pink-500">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-pink-400">{title}</h3>
      </div>
      <p className="text-gray-300 text-sm">{message}</p>
    </div>
  );
}