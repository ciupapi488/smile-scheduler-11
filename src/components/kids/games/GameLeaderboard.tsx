import { motion } from 'framer-motion';
import { X, Trophy, Star, Target, Flame } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';

interface GameLeaderboardProps {
  onClose: () => void;
}

export function GameLeaderboard({ onClose }: GameLeaderboardProps) {
  const { progress, highScores, badges } = useGameProgress();

  const gameStats = [
    { 
      id: 'sorter', 
      name: 'Sortează Sănătos', 
      emoji: '🍎', 
      highScore: highScores.sorter,
      color: 'from-green-400 to-green-600',
    },
    { 
      id: 'tongue', 
      name: 'Gol în Gura Limbii', 
      emoji: '⚽', 
      highScore: highScores.tongue,
      color: 'from-blue-400 to-blue-600',
    },
    { 
      id: 'fluor', 
      name: 'Aventura lui Fluor', 
      emoji: '🏃', 
      highScore: highScores.fluor,
      color: 'from-purple-400 to-purple-600',
    },
    { 
      id: 'bacteria', 
      name: 'Războiul Bacteriilor', 
      emoji: '⚔️', 
      highScore: highScores.bacteria,
      color: 'from-red-400 to-red-600',
    },
  ];

  const recentSessions = [...progress.sessions].reverse().slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Clasament & Statistici</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl p-4 text-center">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{progress.totalScore}</p>
              <p className="text-xs text-gray-600">Total Puncte</p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-4 text-center">
              <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{progress.totalSessions}</p>
              <p className="text-xs text-gray-600">Jocuri Jucate</p>
            </div>
            <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-2xl p-4 text-center">
              <Flame className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{progress.currentStreak}</p>
              <p className="text-xs text-gray-600">Zile Consecutive</p>
            </div>
          </div>

          {/* High Scores per Game */}
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Recorduri Personale
          </h3>
          <div className="space-y-3 mb-8">
            {gameStats.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl`}>
                  {game.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{game.name}</p>
                  <p className="text-xs text-gray-500">
                    {progress.sessions.filter(s => s.gameId === game.id).length} jocuri jucate
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">{game.highScore}</p>
                  <p className="text-xs text-gray-500">record</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Insigne Câștigate ({badges.length})
              </h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {badges.map((badge, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-bold text-sm shadow"
                  >
                    {badge}
                  </motion.span>
                ))}
              </div>
            </>
          )}

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <>
              <h3 className="font-bold text-gray-800 mb-4">Jocuri Recente</h3>
              <div className="space-y-2">
                {recentSessions.map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {session.gameId === 'sorter' && '🍎'}
                        {session.gameId === 'tongue' && '⚽'}
                        {session.gameId === 'fluor' && '🏃'}
                        {session.gameId === 'bacteria' && '⚔️'}
                      </span>
                      <span className="text-gray-600">
                        {new Date(session.completedAt).toLocaleDateString('ro-RO')}
                      </span>
                    </div>
                    <span className="font-bold text-gray-800">{session.score} pts</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
