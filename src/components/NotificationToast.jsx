import { useState, useEffect } from 'react';

export default function NotificationToast({ reminders, onDismiss }) {
  const [visibleReminders, setVisibleReminders] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  useEffect(() => {
    // Filter out dismissed reminders and show only new ones
    const newReminders = reminders.filter(r => !dismissedIds.has(r.goalId));
    setVisibleReminders(newReminders);
  }, [reminders, dismissedIds]);

  const handleDismiss = (goalId) => {
    setDismissedIds(prev => new Set([...prev, goalId]));
    onDismiss?.(goalId);
  };

  if (visibleReminders.length === 0) return null;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
          border: 'border-green-500/50',
          icon: '🎉',
        };
      case 'urgent':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
          border: 'border-red-500/50',
          icon: '⚠️',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-500/50',
          icon: '⏰',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
          border: 'border-blue-500/50',
          icon: '💡',
        };
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {visibleReminders.map((reminder, index) => {
        const styles = getTypeStyles(reminder.type);
        
        return (
          <div
            key={reminder.goalId}
            className={`${styles.bg} ${styles.border} border rounded-xl p-4 shadow-xl backdrop-blur-sm animate-slide-in`}
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'slideIn 0.3s ease-out forwards',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{styles.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">{reminder.title}</div>
                <div className="text-gray-300 text-sm mt-1">{reminder.message}</div>
                {reminder.progress && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{reminder.goalName}</span>
                      <span>{reminder.progress.current}/{reminder.progress.target}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 rounded-full transition-all"
                        style={{ width: `${reminder.progress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDismiss(reminder.goalId)}
                className="p-1 rounded hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

