import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { ArrowLeft, Trophy, Star, RotateCcw, Sparkles, CheckCircle, XCircle, Timer } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';

interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  isHealthy: boolean;
  isTrap: boolean;
  explanation: string;
  color: string;
  faceExpression: 'happy' | 'neutral' | 'evil';
}

const FOODS: FoodItem[] = [
  // Healthy foods
  { id: '1', name: 'Măr', emoji: '🍎', isHealthy: true, isTrap: false, explanation: 'Merele curăță dinții natural!', color: '#FF4444', faceExpression: 'happy' },
  { id: '2', name: 'Morcov', emoji: '🥕', isHealthy: true, isTrap: false, explanation: 'Morcovii sunt buni pentru gingii!', color: '#FF8C00', faceExpression: 'happy' },
  { id: '3', name: 'Brânză', emoji: '🧀', isHealthy: true, isTrap: false, explanation: 'Calciu pentru dinți puternici!', color: '#FFD700', faceExpression: 'happy' },
  { id: '4', name: 'Iaurt', emoji: '🥛', isHealthy: true, isTrap: false, explanation: 'Probiotice sănătoase!', color: '#F0F0F0', faceExpression: 'happy' },
  { id: '5', name: 'Apă', emoji: '💧', isHealthy: true, isTrap: false, explanation: 'Apa spală bacteriile!', color: '#00BFFF', faceExpression: 'happy' },
  { id: '6', name: 'Nuci', emoji: '🥜', isHealthy: true, isTrap: false, explanation: 'Proteine și minerale!', color: '#8B4513', faceExpression: 'happy' },
  { id: '7', name: 'Pâine', emoji: '🍞', isHealthy: true, isTrap: false, explanation: 'Fibre pentru sănătate!', color: '#D2691E', faceExpression: 'happy' },
  { id: '8', name: 'Ou', emoji: '🥚', isHealthy: true, isTrap: false, explanation: 'Vitamina D pentru dinți!', color: '#FFF8DC', faceExpression: 'happy' },
  { id: '9', name: 'Pește', emoji: '🐟', isHealthy: true, isTrap: false, explanation: 'Fosfor pentru dinți!', color: '#4682B4', faceExpression: 'happy' },
  { id: '10', name: 'Varză', emoji: '🥬', isHealthy: true, isTrap: false, explanation: 'Vitamina C!', color: '#32CD32', faceExpression: 'happy' },
  // Harmful foods
  { id: '11', name: 'Bomboane', emoji: '🍬', isHealthy: false, isTrap: false, explanation: 'Bomboanele fac carii!', color: '#FF1493', faceExpression: 'evil' },
  { id: '12', name: 'Suc', emoji: '🥤', isHealthy: false, isTrap: false, explanation: 'Distruge smalțul!', color: '#DC143C', faceExpression: 'evil' },
  { id: '13', name: 'Ciocolată', emoji: '🍫', isHealthy: false, isTrap: false, explanation: 'Se lipește de dinți!', color: '#4A2C2A', faceExpression: 'evil' },
  { id: '14', name: 'Chipsuri', emoji: '🥔', isHealthy: false, isTrap: false, explanation: 'Acide pentru dinți!', color: '#FF6347', faceExpression: 'evil' },
  { id: '15', name: 'Înghețată', emoji: '🍦', isHealthy: false, isTrap: false, explanation: 'Mult zahăr!', color: '#FFFACD', faceExpression: 'evil' },
  { id: '16', name: 'Băutură acidă', emoji: '🧃', isHealthy: false, isTrap: false, explanation: 'Acid atacă dinții!', color: '#FF4500', faceExpression: 'evil' },
  { id: '17', name: 'Caramel', emoji: '🍮', isHealthy: false, isTrap: false, explanation: 'Se lipeste tare!', color: '#8B7355', faceExpression: 'evil' },
  { id: '18', name: 'Tort', emoji: '🎂', isHealthy: false, isTrap: false, explanation: 'Mult zahăr!', color: '#FF69B4', faceExpression: 'evil' },
  // Traps
  { id: '19', name: 'Gumă', emoji: '🍬', isHealthy: true, isTrap: true, explanation: 'Surpriză! E OK fără zahăr!', color: '#90EE90', faceExpression: 'happy' },
  { id: '20', name: 'Lămâie', emoji: '🍋', isHealthy: false, isTrap: true, explanation: 'Capcană! E acidă!', color: '#FFFF00', faceExpression: 'neutral' },
];

