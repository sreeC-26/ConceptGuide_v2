import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import InsightsPanel from './InsightsPanel';

const CONFUSION_BADGE_STYLES = {
  Vocabulary: 'bg-green-500/10 text-green-300 border border-green-500/40',
  Foundation: 'bg-blue-500/10 text-blue-300 border border-blue-500/40',
  Misconception: 'bg-orange-500/10 text-orange-300 border border-orange-500/40',
  Application: 'bg-purple-500/10 text-purple-300 border border-purple-500/40',
  Default: 'bg-gray-500/10 text-gray-300 border border-gray-500/40',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'time_spent', label: 'Most Time Spent' },
  { value: 'lowest_mastery', label: 'Lowest Mastery' },
];

const masteryBarColor = (score = 0) => {
  if (score >= 75) return 'from-green-400 to-emerald-500';
  if (score >= 50) return 'from-yellow-400 to-amber-500';
  return 'from-red-400 to-rose-500';
};

const formatTimeSince = (timestamp) => {
  if (!timestamp) return 'unknown';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) return 'unknown';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) {
      const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMinutes} min ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
};

const formatStatsRow = (session) => {
  const timeSpent = typeof session.timeSpent === 'number' ? session.timeSpent : 0;
  const totalSteps = typeof session.totalSteps === 'number' ? session.totalSteps : (session.repairPathData?.length ?? 0);
  const completedSteps = typeof session.completedSteps === 'number' ? session.completedSteps : 0;

  return [
    `${timeSpent || 0} min`,
    `${completedSteps}/${totalSteps || 0} steps`,
    formatTimeSince(session.timestamp),
  ].join(' • ');
};

const getConfusionBadgeClass = (type) => CONFUSION_BADGE_STYLES[type] || CONFUSION_BADGE_STYLES.Default;

