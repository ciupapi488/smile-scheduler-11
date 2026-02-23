import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ArrowLeft, Clock, Trophy, Star, RotateCcw, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { useGameProgress } from '@/hooks/useBrushingProgress';
import { ToothFairyAvatar } from '../ToothFairyAvatar';

interface FoodSorterGameProps {
  onBack: () => void;
}

interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  isHealthy: boolean;
  isTrap: boolean;
  explanation: string;
  color: string;
}

const FOODS: FoodItem[] = [
  // Healthy foods
  { id: '1', name: 'Măr', emoji: '🍎', isHealthy: true, isTrap: false, explanation: 'Merele curăță dinții natural!', color: '#FF6B6B' },
  { id: '2', name: 'Morcov', emoji: '🥕', isHealthy: true, isTrap: false, explanation: 'Morcovii sunt buni pentru gingii!', color: '#FF8C42' },
  { id: '3', name: 'Brânză', emoji: '🧀', isHealthy: true, isTrap: false, explanation: 'Brânza are calciu pentru dinți puternici!', color: '#FFD93D' },
  { id: '4', name: 'Iaurt', emoji: '🥛', isHealthy: true, isTrap: false, explanation: 'Iaurtul are probiotice sănătoase!', color: '#F8F9FA' },
  { id: '5', name: 'Apă', emoji: '💧', isHealthy: true, isTrap: false, explanation: 'Apa spală bacteriile!', color: '#74C0FC' },
  { id: '6', name: 'Nuci', emoji: '🥜', isHealthy: true, isTrap: false, explanation: 'Nucile au proteine și minerale!', color: '#8B5A2B' },
  { id: '7', name: 'Pâine integrală', emoji: '🍞', isHealthy: true, isTrap: false, explanation: 'Pâinea integrală are fibre!', color: '#D4A373' },
  { id: '8', name: 'Ou', emoji: '🥚', isHealthy: true, isTrap: false, explanation: 'Ouăle au vitamina D!', color: '#FFF3E0' },
  { id: '9', name: 'Pește', emoji: '🐟', isHealthy: true, isTrap: false, explanation: 'Peștele are fosfor pentru dinți!', color: '#90CAF9' },
  { id: '10', name: 'Varză', emoji: '🥬', isHealthy: true, isTrap: false, explanation: 'Varza are vitamina C!', color: '#66BB6A' },
  // Harmful foods
  { id: '11', name: 'Bomboane', emoji: '🍬', isHealthy: false, isTrap: false, explanation: 'Bomboanele fac carii!', color: '#FF69B4' },
  { id: '12', name: 'Suc acidulat', emoji: '🥤', isHealthy: false, isTrap: false, explanation: 'Sucul distruge smalțul!', color: '#E53935' },
  { id: '13', name: 'Ciocolată', emoji: '🍫', isHealthy: false, isTrap: false, explanation: 'Ciocolata se lipește de dinți!', color: '#5D4037' },
  { id: '14', name: 'Chipsuri', emoji: '🥔', isHealthy: false, isTrap: false, explanation: 'Chipsurile sunt acide!', color: '#FFAB40' },
  { id: '15', name: 'Înghețată', emoji: '🍦', isHealthy: false, isTrap: false, explanation: 'Înghețata are mult zahăr!', color: '#FFF8E1' },
  { id: '16', name: 'Băutură acidă', emoji: '🧃', isHealthy: false, isTrap: false, explanation: 'Acidul atacă dinții!', color: '#FF5722' },
  { id: '17', name: 'Caramel', emoji: '🍮', isHealthy: false, isTrap: false, explanation: 'Caramelul se lipeste tare!', color: '#D7CCC8' },
  { id: '18', name: 'Tort', emoji: '🎂', isHealthy: false, isTrap: false, explanation: 'Tortul are mult zahăr!', color: '#F48FB1' },
  // Trap foods
  { id: '19', name: 'Gumă fără zahăr', emoji: '🍬', isHealthy: true, isTrap: true, explanation: 'Surpriză! Guma fără zahăr e OK!', color: '#81C784' },
  { id: '20', name: 'Lămâie', emoji: '🍋', isHealthy: false, isTrap: true, explanation: 'Capcană! Lămâia e acidă!', color: '#FFF176' },
];