// Face expression icons
const FaceExpression = ({ type, size = 'large' }: { type: 'happy' | 'neutral' | 'evil'; size?: 'small' | 'large' }) => {
  const sizeClass = size === 'large' ? 'w-16 h-16' : 'w-8 h-8';
  const iconSize = size === 'large' ? 32 : 16;
  
  if (type === 'happy') {
    return (
      <motion.div 
        className={`${sizeClass} rounded-full bg-white flex items-center justify-center shadow-lg`}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div className="relative">
          {/* Eyes */}
          <div className="flex gap-2 mb-1">
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
          </div>
          {/* Smile */}
          <div className="w-6 h-3 border-b-4 border-gray-800 rounded-full" />
        </div>
      </motion.div>
    );
  }
  
  if (type === 'neutral') {
    return (
      <motion.div 
        className={`${sizeClass} rounded-full bg-yellow-100 flex items-center justify-center shadow-lg`}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="relative">
          {/* Eyes */}
          <div className="flex gap-2 mb-1">
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
          </div>
          {/* Neutral mouth */}
          <div className="w-6 h-1 bg-gray-800 rounded-full mx-auto" />
        </div>
      </motion.div>
    );
  }
  
  // Evil
  return (
    <motion.div 
      className={`${sizeClass} rounded-full bg-red-100 flex items-center justify-center shadow-lg`}
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 0.5, repeat: Infinity }}
    >
      <div className="relative">
        {/* Angry eyes */}
        <div className="flex gap-2 mb-1">
          <div className="relative">
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
            <div className="absolute -top-1 left-0 w-3 h-1 bg-gray-800 rounded-full transform -rotate-12" />
          </div>
          <div className="relative">
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
            <div className="absolute -top-1 left-0 w-3 h-1 bg-gray-800 rounded-full transform rotate-12" />
          </div>
        </div>
        {/* Frown */}
        <div className="w-6 h-3 border-t-4 border-gray-800 rounded-full" />
      </div>
    </motion.div>
  );
};

// Particle system
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  type: 'sparkle' | 'confetti' | 'bubble';
}