export default function HistoryPanel() {
  const sessions = useAppStore((state) => state.history.sessions) || [];
  const loadSessionForReview = useAppStore((state) => state.loadSessionForReview);
  const reviewMode = useAppStore((state) => state.reviewMode);
  const refreshInsightsTimestamp = useAppStore((state) => state.refreshInsightsTimestamp);
  const setRefreshInsightsTimestamp = useAppStore((state) => state.setRefreshInsightsTimestamp);
  const deleteSession = useAppStore((state) => state.history.deleteSession);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- START MODIFIED SECTION ---
  const filteredSessions = useMemo(() => {
    // Show sessions that have analysis data (either analysisComplete flag or analysisResult)
    const completeSessions = sessions.filter(s => 
      s.analysisComplete === true || 
      s.analysisResult != null ||
      s.masteryScore != null ||
      s.confusionType != null
    );
    
    console.log('[HistoryPanel] Total:', sessions.length, 'With analysis:', completeSessions.length);
    
    const normalizedSearch = search.trim().toLowerCase();
  
    const searched = normalizedSearch
      ? completeSessions.filter((session) => {
          const pdfName = session.pdfName?.toLowerCase() ?? '';
          const selected = session.fullSelectedText?.toLowerCase() ?? session.selectedText?.toLowerCase() ?? '';
          return pdfName.includes(normalizedSearch) || selected.includes(normalizedSearch);
        })
      : completeSessions.slice();
  
    const sorter = (a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      }
      if (sortOrder === 'oldest') {
        return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
      }
      if (sortOrder === 'time_spent') {
        return (b.timeSpent || 0) - (a.timeSpent || 0);
      }
      if (sortOrder === 'lowest_mastery') {
        return (a.masteryScore ?? 101) - (b.masteryScore ?? 101);
      }
      return 0;
    };
  
    return searched.sort(sorter);
  }, [sessions, search, sortOrder]);
  
  // Update session count to show complete sessions
  const sessionCount = filteredSessions.length;
  // --- END MODIFIED SECTION ---

  const handleReview = (sessionId) => {
    if (!sessionId || !loadSessionForReview) return;
    loadSessionForReview(sessionId);
    // Navigate to home page to show the review
    navigate('/');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSession(deleteTarget);
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center text-pink-200/80">
      <div className="w-24 h-24 mb-6 rounded-full bg-pink-500/20 flex items-center justify-center">
        <span className="text-4xl">📚</span>
      </div>
      <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
        No study sessions yet
      </h3>
      <p className="max-w-md text-pink-100/70" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Start by uploading a PDF and marking your confusing concepts. We'll build a personalized learning path and store your journey here.
      </p>
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1A1A1A' }}>
      <div className="px-6 py-5 border-b border-pink-500/30 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Study History
          </h2>
          <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-pink-100 bg-pink-500/20 border border-pink-500/40 rounded-full" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {sessionCount}
          </span>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by PDF or concept..."
              className="w-full md:w-72 px-4 py-2 rounded-lg bg-pink-500/5 border border-pink-500/30 text-pink-100 placeholder-pink-200/50 focus:outline-none focus:ring-2 focus:ring-pink-400/60 transition-all"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-300/60">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.5 3a7.5 7.5 0 015.916 12.173l4.205 4.206a.75.75 0 11-1.06 1.06l-4.206-4.205A7.5 7.5 0 1110.5 3zm0 1.5a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="px-4 py-2 rounded-lg bg-pink-500/5 border border-pink-500/30 text-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-400/60 transition-all"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-900 text-pink-100">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full w-full overflow-y-auto pr-1 space-y-4">
          {filteredSessions.length === 0 ? (
            renderEmptyState()
          ) : (
            filteredSessions.map((session) => {
              const badgeClass = getConfusionBadgeClass(session.confusionType);
              const mastery = typeof session.masteryScore === 'number' ? Math.min(100, Math.max(0, session.masteryScore)) : null;
              const timeStats = formatStatsRow(session);

              return (
                <div
                  key={session.id}
                  className="border border-pink-500/30 bg-pink-500/5 rounded-2xl p-5 shadow-lg transition transform hover:-translate-y-1 hover:border-pink-400/60 hover:shadow-xl hover:bg-pink-500/10"
                  style={{ fontFamily: 'Poppins, sans-serif', boxShadow: '0 10px 30px -15px rgba(255, 64, 129, 0.4)' }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 text-pink-100/90 leading-relaxed">
                          <p className="text-sm md:text-base line-clamp-3">
                            {session.fullSelectedText?.slice(0, 80) || session.selectedText?.slice(0, 80) || 'No excerpt saved.'}
                            {session.fullSelectedText?.length > 80 || session.selectedText?.length > 80 ? '…' : ''}
                          </p>
                        </div>
                        {session.pdfName && (
                          <span className="px-3 py-1 rounded-full text-xs text-pink-200 bg-pink-500/10 border border-pink-500/40 uppercase tracking-wide whitespace-nowrap">
                            {session.pdfName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
                          {session.confusionType || 'Unknown'}
                        </span>
                        {mastery !== null && (
                          <div className="flex-1 min-w-[180px]">
                            <div className="flex items-center justify-between text-xs text-pink-200/70 mb-1">
                              <span>Mastery Score</span>
                              <span className="font-semibold text-pink-100">{mastery}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-pink-500/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${masteryBarColor(mastery)} transition-all duration-500`}
                                style={{ width: `${mastery}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-pink-200/70 uppercase tracking-wide mb-4">
                        {timeStats}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleReview(session.id)}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={reviewMode}
                      >
                        Review
                      </button>
                      <button
                        onClick={() => setDeleteTarget(session.id)}
                        className="p-2 text-pink-200/70 hover:text-pink-100 transition"
                        aria-label="Delete session"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="w-full max-w-md mx-4 p-6 rounded-2xl border border-pink-500/40 bg-[#1A1A1A] shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-2">Delete session</h3>
            <p className="text-pink-100/80 mb-6">
              Are you sure you want to delete this study session? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-pink-500/40 text-pink-100 hover:bg-pink-500/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}