export function FoodSorterGame({ onBack }: FoodSorterGameProps) {
  const { earnSticker } = useBrushingProgress();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');
  const [foodsQueue, setFoodsQueue] = useState<FoodItem[]>([]);
  const [currentFood, setCurrentFood] = useState<FoodItem | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; correct: boolean; emoji: string } | null>(null);
  const [fairyComment, setFairyComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropZone, setDropZone] = useState<'left' | 'right' | null>(null);
  const [foodsInBasket, setFoodsInBasket] = useState<{food: FoodItem; zone: 'healthy' | 'unhealthy'}[]>([]);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Initialize game
  const startGame = useCallback(() => {
    const shuffled = [...FOODS].sort(() => Math.random() - 0.5);
    setFoodsQueue(shuffled);
    setCurrentFood(shuffled[0]);
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setCorrectCount(0);
    setWrongCount(0);
    setFeedback(null);
    setFairyComment('Trage alimentele în coșul corect!');
    setFoodsInBasket([]);
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timerRef.current);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
  }, [gameState, timeLeft]);

  // Fairy comments
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const comments = [
      'Gândește-te ce e bun pentru dinții tăi!',
      'Bacteriile adoră zahărul!',
      'Calciul = dinți puternici!',
      'Atentie la capcane!',
      'Apa e cel mai bun prieten!',
    ];
    
    const interval = setInterval(() => {
      if (!feedback) {
        setFairyComment(comments[Math.floor(Math.random() * comments.length)]);
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [gameState, feedback]);

  const handleSort = (isHealthyZone: boolean) => {
    if (!currentFood || feedback) return;
    
    const isCorrect = currentFood.isHealthy === isHealthyZone;
    
    if (isCorrect) {
      const points = currentFood.isTrap ? 20 : 10;
      setScore(s => s + points);
      setCorrectCount(c => c + 1);
      setFeedback({ 
        message: currentFood.explanation, 
        correct: true, 
        emoji: currentFood.isTrap ? '🎯' : '✅' 
      });
      
      // Add to basket visualization
      setFoodsInBasket(prev => [...prev, { 
        food: currentFood, 
        zone: isHealthyZone ? 'healthy' : 'unhealthy' 
      }]);
      
      if (currentFood.isTrap) {
        setFairyComment('Bravo! Ai prins capcana! +20');
        if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
      } else {
        setFairyComment(`Corect! ${currentFood.name} ${isHealthyZone ? 'e sănătos!' : 'nu e bun!'}`);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    } else {
      setScore(s => Math.max(0, s - 5));
      setWrongCount(w => w + 1);
      setFeedback({ 
        message: currentFood.explanation, 
        correct: false, 
        emoji: '❌' 
      });
      setFairyComment('Ups! ' + currentFood.explanation);
      if (navigator.vibrate) navigator.vibrate([100, 50]);
    }

    // Move to next food after delay
    setTimeout(() => {
      setFeedback(null);
      const nextIndex = foodsQueue.findIndex(f => f.id === currentFood.id) + 1;
      
      if (nextIndex < foodsQueue.length) {
        setCurrentFood(foodsQueue[nextIndex]);
        // Warning for traps (last 5)
        if (nextIndex >= 15) {
          setFairyComment('⚠️ ATENȚIE! Capcane!');
        }
      } else {
        endGame();
      }
    }, 1800);
  };

  const endGame = () => {
    setGameState('result');
    
    // Time bonus
    let finalScore = score;
    if (timeLeft > 0) {
      finalScore += 50;
    }
    
    // Award sticker if score is good
    if (finalScore >= 150) {
      earnSticker('detective');
    }
  };

  // Drag handlers
  const handleDragStart = () => {
    setIsDragging(true);
    setFairyComment('Trage în stânga sau dreapta!');
  };

  const handleDrag = (_: unknown, info: PanInfo) => {
    setDragPosition({ x: info.offset.x, y: info.offset.y });
    
    // Determine drop zone based on drag position
    if (info.offset.x < -80) {
      setDropZone('left');
    } else if (info.offset.x > 80) {
      setDropZone('right');
    } else {
      setDropZone(null);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    
    if (info.offset.x < -100) {
      handleSort(true); // Left = Healthy
    } else if (info.offset.x > 100) {
      handleSort(false); // Right = Unhealthy
    }
    
    setDropZone(null);
  };

  const currentIndex = currentFood ? foodsQueue.findIndex(f => f.id === currentFood.id) : 0;
  const isTrapPhase = currentIndex >= 15;

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-green-100 p-4">
        <div className="max-w-2xl mx-auto pt-4">
          <button 
            onClick={onBack} 
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </button>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🍎⚡🍬</div>
            <h1 className="text-4xl md:text-5xl font-bold text-green-600 mb-2">Sortează Sănătos</h1>
            <p className="text-lg text-gray-600 mb-6">Trage alimentele în coșul corect!</p>
            
            {/* Game preview */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-green-400 to-green-500 rounded-2xl p-4 text-white shadow-lg"
                >
                  <span className="text-5xl">😊</span>
                  <p className="font-bold text-lg mt-2">Prieteni</p>
                  <p className="text-sm opacity-90">Alimente sănătoase</p>
                  <div className="mt-2 text-2xl">🍎🥕🧀</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-red-400 to-red-500 rounded-2xl p-4 text-white shadow-lg"
                >
                  <span className="text-5xl">😈</span>
                  <p className="font-bold text-lg mt-2">Dușmani</p>
                  <p className="text-sm opacity-90">Alimente dăunătoare</p>
                  <div className="mt-2 text-2xl">🍬🥤🍫</div>
                </motion.div>
              </div>
            </div>
            
            {/* Rules */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 mb-6 text-left"
            >
              <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Cum se joacă:
              </h3>
              <ul className="space-y-2 text-yellow-700 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">1</span>
                  Sortează 20 de alimente în 60 de secunde
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">2</span>
                  Trage alimentul în stânga (sănătos) sau dreapta (nesănătos)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">3</span>
                  +10 puncte pentru răspuns corect, +20 pentru capcane!
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">4</span>
                  -5 puncte pentru greșeală
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">5</span>
                  +50 puncte bonus dacă termini repede!
                </li>
                <li className="flex items-center gap-2 text-red-600 font-semibold">
                  <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xs">!</span>
                  ⚠️ Ultimele 5 alimente sunt CAPCANE!
                </li>
              </ul>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold px-12 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              🎮 Începe Jocul!
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    const timeBonus = timeLeft > 0 ? 50 : 0;
    const finalScore = score + timeBonus;
    const isPerfect = wrongCount === 0 && correctCount === 20;
    const accuracy = Math.round((correctCount / (correctCount + wrongCount)) * 100) || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
        <div className="max-w-2xl mx-auto pt-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <div className="text-7xl mb-4">
              {isPerfect ? '🏆' : finalScore >= 180 ? '🥇' : finalScore >= 150 ? '🥈' : finalScore >= 100 ? '🥉' : '🎮'}
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {isPerfect ? 'PERFECT!' : 'Bravo!'}
            </h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-xl mb-6"
          >
            <p className="text-6xl font-bold text-green-600 mb-2">{finalScore}</p>
            <p className="text-gray-500 mb-6">puncte totale</p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-2xl p-4 border-2 border-green-100">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                <p className="text-xs text-green-700">Corecte</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-100">
                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-red-600">{wrongCount}</p>
                <p className="text-xs text-red-700">Greșite</p>
              </div>
              <div className="bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-100">
                <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-yellow-600">{timeBonus}</p>
                <p className="text-xs text-yellow-700">Bonus timp</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-600">
                Acuratețe: <span className="font-bold text-lg" style={{ color: accuracy >= 80 ? '#22C55E' : accuracy >= 50 ? '#EAB308' : '#EF4444' }}>{accuracy}%</span>
              </p>
              <div className="w-full h-3 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${accuracy}%`,
                    backgroundColor: accuracy >= 80 ? '#22C55E' : accuracy >= 50 ? '#EAB308' : '#EF4444'
                  }}
                />
              </div>
            </div>
          </motion.div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Joacă Din Nou
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-full font-bold"
            >
              Înapoi
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={gameAreaRef} className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md p-3 shadow-sm z-30">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800 p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded-full">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-800">{score}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${timeLeft < 10 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-bold">{timeLeft}s</span>
            </div>
          </div>
        </div>
        
        {/* Progress */}
        <div className="max-w-lg mx-auto mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progres</span>
            <span>{currentIndex + 1} / 20</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / 20) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Fairy Comment */}
      <AnimatePresence>
        {fairyComment && !feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 left-0 right-0 flex justify-center z-20 px-4"
          >
            <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-xl border border-green-100">
              <ToothFairyAvatar size="sm" />
              <span className="text-gray-700 font-medium">{fairyComment}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trap Warning */}
      <AnimatePresence>
        {isTrapPhase && !feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-36 left-0 right-0 flex justify-center z-20 px-4"
          >
            <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ATENȚIE! CAPCANE!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Zones */}
      <div className="fixed inset-0 pt-32 flex">
        {/* Left Zone - Healthy */}
        <motion.div 
          className={`flex-1 flex flex-col items-center justify-end pb-32 transition-all ${
            dropZone === 'left' ? 'bg-green-200/50' : 'bg-green-100/20'
          }`}
          animate={{ 
            scale: dropZone === 'left' ? 1.02 : 1,
          }}
        >
          <div className={`text-center p-6 rounded-3xl transition-all ${
            dropZone === 'left' 
              ? 'bg-green-500 shadow-2xl scale-110' 
              : 'bg-gradient-to-br from-green-400 to-green-500 shadow-xl'
          }`}>
            <span className="text-5xl">😊</span>
            <p className="text-white font-bold text-lg mt-2">PRIETENI</p>
            <p className="text-white/80 text-sm">Sănătos</p>
            
            {/* Mini basket contents */}
            <div className="mt-3 flex flex-wrap justify-center gap-1 max-w-[100px]">
              {foodsInBasket.filter(f => f.zone === 'healthy').slice(-6).map((f, i) => (
                <span key={i} className="text-lg">{f.food.emoji}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Zone - Unhealthy */}
        <motion.div 
          className={`flex-1 flex flex-col items-center justify-end pb-32 transition-all ${
            dropZone === 'right' ? 'bg-red-200/50' : 'bg-red-100/20'
          }`}
          animate={{ 
            scale: dropZone === 'right' ? 1.02 : 1,
          }}
        >
          <div className={`text-center p-6 rounded-3xl transition-all ${
            dropZone === 'right' 
              ? 'bg-red-500 shadow-2xl scale-110' 
              : 'bg-gradient-to-br from-red-400 to-red-500 shadow-xl'
          }`}>
            <span className="text-5xl">😈</span>
            <p className="text-white font-bold text-lg mt-2">DUȘMANI</p>
            <p className="text-white/80 text-sm">Nesănătos</p>
            
            {/* Mini basket contents */}
            <div className="mt-3 flex flex-wrap justify-center gap-1 max-w-[100px]">
              {foodsInBasket.filter(f => f.zone === 'unhealthy').slice(-6).map((f, i) => (
                <span key={i} className="text-lg">{f.food.emoji}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current Food - Draggable */}
      <AnimatePresence mode="wait">
        {currentFood && !feedback && (
          <motion.div
            key={currentFood.id}
            initial={{ y: -100, opacity: 0, rotate: -10 }}
            animate={{ 
              y: isDragging ? dragPosition.y : 0, 
              x: isDragging ? dragPosition.x : 0,
              opacity: 1,
              rotate: isDragging ? dragPosition.x * 0.1 : 0,
              scale: isDragging ? 1.1 : 1,
            }}
            exit={{ 
              y: dropZone === 'left' ? 200 : dropZone === 'right' ? 200 : -100,
              x: dropZone === 'left' ? -150 : dropZone === 'right' ? 150 : 0,
              opacity: 0,
              scale: 0.5,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            drag
            dragConstraints={{ left: -150, right: 150, top: -50, bottom: 100 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
          >
            <div 
              className="w-32 h-32 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-4 border-white"
              style={{ backgroundColor: currentFood.color }}
            >
              <span className="text-6xl filter drop-shadow-lg">{currentFood.emoji}</span>
            </div>
            <p className="text-center font-bold text-gray-700 mt-3 text-lg bg-white/80 px-4 py-1 rounded-full shadow">
              {currentFood.name}
            </p>
            
            {/* Drag hint */}
            {!isDragging && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
              >
                <span className="text-gray-500 text-sm bg-white/80 px-3 py-1 rounded-full">
                  ← Trage stânga sau dreapta →
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
          >
            <div className={`text-center p-8 rounded-3xl shadow-2xl ${
              feedback.correct ? 'bg-green-100 border-4 border-green-400' : 'bg-red-100 border-4 border-red-400'
            }`}>
              <div className="text-7xl mb-4">{feedback.emoji}</div>
              <p className={`text-2xl font-bold ${feedback.correct ? 'text-green-700' : 'text-red-700'}`}>
                {feedback.correct ? 'CORECT!' : 'GREȘIT!'}
              </p>
              <p className="text-gray-600 mt-2 max-w-xs">{feedback.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-center gap-4 z-30">
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-green-600">{correctCount}</span>
          <span className="text-gray-400">/</span>
          <span className="font-bold text-red-600">{wrongCount}</span>
        </div>
      </div>
    </div>
  );
}
