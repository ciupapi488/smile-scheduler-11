import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dino_games_progress_v1';

export type GameId = 'sorter' | 'tongue' | 'fluor' | 'bacteria';

export interface GameSession {
  gameId: GameId;
  score: number;
  completedAt: string;
  duration: number;
  level?: number;
}

export interface GameProgress {
  totalScore: number;
  sessions: GameSession[];
  badges: string[];
  highScores: Record<GameId, number>;
  gameProgress: Record<GameId, number>;
  dailyChallengeCompleted: boolean;
  lastDailyDate: string | null;
}

const BADGES = {
  // Sorting Game Badges
  JUNIOR_NUTRITIONIST: { id: 'junior_nutritionist', name: '🥗 Junior Nutritionist', condition: (p: GameProgress) => getGameSessions(p, 'sorter').some(s => s.score >= 100) },
  TRAP_DETECTIVE: { id: 'trap_detective', name: '🕵️ Detectivul Capcane', condition: (p: GameProgress) => getGameSessions(p, 'sorter').some(s => s.score >= 150) },
  PERFECT_SORTER: { id: 'perfect_sorter', name: '💯 Sortare Perfectă', condition: (p: GameProgress) => getGameSessions(p, 'sorter').some(s => s.score >= 200) },
  
  // Tongue Goal Badges
  MOUTH_STRIKER: { id: 'mouth_striker', name: '⚽ Golgeter', condition: (p: GameProgress) => getGameSessions(p, 'tongue').some(s => s.score >= 500) },
  PRECISE_DENTIST: { id: 'precise_dentist', name: '🎯 Precis ca Dentistul', condition: (p: GameProgress) => getGameSessions(p, 'tongue').some(s => s.score >= 1000) },
  CAVITY_HEALER: { id: 'cavity_healer', name: '🦷 Vindecător de Carii', condition: (p: GameProgress) => getGameSessions(p, 'tongue').some(s => s.score >= 1500) },
  GOALKEEPER_DEFEATED: { id: 'goalkeeper_defeated', name: '👅 Limbă Învinsă', condition: (p: GameProgress) => getGameSessions(p, 'tongue').some(s => s.score >= 2000) },
  
  // Fluor Adventure Badges
  SURVIVOR: { id: 'survivor', name: '🏃 Supraviețuitor', condition: (p: GameProgress) => getGameSessions(p, 'fluor').some(s => s.level && s.level >= 3) },
  SPEEDRUNNER: { id: 'speedrunner', name: '⚡ Speedrunner', condition: (p: GameProgress) => getGameSessions(p, 'fluor').some(s => s.duration < 120) },
  NO_DAMAGE: { id: 'no_damage', name: '🛡️ Fără Răni', condition: (p: GameProgress) => getGameSessions(p, 'fluor').some(s => s.score >= 3000) },
  FLUOR_MASTER: { id: 'fluor_master', name: '💧 Maestru Fluor', condition: (p: GameProgress) => getGameSessions(p, 'fluor').some(s => s.score >= 5000) },
  
  // Bacteria Wars Badges
  COMMANDER: { id: 'commander', name: '🎖️ Comandant', condition: (p: GameProgress) => getGameSessions(p, 'bacteria').some(s => s.level && s.level >= 10) },
  WAVE_15: { id: 'wave_15', name: '🔥 Rezistent la Valul 15', condition: (p: GameProgress) => getGameSessions(p, 'bacteria').some(s => s.level && s.level >= 15) },
  IMPOSSIBLE: { id: 'impossible', name: '👑 LEGENDA IGIENEI ORALE', condition: (p: GameProgress) => getGameSessions(p, 'bacteria').some(s => s.level && s.level >= 20) },
  
  // General Badges
  GAME_MASTER: { id: 'game_master', name: '🎮 Maestru al Jocurilor', condition: (p: GameProgress) => p.totalScore >= 10000 },
  DAILY_CHAMPION: { id: 'daily_champion', name: '📅 Campionul Zilnic', condition: (p: GameProgress) => p.dailyChallengeCompleted },
};

function getGameSessions(progress: GameProgress, gameId: GameId): GameSession[] {
  return progress.sessions.filter(s => s.gameId === gameId);
}

function getInitialProgress(): GameProgress {
  return {
    totalScore: 0,
    sessions: [],
    badges: [],
    highScores: { sorter: 0, tongue: 0, fluor: 0, bacteria: 0 },
    gameProgress: { sorter: 0, tongue: 0, fluor: 0, bacteria: 0 },
    dailyChallengeCompleted: false,
    lastDailyDate: null,
  };
}

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(getInitialProgress());
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProgress({ ...getInitialProgress(), ...parsed });
      }
    } catch (error) {
      console.error('Error loading game progress:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving game progress:', error);
    }
  }, [progress]);

  const checkForNewBadges = useCallback((currentProgress: GameProgress): string[] => {
    const newBadgesList: string[] = [];
    
    Object.values(BADGES).forEach((badge) => {
      if (!currentProgress.badges.includes(badge.name) && badge.condition(currentProgress)) {
        newBadgesList.push(badge.name);
      }
    });
    
    return newBadgesList;
  }, []);

  const saveGameSession = useCallback((session: Omit<GameSession, 'completedAt'>) => {
    const newSession: GameSession = {
      ...session,
      completedAt: new Date().toISOString(),
    };

    setProgress((prev) => {
      const newHighScores = { ...prev.highScores };
      if (session.score > newHighScores[session.gameId]) {
        newHighScores[session.gameId] = session.score;
      }

      const updatedProgress: GameProgress = {
        ...prev,
        totalScore: prev.totalScore + session.score,
        sessions: [...prev.sessions.slice(-49), newSession],
        highScores: newHighScores,
        gameProgress: {
          ...prev.gameProgress,
          [session.gameId]: Math.min(100, prev.gameProgress[session.gameId] + 10),
        },
      };

      const earned = checkForNewBadges(updatedProgress);
      if (earned.length > 0) {
        updatedProgress.badges = [...prev.badges, ...earned];
        setNewBadges(earned);
      }

      return updatedProgress;
    });
  }, [checkForNewBadges]);

  const completeDailyChallenge = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      dailyChallengeCompleted: true,
      lastDailyDate: new Date().toISOString(),
    }));
  }, []);

  const clearNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(getInitialProgress());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const earnSticker = useCallback((stickerId: string) => {
    // Alias for game badges
    return stickerId;
  }, []);

  return {
    progress,
    totalScore: progress.totalScore,
    badges: progress.badges,
    highScores: progress.highScores,
    newBadges,
    saveGameSession,
    completeDailyChallenge,
    clearNewBadges,
    resetProgress,
    earnSticker,
    BADGES,
  };
}
