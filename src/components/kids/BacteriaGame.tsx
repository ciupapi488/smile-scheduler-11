import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bacteria {
  id: string;
  x: number;
  y: number;
  size: number;
  type: 'normal' | 'speedy' | 'big';
}

interface BacteriaGameProps {
  isActive: boolean;
  onScoreUpdate: (score: number) => void;
  onBacteriaKilled?: () => void;
}

export function BacteriaGame({ isActive, onScoreUpdate, onBacteriaKilled }: BacteriaGameProps) {
  const [bacterias, setBacterias] = useState<Bacteria[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // Spawn bacteria
  useEffect(() => {
    if (!isActive) return;

    const spawnInterval = setInterval(() => {
      if (bacterias.length < 6) {
        const newBacteria: Bacteria = {
          id: Math.random().toString(36).substr(2, 9),
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 70,
          size: 30 + Math.random() * 20,
          type: Math.random() > 0.8 ? 'speedy' : Math.random() > 0.9 ? 'big' : 'normal',
        };
        setBacterias((prev) => [...prev, newBacteria]);
      }
    }, 1500);

    return () => clearInterval(spawnInterval);
  }, [isActive, bacterias.length]);

  // Auto-remove old bacteria
  useEffect(() => {
    if (!isActive || bacterias.length === 0) return;

    const cleanupInterval = setInterval(() => {
      setBacterias((prev) => prev.slice(-5));
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, [isActive, bacterias.length]);

  const handleBacteriaClick = useCallback((id: string, type: Bacteria['type']) => {
    setBacterias((prev) => prev.filter((b) => b.id !== id));
    
    const points = type === 'big' ? 3 : type === 'speedy' ? 2 : 1;
    const newCombo = combo + 1;
    setCombo(newCombo);
    
    const comboMultiplier = Math.floor(newCombo / 5) + 1;
    const totalPoints = points * comboMultiplier;
    
    const newScore = score + totalPoints;
    setScore(newScore);
    onScoreUpdate(newScore);
    onBacteriaKilled?.();

    if (newCombo % 5 === 0) {
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 1500);
    }

    // Vibrate on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [combo, score, onScoreUpdate, onBacteriaKilled]);

  const getBacteriaEmoji = (type: Bacteria['type']) => {
    switch (type) {
      case 'speedy':
        return '👾';
      case 'big':
        return '👹';
      default:
        return '🦠';
    }
  };

  const getBacteriaColor = (type: Bacteria['type']) => {
    switch (type) {
      case 'speedy':
        return 'from-purple-500 to-purple-700';
      case 'big':
        return 'from-red-500 to-red-700';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <div className="relative w-full h-80 bg-gradient-to-b from-blue-100 to-blue-200 rounded-3xl overflow-hidden border-4 border-blue-300">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-16 h-16 rounded-full bg-white"
            style={{
              left: `${i * 20}%`,
              top: `${(i % 2) * 40 + 20}%`,
              transform: 'scale(0.5)',
            }}
          />
        ))}
      </div>

      {/* Score */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-10">
        <span className="text-2xl">🎯</span>
        <span className="ml-2 font-bold text-gray-800">{score} bacterii</span>
      </div>

      {/* Combo indicator */}
      <AnimatePresence>
        {showCombo && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full shadow-lg z-10 font-bold"
          >
            🔥 COMBO x{combo}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {!isActive && bacterias.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-blue-600 font-semibold text-lg">Apasă pe bacterii să le elimini!</p>
        </div>
      )}

      {/* Bacterias */}
      <AnimatePresence>
        {bacterias.map((bacteria) => (
          <motion.button
            key={bacteria.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: bacteria.type === 'speedy' ? [0, 10, -10, 0] : 0,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              scale: { type: 'spring', stiffness: 500, damping: 30 },
              x: { repeat: Infinity, duration: 0.5 }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleBacteriaClick(bacteria.id, bacteria.type)}
            className={`absolute rounded-full bg-gradient-to-br ${getBacteriaColor(bacteria.type)} shadow-lg flex items-center justify-center cursor-pointer select-none`}
            style={{
              left: `${bacteria.x}%`,
              top: `${bacteria.y}%`,
              width: bacteria.size,
              height: bacteria.size,
            }}
          >
            <span className="text-2xl">{getBacteriaEmoji(bacteria.type)}</span>
            
            {/* Wiggle animation */}
            <div className="absolute inset-0 rounded-full animate-pulse bg-white/20" />
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Teeth decoration */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-8 h-10 bg-white rounded-t-lg border-2 border-gray-200 shadow-inner"
            style={{ transform: `rotate(${(i - 3.5) * 3}deg)` }}
          />
        ))}
      </div>
    </div>
  );
}
