import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ArrowLeft, Trophy, Volume2, VolumeX, RotateCcw, Target, Zap, Star } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  active: boolean;
  scale: number;
}

interface CavityTooth {
  id: string;
  x: number;
  y: number;
  healed: boolean;
  scale: number;
  rotation: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  type: 'foam' | 'sparkle' | 'splash';
}

export function TongueGoalGame({ onBack }: { onBack: () => void }) {
  const { saveGameSession } = useGameProgress();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameOver' | 'victory'>('intro');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [shots, setShots] = useState(0);
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  
  // Tongue state
  const [tongueX, setTongueX] = useState(50);
  const [tongueDirection, setTongueDirection] = useState(1);
  const [tongueExpression, setTongueExpression] = useState<'focused' | 'scared' | 'happy' | 'laugh' | 'chewing'>('focused');
  const [tongueSquash, setTongueSquash] = useState(1);
  
  // Game objects
  const [balls, setBalls] = useState<Ball[]>([]);
  const [cavityTeeth, setCavityTeeth] = useState<CavityTooth[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Shooting
  const [isAiming, setIsAiming] = useState(false);
  const [aimPower, setAimPower] = useState(0);
  const [aimAngle, setAimAngle] = useState(-45);
  const [aimStartPos, setAimStartPos] = useState({ x: 0, y: 0 });
  const [tubeSqueeze, setTubeSqueeze] = useState(1);
  
  // Feedback
  const [showFeedback, setShowFeedback] = useState<{ text: string; points: number; type: 'success' | 'partial' | 'miss' } | null>(null);
  const [fairyMessage, setFairyMessage] = useState('Trage cu pasta de dinți în gura limbii!');
  const [showFairy, setShowFairy] = useState(true);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const particleIdRef = useRef(0);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number, type: Particle['type']) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color,
        size: Math.random() * 8 + 3,
        life: 1,
        type,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Create foam effect
  const createFoam = useCallback((x: number, y: number) => {
    const foamParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      foamParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        color: '#FFFFFF',
        size: Math.random() * 15 + 5,
        life: 1.5,
        type: 'foam',
      });
    }
    setParticles(prev => [...prev, ...foamParticles]);
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
          vy: p.vy + 0.2,
          life: p.life - 0.02,
        }))
        .filter(p => p.life > 0)
      );
    }, 16);
    
    return () => clearInterval(interval);
  }, [particles.length]);

  // Tongue movement
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const speeds = [2000, 1200, 700];
    const speed = speeds[level - 1] || 2000;
    
    const interval = setInterval(() => {
      setTongueX(prev => {
        let newX = prev + tongueDirection * (0.5 + level * 0.3);
        if (newX >= 75) {
          setTongueDirection(-1);
          newX = 75;
        } else if (newX <= 25) {
          setTongueDirection(1);
          newX = 25;
        }
        return newX;
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [gameState, level, tongueDirection]);

  // Spawn cavity teeth
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.6 && cavityTeeth.length < 2) {
        setCavityTeeth(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          x: 30 + Math.random() * 40,
          y: 25 + Math.random() * 20,
          healed: false,
          scale: 0,
          rotation: (Math.random() - 0.5) * 30,
        }]);
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [gameState, cavityTeeth.length]);

  // Animate cavity teeth entry
  useEffect(() => {
    cavityTeeth.forEach(tooth => {
      if (tooth.scale < 1 && !tooth.healed) {
        setTimeout(() => {
          setCavityTeeth(prev => prev.map(t => 
            t.id === tooth.id ? { ...t, scale: Math.min(1, t.scale + 0.1) } : t
          ));
        }, 50);
      }
    });
  }, [cavityTeeth]);

  // Physics engine
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updatePhysics = () => {
      setBalls(prev => prev.map(ball => {
        if (!ball.active) return ball;
        
        let newX = ball.x + ball.vx;
        let newY = ball.y + ball.vy;
        let newVx = ball.vx;
        let newVy = ball.vy + 0.25; // Gravity
        let newRotation = ball.rotation + ball.vx * 2;
        
        // Wall bounce
        if (newX <= 5 || newX >= 95) {
          newVx = -newVx * 0.7;
          newX = newX <= 5 ? 5 : 95;
        }
        
        // Ground hit
        if (newY >= 90) {
          createFoam(newX, 90);
          return { ...ball, active: false, y: 90, vy: -ball.vy * 0.5 };
        }
        
        // Cavity tooth collision
        let hitTooth = false;
        setCavityTeeth(prevTeeth => prevTeeth.map(tooth => {
          if (tooth.healed) return tooth;
          const dx = newX - tooth.x;
          const dy = newY - tooth.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 8) {
            hitTooth = true;
            setScore(s => s + 50);
            setCombo(c => c + 1);
            createParticles(tooth.x, tooth.y, '#FFD700', 30, 'sparkle');
            setShowFeedback({ text: 'DINTE VINDECAT!', points: 50, type: 'success' });
            setTimeout(() => setShowFeedback(null), 1500);
            return { ...tooth, healed: true, scale: 1.2 };
          }
          return tooth;
        }));
        
        if (hitTooth) {
          return { ...ball, active: false };
        }
        
        // Tongue collision
        const tongueLeft = tongueX - 15;
        const tongueRight = tongueX + 15;
        const mouthLeft = tongueX - 6;
        const mouthRight = tongueX + 6;
        const tongueTop = 65;
        const tongueBottom = 85;
        
        if (newY >= tongueTop && newY <= tongueBottom && newX >= tongueLeft && newX <= tongueRight) {
          const inMouth = newX >= mouthLeft && newX <= mouthRight;
          const onHand = (newX >= tongueLeft && newX < mouthLeft) || (newX > mouthRight && newX <= tongueRight);
          
          if (inMouth) {
            // GOAL!
            setScore(s => s + 20);
            setHits(h => h + 1);
            setCombo(c => {
              const newC = c + 1;
              if (newC > maxCombo) setMaxCombo(newC);
              return newC;
            });
            setTongueExpression('happy');
            setTongueSquash(0.8);
            createFoam(newX, tongueTop);
            createParticles(newX, newY, '#FFFFFF', 40, 'foam');
            setShowFeedback({ text: 'GOOOL!', points: 20, type: 'success' });
            if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
            
            setTimeout(() => {
              setTongueExpression('focused');
              setTongueSquash(1);
              setShowFeedback(null);
            }, 1200);
          } else if (onHand) {
            // Blocked by hand
            setScore(s => s + 5);
            setCombo(0);
            setTongueExpression('scared');
            createParticles(newX, newY, '#87CEEB', 15, 'splash');
            setShowFeedback({ text: 'APĂRAT!', points: 5, type: 'partial' });
            if (navigator.vibrate) navigator.vibrate(100);
            
            setTimeout(() => {
              setTongueExpression('focused');
              setShowFeedback(null);
            }, 800);
          } else {
            // Miss
            setCombo(0);
            setTongueExpression('laugh');
            setShowFeedback({ text: 'RATAT!', points: 0, type: 'miss' });
            if (navigator.vibrate) navigator.vibrate(200);
            
            setTimeout(() => {
              setTongueExpression('focused');
              setShowFeedback(null);
            }, 1000);
          }
          
          return { ...ball, active: false, y: tongueTop };
        }
        
        return { 
          ...ball, 
          x: newX, 
          y: newY, 
          vx: newVx, 
          vy: newVy, 
          rotation: newRotation,
          scale: Math.max(0.8, 1 - (newY / 200))
        };
      }).filter(ball => ball.active || ball.y < 95));
      
      animationRef.current = requestAnimationFrame(updatePhysics);
    };
    
    animationRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, tongueX, cavityTeeth, createParticles, createFoam, maxCombo]);

  // Level up
  useEffect(() => {
    if (hits > 0 && hits % 5 === 0 && level < 3) {
      const newLevel = Math.min(3, Math.floor(hits / 5) + 1);
      if (newLevel > level) {
        setLevel(newLevel);
        setFairyMessage(`NIVELUL ${newLevel}! Limbă se mișcă mai repede!`);
        setShowFairy(true);
        setTimeout(() => setShowFairy(false), 3000);
      }
    }
  }, [hits, level]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing' || balls.some(b => b.active)) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsAiming(true);
    setAimStartPos({ x: clientX, y: clientY });
    setTubeSqueeze(0.85);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = aimStartPos.x - clientX;
    const dy = aimStartPos.y - clientY;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 3, 25);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    setAimPower(power);
    setAimAngle(angle);
    setTubeSqueeze(0.85 - (power / 100));
  };

  const handleMouseUp = () => {
    if (!isAiming) return;
    
    setIsAiming(false);
    setTubeSqueeze(1);
    
    if (aimPower > 5) {
      const radians = aimAngle * (Math.PI / 180);
      const newBall: Ball = {
        id: Math.random().toString(36).substr(2, 9),
        x: 50,
        y: 82,
        vx: Math.cos(radians) * aimPower * 0.15,
        vy: Math.sin(radians) * aimPower * 0.15,
        rotation: 0,
        active: true,
        scale: 1,
      };
      
      setBalls(prev => [...prev, newBall]);
      setShots(s => s + 1);
      createFoam(50, 82);
      if (navigator.vibrate) navigator.vibrate(50);
    }
    
    setAimPower(0);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setShots(0);
    setHits(0);
    setCombo(0);
    setMaxCombo(0);
    setBalls([]);
    setCavityTeeth([]);
    setParticles([]);
    setTongueExpression('focused');
    setFairyMessage('Trage înapoi și lasă pentru a lansa! Vindecă dinții negri pentru bonus!');
    setShowFairy(true);
    setTimeout(() => setShowFairy(false), 4000);
  };

  const endGame = () => {
    setGameState(score >= 500 ? 'victory' : 'gameOver');
    saveGameSession({
      gameId: 'tongue',
      score,
      duration: shots * 3,
      level,
    });
  };

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-10"
              initial={{ x: Math.random() * 100 + 'vw', y: '100vh' }}
              animate={{ y: '-20vh' }}
              transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5 }}
            >
              🦷
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-2xl mx-auto p-6 pt-8">
          <motion.button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-white/80 hover:text-white font-medium bg-white/10 backdrop-blur px-4 py-2 rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </motion.button>
          
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            {/* Animated title */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <motion.span 
                className="text-6xl"
                animate={{ rotate: [0, -20, 20, 0], y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🪥
              </motion.span>
              <motion.span 
                className="text-7xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⚽
              </motion.span>
              <motion.span 
                className="text-6xl"
                animate={{ rotate: [0, 20, -20, 0], y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                👅
              </motion.span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl">
              Gol în Gura<br/>Limbii
            </h1>
            <p className="text-xl text-blue-200 mb-8 font-medium">
              Înscrie goluri în gura portarului limbă!<br/>
              Vindecă dinții negri pentru puncte bonus!
            </p>
            
            {/* Preview animation */}
            <motion.div 
              className="relative h-48 bg-gradient-to-b from-pink-100 to-pink-200 rounded-3xl mb-8 overflow-hidden shadow-2xl border-4 border-white/30"
              whileHover={{ scale: 1.02 }}
            >
              {/* Simplified tongue preview */}
              <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-8xl"
                animate={{ x: [-30, 30, -30] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                👅
              </motion.div>
              {/* Ball animation */}
              <motion.div
                className="absolute top-4 left-1/2 w-8 h-8 bg-white rounded-full shadow-lg"
                animate={{ 
                  y: [0, 120],
                  x: [0, 20, -20, 0],
                  scale: [1, 0.8, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              />
            </motion.div>
            
            {/* Rules */}
            <motion.div 
              className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-8 text-left"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                <Target className="w-5 h-5" />
                Cum se joacă:
              </h3>
              <ul className="space-y-3 text-blue-100">
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</span>
                  <span>Trage înapoi cu mouse-ul pentru a ținti</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</span>
                  <span>Lovește în <b>gură</b> pentru +20 puncte</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</span>
                  <span>Vindecă dinții <b>negri</b> pentru +50 puncte!</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">4</span>
                  <span>Combo x5 = puncte duble!</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-2xl font-black px-16 py-5 rounded-full shadow-2xl hover:shadow-green-400/50"
            >
              🎮 ÎNCEPE JOCUL! 🎮
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div 
            className="text-8xl mb-6"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            😢
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-4">Joc Terminat!</h1>
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 mb-6">
            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              {score}
            </p>
            <p className="text-gray-400">puncte</p>
          </div>
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-green-500 text-white px-8 py-3 rounded-full font-bold"
            >
              <RotateCcw className="w-5 h-5 inline mr-2" />
              Încearcă Din Nou
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="bg-gray-600 text-white px-8 py-3 rounded-full font-bold"
            >
              Înapoi
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-500 overflow-hidden">
        {/* Confetti */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            initial={{ y: -50, x: Math.random() * window.innerWidth, rotate: 0 }}
            animate={{ y: window.innerHeight + 50, rotate: 360 }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          >
            {['🎉', '🎊', '⭐', '🏆', '🎈', '👑'][i % 6]}
          </motion.div>
        ))}
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-center"
          >
            <motion.div 
              className="text-9xl mb-6"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🏆
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
              SUPER JUCĂTOR!
            </h1>
            <motion.div 
              className="bg-white rounded-3xl p-8 shadow-2xl"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500 mb-2">
                {score}
              </p>
              <p className="text-gray-500 mb-4">puncte</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-600">{hits}</p>
                  <p className="text-gray-600">Goluri</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-blue-600">{maxCombo}</p>
                  <p className="text-gray-600">Max Combo</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-purple-600">{level}</p>
                  <p className="text-gray-600">Nivel</p>
                </div>
              </div>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="mt-8 bg-white text-orange-600 text-xl font-black px-12 py-4 rounded-full shadow-xl"
            >
              Joacă Din Nou!
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div 
      ref={gameAreaRef}
      className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-white overflow-hidden relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Background - Mouth interior */}
      <div className="absolute inset-0">
        {/* Gums */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-pink-300 to-pink-100" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-pink-300 to-pink-100" />
        
        {/* Background teeth */}
        <div className="absolute top-8 left-4 right-4 flex justify-between opacity-30">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="text-6xl">🦷</div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 shadow-lg z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-3">
            <motion.div 
              className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="w-5 h-5 text-yellow-600" />
              <motion.span key={score} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-bold">
                {score}
              </motion.span>
            </motion.div>
            <div className="bg-blue-100 px-3 py-2 rounded-full font-bold text-blue-700">
              N{level}
            </div>
          </div>
        </div>
      </div>

      {/* Combo display */}
      <AnimatePresence>
        {combo >= 3 && (
          <motion.div
            initial={{ scale: 0, y: -50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-30"
          >
            <motion.div 
              className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-2 rounded-full font-black text-xl shadow-xl flex items-center gap-2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Zap className="w-5 h-5" />
              COMBO x{combo}!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fairy message */}
      <AnimatePresence>
        {showFairy && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-32 left-4 z-30"
          >
            <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-xs border-4 border-pink-200">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="text-4xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🧚‍♀️
                </motion.div>
                <p className="text-gray-700 font-medium text-sm">{fairyMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback popup */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none"
          >
            <motion.div 
              className={`text-center px-8 py-4 rounded-2xl shadow-2xl border-4 ${
                showFeedback.type === 'success' 
                  ? 'bg-gradient-to-r from-green-400 to-green-500 border-yellow-300' 
                  : showFeedback.type === 'partial'
                  ? 'bg-gradient-to-r from-blue-400 to-blue-500 border-white'
                  : 'bg-gradient-to-r from-red-400 to-red-500 border-gray-300'
              }`}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-3xl font-black text-white">{showFeedback.text}</p>
              {showFeedback.points > 0 && (
                <motion.p 
                  className="text-4xl font-black text-yellow-300"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  +{showFeedback.points * (combo >= 5 ? 2 : 1)}
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none z-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ scale: 1, opacity: p.life }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {p.type === 'foam' ? (
            <div className="w-full h-full bg-white rounded-full opacity-80" 
              style={{ filter: 'blur(2px)' }}
            />
          ) : (
            <div 
              className="w-full h-full rounded-full"
              style={{ 
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size}px ${p.color}`,
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Cavity teeth */}
      <AnimatePresence>
        {cavityTeeth.map(tooth => (
          <motion.div
            key={tooth.id}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: tooth.healed ? [tooth.scale, 1.5, 0] : tooth.scale,
              rotate: tooth.rotation,
              opacity: tooth.healed ? 0 : 1
            }}
            exit={{ scale: 0 }}
            className="absolute z-10"
            style={{ left: `${tooth.x}%`, top: `${tooth.y}%` }}
          >
            <div className="relative">
              {tooth.healed ? (
                <motion.div 
                  className="text-5xl"
                  animate={{ rotate: [0, 360], scale: [1, 1.5] }}
                  transition={{ duration: 0.5 }}
                >
                  ✨🦷✨
                </motion.div>
              ) : (
                <>
                  <span className="text-5xl filter grayscale">🦷</span>
                  {/* Bacteria on tooth */}
                  <motion.div 
                    className="absolute -top-2 -right-2 text-lg"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🦠
                  </motion.div>
                  <motion.div 
                    className="absolute -bottom-1 -left-1 text-lg"
                    animate={{ rotate: [0, -360] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    🦠
                  </motion.div>
                  <div className="absolute inset-0 bg-black/50 rounded-full blur-md" />
                </>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Balls */}
      <AnimatePresence>
        {balls.map(ball => (
          <motion.div
            key={ball.id}
            className="absolute z-30"
            style={{ 
              left: `${ball.x}%`, 
              top: `${ball.y}%`,
              transform: `translate(-50%, -50%) rotate(${ball.rotation}deg) scale(${ball.scale})`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: ball.scale }}
            exit={{ scale: 0 }}
          >
            {/* Toothpaste ball with glow */}
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-full shadow-lg"
                style={{ 
                  boxShadow: '0 0 20px rgba(255,255,255,0.8), inset -3px -3px 10px rgba(200,200,200,0.5)',
                }}
              />
              {/* Sparkle */}
              <motion.div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full"
                animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </div>
            {/* Trail */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-full bg-white/50 rounded-full"
              style={{ transform: 'translateX(-10px)' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Aim line */}
      {isAiming && aimPower > 2 && (
        <svg className="absolute inset-0 pointer-events-none z-25">
          <motion.path
            d={`M ${window.innerWidth * 0.5} ${window.innerHeight * 0.82} 
                Q ${window.innerWidth * 0.5 - Math.cos(aimAngle * Math.PI / 180) * aimPower * 3} ${window.innerHeight * 0.82 - Math.sin(aimAngle * Math.PI / 180) * aimPower * 3}
                ${window.innerWidth * 0.5 - Math.cos(aimAngle * Math.PI / 180) * aimPower * 10} ${window.innerHeight * 0.82 - Math.sin(aimAngle * Math.PI / 180) * aimPower * 10}`}
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="3"
            strokeDasharray="10,5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />
        </svg>
      )}

      {/* Tongue Goalkeeper */}
      <motion.div 
        className="absolute z-20"
        style={{ 
          left: `${tongueX}%`, 
          top: '65%',
          transform: 'translateX(-50%)',
        }}
        animate={{ scaleX: tongueSquash }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Main tongue body */}
        <motion.div 
          className="relative w-40 h-48"
          animate={{ 
            y: tongueExpression === 'happy' ? [0, -10, 0] : 0,
          }}
          transition={{ duration: 0.5, repeat: tongueExpression === 'happy' ? Infinity : 0 }}
        >
          {/* Tongue shape */}
          <div className="absolute inset-0 bg-gradient-to-b from-pink-400 to-pink-500 rounded-full"
            style={{ 
              borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
              boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            {/* Tongue texture */}
            <div className="absolute inset-4 bg-pink-300/30 rounded-full" />
          </div>
          
          {/* Mouth opening */}
          <motion.div 
            className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-12 bg-gradient-to-b from-red-800 to-red-900 rounded-full overflow-hidden"
            animate={{ 
              height: tongueExpression === 'happy' || tongueExpression === 'chewing' ? 24 : 16,
              width: tongueExpression === 'happy' ? 72 : 64,
            }}
            style={{ borderRadius: '40% 40% 60% 60%' }}
          >
            {/* Teeth inside mouth */}
            <div className="absolute top-0 left-0 right-0 flex justify-center">
              <div className="text-xs">🦷🦷</div>
            </div>
          </motion.div>
          
          {/* Eyes */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            {/* Left eye */}
            <motion.div 
              className="w-10 h-10 bg-white rounded-full relative overflow-hidden shadow-inner"
              animate={{ 
                scaleY: tongueExpression === 'happy' ? 0.1 : 1,
              }}
            >
              <motion.div 
                className="w-5 h-5 bg-gray-800 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{
                  x: balls.length > 0 && balls[balls.length - 1].active ? (balls[balls.length - 1].x - tongueX) * 0.3 : 0,
                }}
              />
              <div className="w-2 h-2 bg-white rounded-full absolute top-2 right-2" />
            </motion.div>
            
            {/* Right eye */}
            <motion.div 
              className="w-10 h-10 bg-white rounded-full relative overflow-hidden shadow-inner"
              animate={{ 
                scaleY: tongueExpression === 'happy' ? 0.1 : 1,
              }}
            >
              <motion.div 
                className="w-5 h-5 bg-gray-800 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{
                  x: balls.length > 0 && balls[balls.length - 1].active ? (balls[balls.length - 1].x - tongueX) * 0.3 : 0,
                }}
              />
              <div className="w-2 h-2 bg-white rounded-full absolute top-2 right-2" />
            </motion.div>
          </div>
          
          {/* Eyebrows */}
          <motion.div 
            className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-6"
            animate={{
              y: tongueExpression === 'scared' ? -5 : tongueExpression === 'focused' ? 0 : 2,
              rotate: tongueExpression === 'scared' ? 15 : 0,
            }}
          >
            <div className="w-8 h-2 bg-pink-700 rounded-full" />
            <div className="w-8 h-2 bg-pink-700 rounded-full" />
          </motion.div>
          
          {/* Goalkeeper gloves */}
          <motion.div 
            className="absolute top-12 -left-6 w-12 h-20 bg-gradient-to-b from-red-500 to-red-600 rounded-3xl shadow-lg"
            animate={{
              x: balls.length > 0 && balls[balls.length - 1].active && balls[balls.length - 1].x < tongueX ? 10 : 0,
              rotate: balls.length > 0 && balls[balls.length - 1].active && balls[balls.length - 1].x < tongueX ? -20 : 0,
            }}
          >
            <div className="absolute top-2 left-2 w-3 h-3 bg-white/30 rounded-full" />
            <div className="absolute top-6 left-2 w-3 h-3 bg-white/30 rounded-full" />
          </motion.div>
          
          <motion.div 
            className="absolute top-12 -right-6 w-12 h-20 bg-gradient-to-b from-red-500 to-red-600 rounded-3xl shadow-lg"
            animate={{
              x: balls.length > 0 && balls[balls.length - 1].active && balls[balls.length - 1].x > tongueX ? -10 : 0,
              rotate: balls.length > 0 && balls[balls.length - 1].active && balls[balls.length - 1].x > tongueX ? 20 : 0,
            }}
          >
            <div className="absolute top-2 right-2 w-3 h-3 bg-white/30 rounded-full" />
            <div className="absolute top-6 right-2 w-3 h-3 bg-white/30 rounded-full" />
          </motion.div>
          
          {/* Legs */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <motion.div 
              className="w-4 h-12 bg-pink-400 rounded-full"
              animate={{ 
                rotate: tongueExpression === 'happy' ? [0, 20, -20, 0] : 0,
              }}
              transition={{ duration: 0.3, repeat: tongueExpression === 'happy' ? Infinity : 0 }}
            />
            <motion.div 
              className="w-4 h-12 bg-pink-400 rounded-full"
              animate={{ 
                rotate: tongueExpression === 'happy' ? [0, -20, 20, 0] : 0,
              }}
              transition={{ duration: 0.3, repeat: tongueExpression === 'happy' ? Infinity : 0, delay: 0.15 }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Toothpaste tube */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
        animate={{ scaleY: tubeSqueeze }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <div className="relative">
          {/* Tube body */}
          <div className="w-24 h-32 bg-gradient-to-b from-blue-400 to-blue-600 rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden">
            {/* Label */}
            <div className="bg-white/90 px-3 py-2 rounded-xl text-center">
              <p className="text-blue-600 font-black text-xs">PASTĂ</p>
              <p className="text-blue-400 text-[8px]">DENTARĂ</p>
            </div>
            {/* Cap */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-blue-700 rounded-b-xl" />
            {/* Squeeze lines */}
            <motion.div 
              className="absolute left-0 top-0 bottom-0 w-2 bg-blue-300/30"
              animate={{ x: isAiming ? [0, 5, 0] : 0 }}
              transition={{ duration: 0.2, repeat: isAiming ? Infinity : 0 }}
            />
          </div>
          
          {/* Nozzle */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-4 bg-blue-300 rounded-t-lg" />
        </div>
        
        {/* Instructions */}
        {!isAiming && !balls.some(b => b.active) && (
          <motion.p 
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm whitespace-nowrap font-medium bg-white/80 px-3 py-1 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Trage înapoi pentru a lansa!
          </motion.p>
        )}
      </motion.div>

      {/* End game button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={endGame}
        className="fixed bottom-4 right-4 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-gray-600 text-sm font-medium shadow-lg z-40"
      >
        Termină Jocul
      </motion.button>
    </div>
  );
}
