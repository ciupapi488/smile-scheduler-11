import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dino_brushing_progress_v1';

export interface BrushingSession {
  date: string;
  duration: number;
  score: number;
  bacteriaKilled: number;
  completed: boolean;
}

export interface BrushingProgress {
  totalSessions: number;
  totalBacteriaKilled: number;
  currentStreak: number;
  lastSessionDate: string | null;
  badges: string[];
  sessions: BrushingSession[];
}

const BADGES = {
  FIRST_BRUSH: { id: 'first_brush', name: '🦷 Periuța de Aur', condition: (p: BrushingProgress) => p.totalSessions >= 1 },
  WEEK_WARRIOR: { id: 'week_warrior', name: '🔥 Expert în Periaj', condition: (p: BrushingProgress) => p.currentStreak >= 7 },
  BACTERIA_HUNTER: { id: 'bacteria_hunter', name: '🎯 Vânător de Bacterii', condition: (p: BrushingProgress) => p.totalBacteriaKilled >= 100 },
  PERFECT_WEEK: { id: 'perfect_week', name: '⭐ Săptămâna Perfectă', condition: (p: BrushingProgress) => p.currentStreak >= 7 && p.sessions.slice(-7).every(s => s.completed) },
  MASTER_BRUSHER: { id: 'master_brusher', name: '👑 Maestru al Periajului', condition: (p: BrushingProgress) => p.totalSessions >= 30 },
  DETECTIVE: { id: 'detective', name: '🕵️ Detectivul Alimentar', condition: (p: BrushingProgress) => p.badges.includes('🕵️ Detectivul Alimentar') },
};

function getInitialProgress(): BrushingProgress {
  return {
    totalSessions: 0,
    totalBacteriaKilled: 0,
    currentStreak: 0,
    lastSessionDate: null,
    badges: [],
    sessions: [],
  };
}

export function useBrushingProgress() {
  const [progress, setProgress] = useState<BrushingProgress>(getInitialProgress());
  const [newBadges, setNewBadges] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProgress({ ...getInitialProgress(), ...parsed });
      }
    } catch (error) {
      console.error('Error loading brushing progress:', error);
    }
  }, []);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving brushing progress:', error);
    }
  }, [progress]);

  const calculateStreak = (lastDate: string | null): number => {
    if (!lastDate) return 0;
    
    const last = new Date(lastDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastDateStr = last.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastDateStr === todayStr) {
      // Already brushed today, keep current streak
      return progress.currentStreak;
    } else if (lastDateStr === yesterdayStr) {
      // Brushed yesterday, streak continues
      return progress.currentStreak;
    } else {
      // Streak broken
      return 0;
    }
  };

  const checkForNewBadges = useCallback((currentProgress: BrushingProgress): string[] => {
    const newBadgesList: string[] = [];
    
    Object.values(BADGES).forEach((badge) => {
      if (!currentProgress.badges.includes(badge.name) && badge.condition(currentProgress)) {
        newBadgesList.push(badge.name);
      }
    });
    
    return newBadgesList;
  }, []);

  const saveSession = useCallback((session: Omit<BrushingSession, 'date'>) => {
    const newSession: BrushingSession = {
      ...session,
      date: new Date().toISOString(),
    };

    setProgress((prev) => {
      const newStreak = calculateStreak(prev.lastSessionDate) + 1;
      const updatedProgress: BrushingProgress = {
        ...prev,
        totalSessions: prev.totalSessions + 1,
        totalBacteriaKilled: prev.totalBacteriaKilled + session.bacteriaKilled,
        currentStreak: newStreak,
        lastSessionDate: newSession.date,
        sessions: [...prev.sessions.slice(-29), newSession], // Keep last 30 sessions
      };

      // Check for new badges
      const earned = checkForNewBadges(updatedProgress);
      if (earned.length > 0) {
        updatedProgress.badges = [...prev.badges, ...earned];
        setNewBadges(earned);
      }

      return updatedProgress;
    });
  }, [checkForNewBadges]);

  const clearNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  const hasBadge = useCallback((badgeName: string): boolean => {
    return progress.badges.includes(badgeName);
  }, [progress.badges]);

  const canBrushToday = useCallback((): boolean => {
    if (!progress.lastSessionDate) return true;
    
    const last = new Date(progress.lastSessionDate);
    const today = new Date();
    
    return last.toISOString().split('T')[0] !== today.toISOString().split('T')[0];
  }, [progress.lastSessionDate]);

  const getTodayBrushingCount = useCallback((): number => {
    if (!progress.lastSessionDate) return 0;
    
    const last = new Date(progress.lastSessionDate);
    const today = new Date();
    
    if (last.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
      return progress.sessions.filter(
        s => new Date(s.date).toISOString().split('T')[0] === today.toISOString().split('T')[0]
      ).length;
    }
    
    return 0;
  }, [progress.lastSessionDate, progress.sessions]);

  const resetProgress = useCallback(() => {
    setProgress(getInitialProgress());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const earnSticker = useCallback((stickerId: string) => {
    setProgress((prev) => {
      const stickerBadges: Record<string, string> = {
        'detective': '🕵️ Detectivul Alimentar',
        'brave': '🦁 Curajosul',
        'champion': '🏆 Campionul',
      };
      
      const badgeName = stickerBadges[stickerId];
      if (badgeName && !prev.badges.includes(badgeName)) {
        return {
          ...prev,
          badges: [...prev.badges, badgeName],
        };
      }
      return prev;
    });
  }, []);

  return {
    progress,
    newBadges,
    saveSession,
    clearNewBadges,
    hasBadge,
    canBrushToday,
    getTodayBrushingCount,
    resetProgress,
    earnSticker,
    BADGES,
  };
}
