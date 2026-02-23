import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Star, ArrowLeft, Sparkles } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { FoodSorterGame } from './FoodSorterGame';
import { TongueGoalGame } from './TongueGoalGame';
import { FluorAdventure } from './FluorAdventure';
import { BacteriaWars } from './BacteriaWars';
import { GameLeaderboard } from './GameLeaderboard';
import { ToothFairyAvatar } from '../ToothFairyAvatar';

type GameType = 'hub' | 'sorter' | 'tongue' | 'fluor' | 'bacteria' | 'leaderboard';

const GAMES = [
  {
    id: 'sorter' as GameType,
    name: 'Sortează Sănătos',
    nameEn: 'Sort the Healthy',
    emoji: '🍎',
    color: 'from-green-400 to-green-600',
    difficulty: 'Ușor',
    description: 'Trage alimentele sănătoase în coșul corect!',
    descriptionEn: 'Drag healthy foods to the right basket!',
  },
  {
    id: 'tongue' as GameType,
    name: 'Gol în Gura Limbii',
    nameEn: 'Goal in Tongue\'s Mouth',
    emoji: '⚽',
    color: 'from-blue-400 to-blue-600',
    difficulty: 'Mediu',
    description: 'Înscrie goluri în gura limbii păzite!',
    descriptionEn: 'Score goals in the tongue\'s guarded mouth!',
  },
  {
    id: 'fluor' as GameType,
    name: 'Aventura lui Fluor',
    nameEn: 'Fluor\'s Adventure',
    emoji: '🏃',
    color: 'from-purple-400 to-purple-600',
    difficulty: 'Greu',
    description: 'Ajuțilă pe Fluor să salveze orașul dinților!',
    descriptionEn: 'Help Fluor save tooth city!',
  },
  {
    id: 'bacteria' as GameType,
    name: 'Războiul Bacteriilor',
    nameEn: 'Supreme Bacteria Wars',
    emoji: '⚔️',
    color: 'from-red-400 to-red-600',
    difficulty: 'Expert',
    description: 'Apară dintele de armatele de bacterii!',
    descriptionEn: 'Defend the tooth from bacteria armies!',
  },
];

export function GameHub() {
  const [currentGame, setCurrentGame] = useState<GameType>('hub');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { progress, totalScore, badges } = useGameProgress();

  if (currentGame === 'sorter') {
    return <FoodSorterGame onBack={() => setCurrentGame('hub')} />;
  }

  if (currentGame === 'tongue') {
    return <TongueGoalGame onBack={() => setCurrentGame('hub')} />;
  }

  if (currentGame === 'fluor') {
    return <FluorAdventure onBack={() => setCurrentGame('hub')} />;
  }

  if (currentGame === 'bacteria') {
    return <BacteriaWars onBack={() => setCurrentGame('hub')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a
            href="/zana-maseluta"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Înapoi la Zâna Măseluță</span>
          </a>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full text-white">
              <Star className="w-5 h-5 inline mr-2 text-yellow-400" />
              <span className="font-bold">{totalScore}</span> puncte
            </div>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="bg-white/10 backdrop-blur p-2 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <Trophy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-4 mb-6"
          >
            <ToothFairyAvatar size="md" />
            <Gamepad2 className="w-16 h-16 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            🎮 Jocurile Zânei
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Învață despre igiena dentară jucându-te! Fiecare joc te învață ceva nou.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {GAMES.map((game, index) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentGame(game.id)}
              className={`relative overflow-hidden bg-gradient-to-br ${game.color} rounded-3xl p-6 text-white shadow-2xl group`}
            >
              {/* Sparkle effect */}
              <div className="absolute top-4 right-4">
                <Sparkles className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex items-start gap-4">
                <span className="text-6xl">{game.emoji}</span>
                <div className="text-left">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                    game.difficulty === 'Ușor' ? 'bg-green-300 text-green-900' :
                    game.difficulty === 'Mediu' ? 'bg-blue-300 text-blue-900' :
                    game.difficulty === 'Greu' ? 'bg-purple-300 text-purple-900' :
                    'bg-red-300 text-red-900'
                  }`}>
                    {game.difficulty}
                  </span>
                  <h3 className="text-2xl font-bold mb-1">{game.name}</h3>
                  <p className="text-white/80 text-sm">{game.description}</p>
                </div>
              </div>

              {/* Progress indicator */}
              {progress[game.id] > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/80 rounded-full"
                      style={{ width: `${Math.min(100, progress[game.id])}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{progress[game.id]}%</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Badges Preview */}
        {badges.length > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-3xl p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Insigne Câștigate ({badges.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {badges.slice(0, 8).map((badge, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-bold text-sm shadow-lg"
                >
                  {badge}
                </span>
              ))}
              {badges.length > 8 && (
                <span className="px-4 py-2 bg-white/20 text-white rounded-full text-sm">
                  +{badges.length - 8} mai multe
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <GameLeaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
