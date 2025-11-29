import { useState } from 'react';
import { GOAL_TYPES, GOAL_PERIODS } from '../store/useGoalsStore';

const goalTypeOptions = [
  { value: GOAL_TYPES.SESSIONS, label: 'Complete Sessions', icon: '📚', description: 'Track study sessions completed' },
  { value: GOAL_TYPES.TIME, label: 'Study Time (minutes)', icon: '⏱️', description: 'Track total minutes studied' },
  { value: GOAL_TYPES.MASTERY, label: 'Average Mastery Score', icon: '🎯', description: 'Maintain mastery above target' },
  { value: GOAL_TYPES.STREAK, label: 'Study Streak', icon: '🔥', description: 'Study consistently every day' },
];

const periodOptions = [
  { value: GOAL_PERIODS.DAILY, label: 'Daily', description: 'Resets every day' },
  { value: GOAL_PERIODS.WEEKLY, label: 'Weekly', description: 'Resets every Monday' },
  { value: GOAL_PERIODS.MONTHLY, label: 'Monthly', description: 'Resets on 1st of month' },
];

const presetGoals = [
  { name: 'Weekly Warrior', type: GOAL_TYPES.SESSIONS, target: 5, period: GOAL_PERIODS.WEEKLY },
  { name: 'Daily Learner', type: GOAL_TYPES.SESSIONS, target: 1, period: GOAL_PERIODS.DAILY },
  { name: 'Study Marathon', type: GOAL_TYPES.TIME, target: 120, period: GOAL_PERIODS.WEEKLY },
  { name: 'Mastery Master', type: GOAL_TYPES.MASTERY, target: 80, period: GOAL_PERIODS.WEEKLY },
  { name: '7-Day Streak', type: GOAL_TYPES.STREAK, target: 7, period: GOAL_PERIODS.WEEKLY },
];

export default function CreateGoalModal({ onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [goalData, setGoalData] = useState({
    name: '',
    type: GOAL_TYPES.SESSIONS,
    target: 5,
    period: GOAL_PERIODS.WEEKLY,
    reminderEnabled: true,
    reminderTime: '09:00',
  });

  const handlePresetSelect = (preset) => {
    setGoalData({
      ...goalData,
      ...preset,
    });
    setStep(3);
  };

  const handleCreate = () => {
    if (!goalData.name.trim()) {
      alert('Please enter a goal name');
      return;
    }
    if (goalData.target <= 0) {
      alert('Please enter a valid target');
      return;
    }
    onCreate(goalData);
  };

  const getTargetSuggestions = () => {
    switch (goalData.type) {
      case GOAL_TYPES.SESSIONS:
        return goalData.period === GOAL_PERIODS.DAILY ? [1, 2, 3] : 
               goalData.period === GOAL_PERIODS.WEEKLY ? [3, 5, 7] : [10, 15, 20];
      case GOAL_TYPES.TIME:
        return goalData.period === GOAL_PERIODS.DAILY ? [15, 30, 60] :
               goalData.period === GOAL_PERIODS.WEEKLY ? [60, 120, 180] : [300, 500, 1000];
      case GOAL_TYPES.MASTERY:
        return [70, 80, 90];
      case GOAL_TYPES.STREAK:
        return [3, 7, 14];
      default:
        return [3, 5, 10];
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg border border-pink-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-6 border-b border-pink-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              🎯 Create New Goal
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-pink-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">Choose a preset or create custom</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {presetGoals.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-pink-500/50 transition-all text-left"
                  >
                    <span className="text-2xl">
                      {goalTypeOptions.find(o => o.value === preset.type)?.icon || '🎯'}
                    </span>
                    <div>
                      <div className="font-medium text-white">{preset.name}</div>
                      <div className="text-sm text-gray-400">
                        {preset.target} {preset.type === GOAL_TYPES.TIME ? 'min' : preset.type === GOAL_TYPES.MASTERY ? '%' : ''} per {preset.period}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="text-pink-400 hover:text-pink-300 transition-colors"
                >
                  Or create custom goal →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">What would you like to track?</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {goalTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGoalData({ ...goalData, type: option.value })}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      goalData.type === option.value
                        ? 'bg-pink-500/20 border-pink-500'
                        : 'bg-gray-800 border-gray-700 hover:border-pink-500/50'
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <div className="font-medium text-white mt-2">{option.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 btn-primary"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">Set your target</h3>
              
              {/* Goal Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Goal Name</label>
                <input
                  type="text"
                  value={goalData.name}
                  onChange={(e) => setGoalData({ ...goalData, name: e.target.value })}
                  placeholder="e.g., Weekly Study Sessions"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Period Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Time Period</label>
                <div className="flex gap-2">
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGoalData({ ...goalData, period: option.value })}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${
                        goalData.period === option.value
                          ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-pink-500/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Value */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Target {goalData.type === GOAL_TYPES.TIME ? '(minutes)' : goalData.type === GOAL_TYPES.MASTERY ? '(%)' : ''}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={goalData.target}
                    onChange={(e) => setGoalData({ ...goalData, target: parseInt(e.target.value) || 0 })}
                    min="1"
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-xl font-bold focus:border-pink-500 focus:outline-none text-center"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {getTargetSuggestions().map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setGoalData({ ...goalData, target: suggestion })}
                      className={`px-3 py-1 rounded text-sm ${
                        goalData.target === suggestion
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminders */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800 border border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔔</span>
                  <div>
                    <div className="text-white font-medium">Enable Reminders</div>
                    <div className="text-xs text-gray-400">Get notified about your progress</div>
                  </div>
                </div>
                <button
                  onClick={() => setGoalData({ ...goalData, reminderEnabled: !goalData.reminderEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    goalData.reminderEnabled ? 'bg-pink-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      goalData.reminderEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 btn-primary"
                >
                  Create Goal 🎯
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

