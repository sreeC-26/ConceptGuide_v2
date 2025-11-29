import { useState } from 'react';
import { GOAL_TYPES, GOAL_PERIODS } from '../store/useGoalsStore';

const goalTypeIcons = {
  [GOAL_TYPES.SESSIONS]: '📚',
  [GOAL_TYPES.TIME]: '⏱️',
  [GOAL_TYPES.MASTERY]: '🎯',
  [GOAL_TYPES.STREAK]: '🔥',
};

const goalTypeLabels = {
  [GOAL_TYPES.SESSIONS]: 'Sessions',
  [GOAL_TYPES.TIME]: 'Minutes',
  [GOAL_TYPES.MASTERY]: 'Avg Mastery %',
  [GOAL_TYPES.STREAK]: 'Day Streak',
};

const periodLabels = {
  [GOAL_PERIODS.DAILY]: 'Daily',
  [GOAL_PERIODS.WEEKLY]: 'Weekly',
  [GOAL_PERIODS.MONTHLY]: 'Monthly',
};

export default function GoalCard({ goal, onToggle, onDelete }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const { progress } = goal;
  const isCompleted = progress?.isCompleted;
  const percentage = progress?.percentage || 0;
  
  const getProgressColor = () => {
    if (isCompleted) return 'from-green-500 to-emerald-400';
    if (percentage >= 75) return 'from-blue-500 to-cyan-400';
    if (percentage >= 50) return 'from-yellow-500 to-orange-400';
    if (percentage >= 25) return 'from-orange-500 to-red-400';
    return 'from-pink-500 to-rose-400';
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
          ✓ Completed
        </span>
      );
    }
    if (progress?.daysRemaining <= 1) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
          ⚠️ Ending Soon
        </span>
      );
    }
    if (!goal.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
          Paused
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
        In Progress
      </span>
    );
  };

  const handleDelete = () => {
    if (showConfirmDelete) {
      onDelete();
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
      setTimeout(() => setShowConfirmDelete(false), 3000);
    }
  };

  return (
    <div 
      className={`relative rounded-xl p-5 border transition-all duration-300 ${
        goal.isActive 
          ? 'bg-gray-800 border-pink-500/50 hover:border-pink-400' 
          : 'bg-gray-800/50 border-gray-700 opacity-75'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{goalTypeIcons[goal.type] || '🎯'}</span>
          <div>
            <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {goal.name}
            </h3>
            <p className="text-gray-400 text-sm">
              {periodLabels[goal.period]} • {goalTypeLabels[goal.type]}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress Display */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-3xl font-bold text-white">{progress?.current || 0}</span>
            <span className="text-gray-400 text-lg"> / {progress?.target || goal.target}</span>
          </div>
          <span className={`text-2xl font-bold ${isCompleted ? 'text-green-400' : 'text-pink-400'}`}>
            {percentage}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressColor()}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </div>

      {/* Time Remaining */}
      {goal.isActive && !isCompleted && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {progress?.daysRemaining === 0 
              ? 'Last day!' 
              : `${progress?.daysRemaining} day${progress?.daysRemaining !== 1 ? 's' : ''} remaining`}
          </span>
        </div>
      )}

      {/* Reminder Status */}
      {goal.reminderEnabled && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>Reminders enabled</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
        <button
          onClick={onToggle}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            goal.isActive
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400'
          }`}
        >
          {goal.isActive ? '⏸️ Pause' : '▶️ Resume'}
        </button>
        <button
          onClick={handleDelete}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showConfirmDelete
              ? 'bg-red-500 text-white'
              : 'bg-gray-700 hover:bg-red-500/20 text-gray-300 hover:text-red-400'
          }`}
        >
          {showConfirmDelete ? 'Confirm?' : '🗑️'}
        </button>
      </div>

      {/* Completion Animation */}
      {isCompleted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div className="absolute -top-2 -right-2 text-4xl animate-bounce">🎉</div>
        </div>
      )}
    </div>
  );
}

