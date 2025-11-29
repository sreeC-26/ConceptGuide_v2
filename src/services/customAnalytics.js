// Custom analytics - NO AI, just YOUR algorithms

// Add this helper function at the top
const getEmptyInsights = () => ({
  mostFrequentConfusion: {
    type: 'No data yet',
    percentage: 0,
    message: 'Start studying to see patterns!'
  },
  strongestArea: {
    type: 'No data yet',
    mastery: 0,
    message: 'Complete sessions to discover your strengths!'
  },
  growthOpportunity: {
    type: 'No data yet',
    mastery: 0,
    message: 'Keep learning to identify growth areas!'
  },
  focusConcepts: [],
  recentWins: [],
  studyMomentum: {
    weekTime: 0,
    totalTime: 0,
    message: 'Start your first session!'
  },
  learningTrend: {
    trend: 'steady',
    message: 'Build momentum with consistent practice!'
  }
});

export const calculateCustomInsights = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return getEmptyInsights();
  }

  // CRITICAL: Filter out incomplete sessions
  const completeSessions = sessions.filter(s => 
    s.analysisComplete === true &&
    s.masteryScore != null && 
    s.confusionType && 
    s.confusionType !== 'Unknown' &&
    s.confusionType.toLowerCase() !== 'unknown'
  );

  console.log('[Analytics] Total sessions:', sessions.length, 'Complete:', completeSessions.length);

  if (completeSessions.length === 0) {
    return getEmptyInsights();
  }

  // Filter valid sessions (with mastery scores)
  const validSessions = sessions.filter(s => 
    s.masteryScore != null && 
    s.confusionType && 
    s.confusionType !== 'Unknown'
  );

  // 1. Most Frequent Confusion Type
  const confusionCounts = {};
  validSessions.forEach(s => {
    confusionCounts[s.confusionType] = (confusionCounts[s.confusionType] || 0) + 1;
  });

  const mostFrequent = Object.keys(confusionCounts).length > 0
    ? Object.keys(confusionCounts).reduce((a, b) => 
        confusionCounts[a] > confusionCounts[b] ? a : b
      )
    : 'Unknown';

  const frequencyPercentage = validSessions.length > 0
    ? Math.round((confusionCounts[mostFrequent] / validSessions.length) * 100)
    : 0;

  // 2. Strongest Concept Area (highest average mastery by confusion type)
  const masteryByType = {};
  const countsByType = {};

  validSessions.forEach(s => {
    const type = s.confusionType;
    masteryByType[type] = (masteryByType[type] || 0) + s.masteryScore;
    countsByType[type] = (countsByType[type] || 0) + 1;
  });

  const averageMasteryByType = {};
  Object.keys(masteryByType).forEach(type => {
    averageMasteryByType[type] = Math.round(masteryByType[type] / countsByType[type]);
  });

  const strongestType = Object.keys(averageMasteryByType).length > 0
    ? Object.keys(averageMasteryByType).reduce((a, b) =>
        averageMasteryByType[a] > averageMasteryByType[b] ? a : b
      )
    : 'Unknown';

  // 3. Growth Opportunity (lowest mastery area)
  const weakestType = Object.keys(averageMasteryByType).length > 0
    ? Object.keys(averageMasteryByType).reduce((a, b) =>
        averageMasteryByType[a] < averageMasteryByType[b] ? a : b
      )
    : 'Unknown';

  // 4. Focus Concepts (weak areas with details)
  const conceptMastery = {};
  validSessions.forEach(s => {
    const concept = extractConceptName(s);
    if (!conceptMastery[concept]) {
      conceptMastery[concept] = { total: 0, count: 0 };
    }
    conceptMastery[concept].total += s.masteryScore;
    conceptMastery[concept].count += 1;
  });

  const conceptAverages = Object.keys(conceptMastery).map(concept => ({
    concept,
    mastery: Math.round(conceptMastery[concept].total / conceptMastery[concept].count),
    attempts: conceptMastery[concept].count
  }));

  const focusConcepts = conceptAverages
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  // 5. Recent Wins (strong areas)
  const recentWins = conceptAverages
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 3);

  // 6. Study Momentum (time spent)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentSessions = sessions.filter(s => {
    const sessionDate = new Date(s.timestamp);
    return sessionDate >= weekAgo;
  });

  const weekTime = recentSessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
  const totalTime = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);

  // 7. Learning Trend (comparing recent vs previous mastery)
  const sortedSessions = [...validSessions].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  const recentCount = Math.min(3, sortedSessions.length);
  const previousCount = Math.min(3, sortedSessions.length - recentCount);

  let trend = 'steady';
  if (recentCount > 0 && previousCount > 0) {
    const recentAvg = sortedSessions
      .slice(0, recentCount)
      .reduce((sum, s) => sum + s.masteryScore, 0) / recentCount;
    
    const previousAvg = sortedSessions
      .slice(recentCount, recentCount + previousCount)
      .reduce((sum, s) => sum + s.masteryScore, 0) / previousCount;

    if (recentAvg > previousAvg + 5) trend = 'up';
    else if (recentAvg < previousAvg - 5) trend = 'down';
  }

  return {
    mostFrequentConfusion: {
      type: formatConfusionType(mostFrequent),
      percentage: frequencyPercentage,
      message: `${formatConfusionType(mostFrequent)} shows up in ${frequencyPercentage}% of your sessions. A quick refresher on the foundations could unlock a breakthrough.`
    },
    strongestArea: {
      type: formatConfusionType(strongestType),
      mastery: averageMasteryByType[strongestType] || 0,
      message: `${formatConfusionType(strongestType)} mastery averages ${averageMasteryByType[strongestType] || 0}% — an incredible foundation to build on. Consider exploring advanced topics here!`
    },
    growthOpportunity: {
      type: formatConfusionType(weakestType),
      mastery: averageMasteryByType[weakestType] || 0,
      message: `${formatConfusionType(weakestType)} sits at about ${averageMasteryByType[weakestType] || 0}% mastery. A little targeted practice will level this up quickly.`
    },
    focusConcepts,
    recentWins,
    studyMomentum: {
      weekTime,
      totalTime,
      message: weekTime > 0
        ? `You've invested ${formatTime(weekTime)} of focused study in the past week — that consistency is paying off.`
        : `You've logged ${formatTime(totalTime)} of focused study overall — every session builds momentum.`
    },
    learningTrend: {
      trend,
      message: trend === 'up'
        ? '🚀 Your mastery is trending upward this week. Keep riding that wave with another focused session!'
        : trend === 'down'
        ? '✨ Mastery dipped slightly recently — revisiting earlier wins can help you bounce back quickly.'
        : '🌈 Your learning pace is steady. A small stretch goal could help unlock the next breakthrough.'
    }
  };
};

// Helper functions
const extractConceptName = (session) => {
  if (session.fullSelectedText) {
    // Extract first few words as concept name
    return session.fullSelectedText.slice(0, 50).trim() + '...';
  }
  return session.pdfName || 'Unknown Concept';
};

const formatConfusionType = (type) => {
  if (!type || type === 'Unknown') return 'Unknown';
  
  // Convert snake_case or camelCase to Title Case
  return type
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

const formatTime = (minutes) => {
  if (!minutes || minutes <= 0) return '0 minutes';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  }
  return `${Math.max(mins, 1)} minutes`;
};