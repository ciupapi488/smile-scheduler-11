import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Star, Gamepad2, Sparkles } from 'lucide-react';
import { FoodSorterGame } from './FoodSorterGame';
import { TongueGoalGame } from './TongueGoalGame';
import { FluorAdventure } from './FluorAdventure';
import { BacteriaWars } from './BacteriaWars';
import { GameLeaderboard } from './GameLeaderboard';
import { useGameProgress } from '@/hooks/useGameProgress';

type GameType = 'hub' | 'sorter' | 'tongue' | 'fluor' | 'bacteria';

const GAMES = [
  {
    id: 'sorter' as GameType,
    name: 'Sortează Sănătos',
    emoji: '🍎',
    color: 'from-green-400 to-emerald-600',
    difficulty: 'Ușor',
    description: 'Trage alimentele în coșul corect și învață ce e bun pentru dinți!',
    features: ['20 alimente', 'Capcane', 'Timer'],
  },
  {
    id: 'tongue' as GameType,
    name: 'Gol în Gura Limbii',
    emoji: '⚽',
    color: 'from-blue-400 to-indigo-600',
    difficulty: 'Mediu',
    description: 'Înscrie goluri în gura limbii păzite! Vindecă dinții negri!',
    features: ['Fizică reală', '3 niveluri', 'Combo system'],
  },
  {
    id: 'fluor' as GameType,
    name: 'Aventura lui Fluor',
    emoji: '💧',
    color: 'from-cyan-400 to-blue-600',
    difficulty: 'Greu',
    description: 'Ajuțilă pe Fluor să salveze Orașul Dinților de bacterii!',
    features: ['Platformer', 'Power-ups', '90 sec'],
  },
  {
    id: 'bacteria' as GameType,
    name: 'Războiul Bacteriilor',
    emoji: '⚔️',
    color: 'from-red-400 to-red-700',
    difficulty: 'Expert',
    description: 'Apară dintele de armatele de bacterii până la valul 20!',
    features: ['Tower Defense', 'Ritm', 'Boss fight'],
  },
];

export function GameHub() {
  const [currentGame, setCurrentGame] = useState<GameType>('hub');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { totalScore, badges, progress } = useGameProgress();

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-10"
            initial={{ x: Math.random() * 100 + 'vw', y: '100vh' }}
            animate={{ y: '-20vh' }}
            transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 10 }}
          >
            {['🎮', '⭐', '🏆', '🎯', '🎲'][i % 5]}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4">
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between py-6"
        >
          <motion.a
            href="/zana-maseluta"
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-white/80 hover:text-white font-medium bg-white/10 backdrop-blur px-4 py-2 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Înapoi la Zâna Măseluță</span>
          </motion.a>
          
          <div className="flex items-center gap-4">
            <motion.div 
              className="bg-white/10 backdrop-blur px-5 py-2.5 rounded-full text-white flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-lg">{totalScore.toLocaleString()}</span>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowLeaderboard(true)}
              className="bg-white/10 backdrop-blur p-3 rounded-full text-white hover:bg-white/20"
            >
              <Star className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-block"
          >
            <Gamepad2 className="w-20 h-20 text-white mb-4" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl">
            🎮 Jocurile Zânei
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Învață despre igiena dentară jucându-te! 4 jocuri educative te așteaptă.
          </p>
        </motion.div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {GAMES.map((game, index) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentGame(game.id)}
              className={`relative overflow-hidden bg-gradient-to-br ${game.color} rounded-3xl p-6 text-white shadow-2xl group`}
            >
              {/* Sparkle effect */}
              <motion.div 
                className="absolute top-4 right-4"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 opacity-50 group-hover:opacity-100" />
              </motion.div>

              <div className="flex items-start gap-5">
                <motion.span 
                  className="text-7xl"
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  {game.emoji}
                </motion.span>
                <div className="text-left flex-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                    game.difficulty === 'Ușor' ? 'bg-green-300 text-green-900' :
                    game.difficulty === 'Mediu' ? 'bg-blue-300 text-blue-900' :
                    game.difficulty === 'Greu' ? 'bg-purple-300 text-purple-900' :
                    'bg-red-300 text-red-900'
                  }`}>
                    {game.difficulty}
                  </span>
                  <h3 className="text-2xl font-black mb-2">{game.name}</h3>
                  <p className="text-white/80 text-sm mb-3">{game.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {game.features.map((feature, i) => (
                      <span key={i} className="px-2 py-1 bg-white/20 rounded-full text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress indicator */}
              {progress.gameProgress[game.id] > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white/80 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress.gameProgress[game.id])}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{progress.gameProgress[game.id]}%</span>
                </div>
              )}

              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
            </motion.button>
          ))}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/10 backdrop-blur rounded-3xl p-6"
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Insigne Câștigate ({badges.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {badges.slice(0, 8).map((badge, idx) => (
                <motion.span
                  key={idx}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-sm shadow-lg cursor-default"
                >
                  {badge}
                </motion.span>
              ))}
              {badges.length > 8 && (
                <span className="px-4 py-2 bg-white/20 text-white rounded-full text-sm">
                  +{badges.length - 8} mai multe
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <GameLeaderboard onClose={() => setShowLeaderboard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