export function FoodSorterGame({ onBack }: { onBack: () => void }) {
  const { saveGameSession } = useGameProgress();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');
  const [foodsQueue, setFoodsQueue] = useState<FoodItem[]>([]);
  const [currentFood, setCurrentFood] = useState<FoodItem | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; correct: boolean } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [showFairy, setShowFairy] = useState(false);
  const [fairyMessage, setFairyMessage] = useState('');
  const [showFoodImage, setShowFoodImage] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const controls = useAnimation();

  // Shuffle and start game
  const startGame = useCallback(() => {
    const shuffled = [...FOODS].sort(() => Math.random() - 0.5);
    setFoodsQueue(shuffled);
    setCurrentFood(shuffled[0]);
    setShowFoodImage(true);
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setCorrectCount(0);
    setWrongCount(0);
    setStreakCount(0);
    setParticles([]);
    setFairyMessage('Uită-te la aliment, apoi sortează!');
    setShowFairy(true);
    setTimeout(() => setShowFairy(false), 3000);
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
  }, [gameState, timeLeft]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 15) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        color: ['#FFD700', '#FF69B4', '#00CED1', '#7FFF00', color][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 4,
        life: 1,
        type: Math.random() > 0.5 ? 'sparkle' : 'confetti',
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Update particles
  useEffect(() => {
    if (particles.length === 0) return;
    
    const interval = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.5,
          life: p.life - 0.02,
        }))
        .filter(p => p.life > 0)
      );
    }, 16);
    
    return () => clearInterval(interval);
  }, [particles.length]);

  // Handle sort
  const handleSort = async (isHealthyZone: boolean) => {
    if (!currentFood || feedback) return;
    
    const isCorrect = currentFood.isHealthy === isHealthyZone;
    const points = isCorrect ? (currentFood.isTrap ? 20 : 10) : -5;
    
    if (isCorrect) {
      setScore(s => s + points);
      setCorrectCount(c => c + 1);
      setStreakCount(s => s + 1);
      setFeedback({ message: currentFood.explanation, correct: true });
      
      // Vibrate
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      
      // Particles at drop position
      createParticles(isHealthyZone ? 25 : 75, 70, '#00FF00');
      
      // Fairy comment every 5 correct
      if ((correctCount + 1) % 5 === 0) {
        setFairyMessage('Uau! Bravo! Continuă așa!');
        setShowFairy(true);
        setTimeout(() => setShowFairy(false), 2000);
      }
    } else {
      setScore(s => Math.max(0, s + points));
      setWrongCount(w => w + 1);
      setStreakCount(0);
      setFeedback({ message: currentFood.explanation, correct: false });
      
      if (navigator.vibrate) navigator.vibrate(200);
      createParticles(isHealthyZone ? 25 : 75, 70, '#FF0000', 8);
    }

    // Next food
    setTimeout(() => {
      setFeedback(null);
      setShowFoodImage(true);
      const nextIndex = foodsQueue.findIndex(f => f.id === currentFood.id) + 1;
      
      if (nextIndex < foodsQueue.length) {
        setCurrentFood(foodsQueue[nextIndex]);
        
        // Warning for traps
        if (nextIndex >= 15) {
          setFairyMessage('ATENȚIE! Capcane înainte!');
          setShowFairy(true);
          setTimeout(() => setShowFairy(false), 2500);
        }
      } else {
        endGame();
      }
    }, 1800);
  };

  const endGame = () => {
    setGameState('result');
    const timeBonus = timeLeft > 0 ? 50 : 0;
    saveGameSession({
      gameId: 'sorter',
      score: score + timeBonus,
      duration: 60 - timeLeft,
    });
  };

  // Drag handlers
  const handleDrag = (_: any, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold) {
      setDragDirection('left');
    } else if (info.offset.x > threshold) {
      setDragDirection('right');
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      handleSort(true);
    } else if (info.offset.x > 100) {
      handleSort(false);
    }
    setDragDirection(null);
    setIsDragging(false);
  };

  const currentIndex = currentFood ? foodsQueue.findIndex(f => f.id === currentFood.id) : 0;

  // Intro screen
  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-20"
              initial={{ y: '100vh', x: Math.random() * 100 + 'vw' }}
              animate={{ y: '-20vh' }}
              transition={{ 
                duration: 8 + Math.random() * 10, 
                repeat: Infinity, 
                delay: Math.random() * 5 
              }}
            >
              {['A', 'B', 'C', 'D', 'E', 'F'][i % 6]}
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-2xl mx-auto p-6 pt-12">
          <motion.button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-white font-bold bg-white/20 backdrop-blur px-4 py-2 rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </motion.button>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            {/* Face expressions preview */}
            <div className="flex justify-center gap-4 mb-6">
              <motion.div
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center shadow-lg"
                animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <FaceExpression type="happy" size="small" />
              </motion.div>
              <motion.div
                className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <span className="text-2xl font-bold text-yellow-600">VS</span>
              </motion.div>
              <motion.div
                className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shadow-lg"
                animate={{ y: [0, -10, 0], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              >
                <FaceExpression type="evil" size="small" />
              </motion.div>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
              Sortează Sănătos
            </h1>
            <p className="text-xl text-white/90 mb-8 font-medium">
              Trage alimentele în coșul corect și învață ce e bun pentru dinții tăi!
            </p>
            
            {/* Baskets preview */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <motion.div 
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-6 shadow-2xl border-4 border-white/30"
                whileHover={{ scale: 1.05, rotate: -2 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div 
                  className="mb-2 flex justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <FaceExpression type="happy" size="large" />
                </motion.div>
                <p className="font-bold text-white text-xl">PRIETENI</p>
                <p className="text-green-100 text-sm">Alimente sănătoase</p>
                <div className="mt-3 flex justify-center gap-1 text-sm text-white/80">
                  <span>Măr</span>
                  <span>•</span>
                  <span>Morcov</span>
                  <span>•</span>
                  <span>Apă</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 shadow-2xl border-4 border-white/30"
                whileHover={{ scale: 1.05, rotate: 2 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <motion.div 
                  className="mb-2 flex justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                >
                  <FaceExpression type="evil" size="large" />
                </motion.div>
                <p className="font-bold text-white text-xl">DUȘMANI</p>
                <p className="text-red-100 text-sm">Alimente dăunătoare</p>
                <div className="mt-3 flex justify-center gap-1 text-sm text-white/80">
                  <span>Suc</span>
                  <span>•</span>
                  <span>Bomboane</span>
                  <span>•</span>
                  <span>Ciocolată</span>
                </div>
              </motion.div>
            </div>
            
            {/* Rules card */}
            <motion.div 
              className="bg-white/95 backdrop-blur rounded-3xl p-6 mb-8 shadow-xl"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Cum se joacă
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 bg-green-50 p-3 rounded-xl">
                  <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                  <span className="text-gray-700">Sortează 20 alimente</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl">
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                  <span className="text-gray-700">Trage stânga/dreapta</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-xl">
                  <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                  <span className="text-gray-700">+10 puncte/corect</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 p-3 rounded-xl">
                  <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
                  <span className="text-gray-700">+50 bonus timp</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-700 font-semibold">
                <span className="text-xl">!</span>
                <span>Ultimele 5 sunt CAPCANE!</span>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-white text-green-600 text-2xl font-extrabold px-16 py-5 rounded-full shadow-2xl hover:shadow-green-400/50 transition-shadow"
            >
              JOACĂ ACUM!
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Result screen
  if (gameState === 'result') {
    const timeBonus = timeLeft > 0 ? 50 : 0;
    const finalScore = score + timeBonus;
    const accuracy = Math.round((correctCount / (correctCount + wrongCount)) * 100) || 0;
    const isPerfect = wrongCount === 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 p-4">
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 rounded-full"
              initial={{ y: -50, x: Math.random() * window.innerWidth }}
              animate={{ y: window.innerHeight + 50, rotate: Math.random() * 360 }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 2 
              }}
              style={{
                backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#7FFF00', '#FF6347'][i % 5]
              }}
            />
          ))}
        </div>

        <div className="max-w-2xl mx-auto pt-8 text-center relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-8xl mb-4 flex justify-center"
          >
            <FaceExpression type={isPerfect ? 'happy' : finalScore >= 150 ? 'happy' : finalScore >= 100 ? 'neutral' : 'evil'} size="large" />
          </motion.div>
          
          <motion.h1 
            className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {isPerfect ? 'PERFECT!' : 'BRAVO!'}
          </motion.h1>
          
          <motion.div 
            className="bg-white rounded-3xl p-8 shadow-2xl mt-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.p 
              className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              {finalScore}
            </motion.p>
            <p className="text-gray-500 font-medium">puncte totale</p>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <motion.div 
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border-2 border-green-200"
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                <p className="text-xs text-green-700 font-medium">Corecte</p>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border-2 border-red-200"
                whileHover={{ scale: 1.05 }}
              >
                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-red-600">{wrongCount}</p>
                <p className="text-xs text-red-700 font-medium">Greșite</p>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 border-2 border-yellow-200"
                whileHover={{ scale: 1.05 }}
              >
                <Timer className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-yellow-600">{timeBonus}</p>
                <p className="text-xs text-yellow-700 font-medium">Bonus</p>
              </motion.div>
            </div>
            
            <motion.div 
              className="mt-6 p-4 bg-gray-50 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-gray-600 font-medium">
                Acuratețe: <span className={`text-2xl font-bold ${accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{accuracy}%</span>
              </p>
              <div className="w-full h-4 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  className={`h-full rounded-full ${accuracy >= 80 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${accuracy}%` }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                />
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="flex gap-4 justify-center mt-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-white text-green-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Joacă Din Nou
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl"
            >
              Înapoi
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-green-300 via-emerald-200 to-teal-300 overflow-hidden relative">
      {/* Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: p.x + '%',
            top: p.y + '%',
            width: p.size,
            height: p.size,
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className={`w-full h-full rounded-full ${p.type === 'sparkle' ? 'animate-pulse' : ''}`}
            style={{ 
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size}px ${p.color}`,
            }}
          />
        </motion.div>
      ))}

      {/* Fairy */}
      <AnimatePresence>
        {showFairy && (
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -200, opacity: 0 }}
            className="fixed top-20 left-4 z-50"
          >
            <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-xs border-4 border-pink-200">
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-pink-400 flex items-center justify-center text-xl"
                >
                  <Star className="w-6 h-6 text-white" />
                </motion.div>
                <p className="text-gray-700 font-medium">{fairyMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 shadow-lg z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <motion.button 
            onClick={onBack} 
            className="p-2 hover:bg-gray-100 rounded-full"
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <motion.div 
              className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="w-5 h-5 text-yellow-600" />
              <motion.span 
                key={score}
                initial={{ scale: 1.5, color: '#FFD700' }}
                animate={{ scale: 1, color: '#000' }}
                className="font-bold"
              >
                {score}
              </motion.span>
            </motion.div>
            
            <motion.div 
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeLeft < 10 ? 'bg-red-100 animate-pulse' : 'bg-blue-100'}`}
            >
              <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-red-600' : 'text-blue-600'}`} />
              <span className={`font-bold ${timeLeft < 10 ? 'text-red-600' : 'text-blue-600'}`}>{timeLeft}s</span>
            </motion.div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="max-w-lg mx-auto mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1 font-medium">
            <span>Progres</span>
            <span>{currentIndex + 1} / 20</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / 20) * 100}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
            />
          </div>
        </div>
      </div>

      {/* Streak counter */}
      {streakCount > 2 && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="fixed top-28 left-1/2 transform -translate-x-1/2 z-30"
        >
          <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-xl flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-5 h-5 fill-white" />
            </motion.div>
            <span>x{streakCount} STREAK!</span>
          </div>
        </motion.div>
      )}

      {/* Drop zones */}
      <div className="fixed inset-0 pt-32 flex">
        {/* Left zone - Healthy */}
        <motion.div 
          className={`flex-1 flex flex-col items-center justify-end pb-32 transition-all ${
            dragDirection === 'left' ? 'bg-green-400/50' : 'bg-green-400/20'
          }`}
          animate={{ 
            scale: dragDirection === 'left' ? 1.02 : 1,
          }}
        >
          <motion.div 
            className={`text-center p-8 rounded-3xl shadow-2xl border-4 ${
              dragDirection === 'left' 
                ? 'bg-green-500 border-yellow-300 scale-110' 
                : 'bg-gradient-to-br from-green-500 to-green-600 border-white/50'
            }`}
            animate={{
              boxShadow: dragDirection === 'left' 
                ? '0 0 50px rgba(34, 197, 94, 0.8)' 
                : '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <motion.div 
              className="flex justify-center mb-2"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FaceExpression type="happy" size="large" />
            </motion.div>
            <p className="font-black text-white text-2xl">PRIETENI</p>
            <p className="text-green-100 font-medium">Sănătos</p>
          </motion.div>
        </motion.div>

        {/* Right zone - Unhealthy */}
        <motion.div 
          className={`flex-1 flex flex-col items-center justify-end pb-32 transition-all ${
            dragDirection === 'right' ? 'bg-red-400/50' : 'bg-red-400/20'
          }`}
          animate={{ 
            scale: dragDirection === 'right' ? 1.02 : 1,
          }}
        >
          <motion.div 
            className={`text-center p-8 rounded-3xl shadow-2xl border-4 ${
              dragDirection === 'right' 
                ? 'bg-red-500 border-yellow-300 scale-110' 
                : 'bg-gradient-to-br from-red-500 to-red-600 border-white/50'
            }`}
            animate={{
              boxShadow: dragDirection === 'right' 
                ? '0 0 50px rgba(239, 68, 68, 0.8)' 
                : '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <motion.div 
              className="flex justify-center mb-2"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <FaceExpression type="evil" size="large" />
            </motion.div>
            <p className="font-black text-white text-2xl">DUȘMANI</p>
            <p className="text-red-100 font-medium">Nesănătos</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Food display - Two stage: Image first, then draggable card */}
      <AnimatePresence mode="wait">
        {currentFood && !feedback && showFoodImage && (
          /* STAGE 1: Show just the food emoji/image */
          <motion.div
            key={`${currentFood.id}-image`}
            initial={{ y: -100, opacity: 0, scale: 0.5 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1,
            }}
            exit={{ 
              scale: 0.8,
              opacity: 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setShowFoodImage(false)}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 cursor-pointer"
          >
            {/* Large food emoji */}
            <motion.div 
              className="relative flex items-center justify-center"
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-9xl filter drop-shadow-2xl">{currentFood.emoji}</span>
              
              {/* Glow effect */}
              <motion.div 
                className="absolute inset-0 rounded-full blur-3xl -z-10"
                style={{ backgroundColor: currentFood.color }}
                animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            {/* Click hint */}
            <motion.div 
              className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.span 
                className="text-gray-700 font-bold bg-white/90 px-6 py-2 rounded-full text-lg shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Apasă pentru a sorta! 👆
              </motion.span>
            </motion.div>
          </motion.div>
        )}

        {currentFood && !feedback && !showFoodImage && (
          /* STAGE 2: Draggable card with face and name */
          <motion.div
            key={`${currentFood.id}-card`}
            initial={{ y: -200, opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1,
              rotate: 0,
            }}
            exit={{ 
              scale: 0,
              opacity: 0,
              rotate: dragDirection === 'left' ? -45 : 45,
              x: dragDirection === 'left' ? -200 : 200,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            drag
            dragConstraints={{ left: -150, right: 150, top: -100, bottom: 100 }}
            dragElastic={0.3}
            onDragStart={() => setIsDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            whileDrag={{ 
              scale: 1.2, 
              cursor: 'grabbing',
              zIndex: 100,
            }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 cursor-grab"
          >
            {/* Trail effect */}
            {isDragging && (
              <motion.div
                className="absolute inset-0 rounded-3xl"
                style={{ backgroundColor: currentFood.color }}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
            
            <motion.div 
              className="relative w-40 h-48 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-4 border-white"
              style={{ backgroundColor: currentFood.color }}
              animate={{
                boxShadow: isDragging 
                  ? `0 20px 60px ${currentFood.color}80` 
                  : '0 10px 30px rgba(0,0,0,0.3)'
              }}
            >
              {/* Face expression at top */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <FaceExpression type={currentFood.faceExpression} size="large" />
              </div>
              
              {/* Food name in center */}
              <motion.p 
                className="text-center font-black text-white text-2xl drop-shadow-lg px-2"
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {currentFood.name}
              </motion.p>
              
              {/* Small emoji at bottom */}
              <span className="absolute bottom-3 text-2xl">{currentFood.emoji}</span>
            </motion.div>
            
            {/* Drag hint */}
            {!isDragging && (
              <motion.div 
                className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-gray-600 font-medium bg-white/80 px-3 py-1 rounded-full text-sm">
                  ← Trage →
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={`text-center p-10 rounded-3xl shadow-2xl border-4 ${
                feedback.correct 
                  ? 'bg-gradient-to-br from-green-400 to-green-500 border-yellow-300' 
                  : 'bg-gradient-to-br from-red-400 to-red-500 border-gray-300'
              }`}
            >
              <motion.div 
                className="mb-4 flex justify-center"
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: feedback.correct ? [0, 10, -10, 0] : [0, -10, 10, 0]
                }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <FaceExpression type={feedback.correct ? 'happy' : 'neutral'} size="large" />
              </motion.div>
              <motion.p 
                className="text-3xl font-black text-white mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {feedback.correct ? 'CORECT!' : 'GREȘIT!'}
              </motion.p>
              <motion.p 
                className="text-white/90 font-medium max-w-xs"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {feedback.message}
              </motion.p>
              
              {feedback.correct && (
                <motion.div
                  className="mt-4 flex justify-center gap-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 0 }}
                      animate={{ y: [-20, 0] }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                    >
                      <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trap warning */}
      <AnimatePresence>
        {currentIndex >= 15 && !feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-36 left-0 right-0 flex justify-center z-30"
          >
            <motion.div 
              className="bg-red-500 text-white px-6 py-3 rounded-full font-black text-lg shadow-xl flex items-center gap-2"
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                  '0 0 0 20px rgba(239, 68, 68, 0)',
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-2xl">!</span>
              CAPCANE ÎNAINTE!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-center gap-4 z-30">
        <motion.div 
          className="bg-white/95 backdrop-blur px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <Star className="w-6 h-6 text-yellow-500" />
          <span className="font-bold text-green-600 text-xl">{correctCount}</span>
          <span className="text-gray-400">/</span>
          <span className="font-bold text-red-600 text-xl">{wrongCount}</span>
        </motion.div>
      </div>
    </div>
  );
}
