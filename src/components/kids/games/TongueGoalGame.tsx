import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, RotateCcw, Target, Zap, Star, ChevronRight, Shield } from 'lucide-react';
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
  stopped: boolean;
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
  type: 'foam' | 'sparkle' | 'confetti';
}

type GamePhase = 'aim' | 'power' | 'shooting' | 'result';
type SpeedLevel = 1 | 2 | 3 | 4 | 5;

const SPEED_NAMES: Record<SpeedLevel, string> = {
  1: 'Foarte Lent',
  2: 'Lent',
  3: 'Mediu',
  4: 'Rapid',
  5: 'Super Rapid',
};

const SPEED_MULTIPLIERS: Record<SpeedLevel, number> = {
  1: 0.6,
  2: 0.85,
  3: 1.1,
  4: 1.4,
  5: 1.75,
};

// Target line Y position (the flat bottom edge of the mouth)
const TARGET_LINE_Y = 30;
// Wider mouth area for easier scoring
const MOUTH_LEFT = 15;
const MOUTH_RIGHT = 85;
// Smaller tongue for easier scoring
const TONGUE_WIDTH = 8;

export function TongueGoalGame({ onBack }: { onBack: () => void }) {
  const { saveGameSession } = useGameProgress();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameOver' | 'victory'>('intro');
  const [score, setScore] = useState(0);
  const [goals, setGoals] = useState(0);
  const [shots, setShots] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [saves, setSaves] = useState(0);
  const MAX_SAVES = 3;
  
  const [phase, setPhase] = useState<GamePhase>('aim');
  
  // Arrow rotation for aiming
  const [arrowAngle, setArrowAngle] = useState(0);
  const angleDirectionRef = useRef(1);
  
  // Power shot state
  const [powerLevel, setPowerLevel] = useState(50);
  const powerDirectionRef = useRef(1);
  const [selectedSpeed, setSelectedSpeed] = useState<SpeedLevel>(3);
  
  // Tongue state
  const [tongueX, setTongueX] = useState(50);
  const [tongueSpeed, setTongueSpeed] = useState(1.2);
  const tongueDirectionRef = useRef(1);
  
  const [balls, setBalls] = useState<Ball[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const [showFeedback, setShowFeedback] = useState<{ text: string; points: number; type: 'success' | 'partial' | 'miss' } | null>(null);
  const [fairyMessage, setFairyMessage] = useState('Rotește săgeata și trage în poartă!');
  const [showFairy, setShowFairy] = useState(true);
  
  const particleIdRef = useRef(0);
  const animationRefs = useRef<{ [key: string]: number }>({});

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

  const createFoam = useCallback((x: number, y: number) => {
    const foamParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      foamParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        color: '#FFFFFF',
        size: Math.random() * 10 + 3,
        life: 1,
        type: 'foam',
      });
    }
    setParticles(prev => [...prev, ...foamParticles]);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.15, life: p.life - 0.025 }))
        .filter(p => p.life > 0)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [particles.length]);

  // Arrow rotation animation
  useEffect(() => {
    if (gameState !== 'playing' || phase !== 'aim') return;
    
    const animate = () => {
      setArrowAngle(prev => {
        let newAngle = prev + angleDirectionRef.current * 0.8;
        if (newAngle >= 55) { angleDirectionRef.current = -1; newAngle = 55; }
        else if (newAngle <= -55) { angleDirectionRef.current = 1; newAngle = -55; }
        return newAngle;
      });
      animationRefs.current.aim = requestAnimationFrame(animate);
    };
    
    animationRefs.current.aim = requestAnimationFrame(animate);
    return () => { if (animationRefs.current.aim) cancelAnimationFrame(animationRefs.current.aim); };
  }, [gameState, phase]);

  // Power bar animation
  useEffect(() => {
    if (gameState !== 'playing' || phase !== 'power') return;
    
    const animate = () => {
      setPowerLevel(prev => {
        let newPower = prev + powerDirectionRef.current * 4;
        if (newPower >= 100) { powerDirectionRef.current = -1; newPower = 100; }
        else if (newPower <= 0) { powerDirectionRef.current = 1; newPower = 0; }
        
        if (newPower < 20) setSelectedSpeed(1);
        else if (newPower < 40) setSelectedSpeed(2);
        else if (newPower < 60) setSelectedSpeed(3);
        else if (newPower < 80) setSelectedSpeed(4);
        else setSelectedSpeed(5);
        
        return newPower;
      });
      animationRefs.current.power = requestAnimationFrame(animate);
    };
    
    animationRefs.current.power = requestAnimationFrame(animate);
    return () => { if (animationRefs.current.power) cancelAnimationFrame(animationRefs.current.power); };
  }, [gameState, phase]);

  // Tongue movement
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const animate = () => {
      setTongueX(prev => {
        let newX = prev + tongueDirectionRef.current * tongueSpeed * 0.45;
        if (newX >= 72) { tongueDirectionRef.current = -1; newX = 72; }
        else if (newX <= 28) { tongueDirectionRef.current = 1; newX = 28; }
        return newX;
      });
      animationRefs.current.tongue = requestAnimationFrame(animate);
    };
    
    animationRefs.current.tongue = requestAnimationFrame(animate);
    return () => { if (animationRefs.current.tongue) cancelAnimationFrame(animationRefs.current.tongue); };
  }, [gameState, tongueSpeed]);

  // Ball physics - goes UP, gets smaller, stops at target line
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updatePhysics = () => {
      setBalls(prev => prev.map(ball => {
        if (!ball.active || ball.stopped) return ball;
        
        let newX = ball.x + ball.vx;
        let newY = ball.y + ball.vy;
        let newRotation = ball.rotation + 3;
        
        // NO gravity - ball moves in straight line to target
        // This ensures ball always reaches the target line when aimed correctly
        let newVy = ball.vy;
        
        // Calculate scale - ball gets SMALLER as it goes UP (perspective effect)
        // Start scale = 1.0, end scale = 0.7 (30% smaller at target)
        const distanceToTarget = newY - TARGET_LINE_Y;
        const totalDistance = 86 - TARGET_LINE_Y;
        const distanceTraveled = totalDistance - distanceToTarget;
        const progress = Math.min(Math.max(distanceTraveled / totalDistance, 0), 1);
        const newScale = 1 - (progress * 0.3);
        
        // Check if ball reached the TARGET LINE (flat bottom of mouth)
        if (newY <= TARGET_LINE_Y) {
          // STOP the ball exactly at the target line
          newY = TARGET_LINE_Y;
          
          const mouthLeftX = MOUTH_LEFT;
          const mouthRightX = MOUTH_RIGHT;
          const tongueLeft = tongueX - TONGUE_WIDTH;
          const tongueRight = tongueX + TONGUE_WIDTH;
          
          if (newX >= mouthLeftX && newX <= mouthRightX) {
            if (newX >= tongueLeft && newX <= tongueRight) {
              // BLOCKED!
              setTimeout(() => {
                const newSaves = saves + 1;
                setSaves(newSaves);
                setScore(s => s + 5);
                setCombo(0);
                createParticles(newX, TARGET_LINE_Y, '#FFB6C1', 10, 'foam');
                setShowFeedback({ text: 'APĂRAT!', points: 5, type: 'partial' });
                if (navigator.vibrate) navigator.vibrate(80);
                
                if (newSaves >= MAX_SAVES) {
                  setTimeout(() => {
                    setGameState('gameOver');
                    saveGameSession({ gameId: 'tongue', score, duration: shots * 4, level: Math.floor(goals / 3) + 1 });
                  }, 1500);
                }
              }, 100);
            } else {
              // GOAL!
              setTimeout(() => {
                const points = 20 + (combo * 5);
                setScore(s => s + points);
                setGoals(g => g + 1);
                setCombo(c => { const newC = c + 1; if (newC > maxCombo) setMaxCombo(newC); return newC; });
                createParticles(newX, TARGET_LINE_Y, '#FFD700', 30, 'confetti');
                createFoam(newX, TARGET_LINE_Y);
                setShowFeedback({ text: 'GOOOL!', points, type: 'success' });
                if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                setTongueSpeed(s => Math.min(4, s + 0.25));
              }, 100);
            }
          } else {
            // MISSED
            setTimeout(() => {
              setCombo(0);
              setShowFeedback({ text: 'RATAT!', points: 0, type: 'miss' });
              if (navigator.vibrate) navigator.vibrate(150);
            }, 100);
          }
          
          setTimeout(() => { setShowFeedback(null); setPhase('aim'); setBalls([]); }, 1800);
          return { ...ball, x: newX, y: newY, scale: newScale, rotation: newRotation, stopped: true, active: false };
        }
        
        // Ball went off screen (too far left/right)
        if (newX < -5 || newX > 105) {
          setTimeout(() => {
            setCombo(0);
            setShowFeedback({ text: 'RATAT!', points: 0, type: 'miss' });
            if (navigator.vibrate) navigator.vibrate(150);
          }, 100);
          setTimeout(() => { setShowFeedback(null); setPhase('aim'); setBalls([]); }, 1500);
          return { ...ball, active: false };
        }
        
        return { ...ball, x: newX, y: newY, vy: newVy, rotation: newRotation, scale: newScale };
      }).filter(ball => ball.active || ball.y > -20));
      
      animationRefs.current.physics = requestAnimationFrame(updatePhysics);
    };
    
    animationRefs.current.physics = requestAnimationFrame(updatePhysics);
    return () => { if (animationRefs.current.physics) cancelAnimationFrame(animationRefs.current.physics); };
  }, [gameState, tongueX, combo, maxCombo, saves, shots, score, createParticles, createFoam, saveGameSession]);

  const handlePhaseClick = () => {
    if (phase === 'aim') setPhase('power');
    else if (phase === 'power') shootBall();
  };

  const shootBall = () => {
    const speed = SPEED_MULTIPLIERS[selectedSpeed];
    const angleRad = (arrowAngle * Math.PI) / 180;
    
    // Calculate trajectory
    const startY = 86;
    const targetY = TARGET_LINE_Y;
    const distanceY = startY - targetY;
    
    // STRONG upward velocity to ensure ball reaches target
    const vy = -speed * 1.4; // Negative = going UP
    
    // Calculate time to reach target
    const timeToTarget = distanceY / Math.abs(vy);
    
    // vx calculation for horizontal movement
    // Use a wider angle spread for easier aiming
    const targetXOffset = Math.sin(angleRad) * 30; // Wider spread
    const vx = targetXOffset / timeToTarget;
    
    const newBall: Ball = {
      id: Math.random().toString(36).substr(2, 9),
      x: 50,
      y: startY,
      vx: vx,
      vy: vy,
      rotation: 0,
      active: true,
      scale: 1,
      stopped: false,
    };
    
    setBalls([newBall]);
    setShots(s => s + 1);
    setPhase('shooting');
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0); setGoals(0); setShots(0); setCombo(0); setMaxCombo(0); setSaves(0);
    setBalls([]); setParticles([]);
    setPhase('aim');
    setArrowAngle(0); setPowerLevel(50);
    setTongueSpeed(1.2); setTongueX(50);
    angleDirectionRef.current = 1; powerDirectionRef.current = 1; tongueDirectionRef.current = 1;
    setFairyMessage('Rotește săgeata și trage în poartă!');
    setShowFairy(true);
    setTimeout(() => setShowFairy(false), 3000);
  };

  const endGame = () => {
    setGameState(score >= 150 ? 'victory' : 'gameOver');
    saveGameSession({ gameId: 'tongue', score, duration: shots * 4, level: Math.floor(goals / 3) + 1 });
  };

  // Calculate trajectory line end point
  const getTrajectoryEnd = () => {
    const angleRad = (arrowAngle * Math.PI) / 180;
    const length = 42;
    return {
      x: 50 + Math.sin(angleRad) * length,
      y: 86 - Math.cos(angleRad) * length * 0.9,
    };
  };

  const trajEnd = getTrajectoryEnd();

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-sky-200 overflow-hidden">
        <div className="max-w-2xl mx-auto p-6 pt-8">
          <motion.button onClick={onBack} className="mb-6 flex items-center gap-2 text-sky-700 font-bold bg-white/90 backdrop-blur px-5 py-2.5 rounded-full shadow-lg"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </motion.button>
          
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="relative h-56 mb-6 bg-gradient-to-t from-blue-50 to-sky-100 rounded-3xl overflow-hidden shadow-inner border-2 border-sky-200">
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-44 h-28">
                <div className="absolute inset-0 bg-gradient-to-b from-pink-400 to-rose-500 rounded-t-full shadow-xl">
                  <div className="absolute inset-2 bg-gradient-to-b from-red-600 to-red-800 rounded-t-full" />
                </div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-5 h-6 bg-white rounded-b-md shadow" />
                  ))}
                </div>
                <div className="absolute bottom-2 left-2 right-2 h-1 bg-red-400 rounded-full" />
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-5 bg-pink-300 rounded-t-full" />
              </div>
              
              <motion.div className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                animate={{ rotate: [-30, 30, -30] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-4 h-20 bg-gradient-to-t from-yellow-500 to-orange-400 rounded-full relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0"
                    style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '16px solid #EF4444' }} />
                </div>
              </motion.div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-sky-600 mb-3">Gol în Gura<br/>Limbii</h1>
            <p className="text-lg text-sky-500 mb-4">Mingea urcă și se oprește la linie!<br/>Evită limba de 3 ori!</p>
            
            <motion.div className="bg-white/95 backdrop-blur rounded-3xl p-5 mb-6 shadow-xl border-2 border-sky-200"
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <h3 className="font-bold text-sky-700 mb-3 text-lg">Cum se joacă:</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-xl border-l-4 border-yellow-500">
                  <span className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">1</span>
                  <span className="text-gray-700">Rotește <b>săgeata</b> spre țintă</span>
                </div>
                <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-xl border-l-4 border-orange-500">
                  <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">2</span>
                  <span className="text-gray-700">Setează <b>puterea</b> și trage!</span>
                </div>
                <div className="flex items-center gap-3 bg-red-50 p-3 rounded-xl border-l-4 border-red-500">
                  <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">3</span>
                  <span className="text-gray-700"><b>3 apărări = Game Over</b></span>
                </div>
              </div>
            </motion.div>
            
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={startGame}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white text-2xl font-black px-14 py-5 rounded-full shadow-2xl">
              JOACĂ ACUM!
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-4xl font-black text-white mb-4">Joc Terminat!</h1>
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 mb-6">
            <p className="text-6xl font-black text-yellow-400">{score}</p>
            <p className="text-gray-400">puncte</p>
            <p className="text-gray-500 mt-2">{goals} goluri marcate</p>
            <p className="text-red-400 mt-1">{saves} apărări (max {MAX_SAVES})</p>
          </div>
          <div className="flex gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
              className="bg-green-500 text-white px-8 py-3 rounded-full font-bold">
              <RotateCcw className="w-5 h-5 inline mr-2" /> Încearcă Din Nou
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
              className="bg-gray-600 text-white px-8 py-3 rounded-full font-bold">Înapoi</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 via-orange-400 to-rose-400 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div key={i} className="absolute w-4 h-4 rounded-full"
            style={{ backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#7FFF00'][i % 4], left: `${Math.random() * 100}%` }}
            initial={{ y: -50 }} animate={{ y: window.innerHeight + 50, rotate: 360 }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
        ))}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-center">
            <motion.div className="text-8xl mb-4" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>🏆</motion.div>
            <h1 className="text-5xl font-black text-white mb-4">SUPER JUCĂTOR!</h1>
            <motion.div className="bg-white rounded-3xl p-8 shadow-2xl" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <p className="text-7xl font-black text-orange-500 mb-2">{score}</p>
              <p className="text-gray-500 mb-4">puncte</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-600">{goals}</p>
                  <p className="text-gray-600">Goluri</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-blue-600">{maxCombo}</p>
                  <p className="text-gray-600">Max Combo</p>
                </div>
              </div>
            </motion.div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={startGame}
              className="mt-8 bg-white text-orange-600 text-xl font-black px-12 py-4 rounded-full shadow-xl">Joacă Din Nou!</motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // MAIN GAME
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-50 to-sky-100 overflow-hidden relative">
      
      {/* Background bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-white/30"
            style={{ width: 12 + i * 6, height: 12 + i * 6, left: `${10 + i * 18}%`, bottom: -30 }}
            animate={{ y: -600, x: [0, 12, -12, 0] }}
            transition={{ duration: 12 + i * 2, repeat: Infinity, delay: i * 0.8 }} />
        ))}
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md p-3 shadow-lg z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <motion.div className="flex items-center gap-2 bg-yellow-100 px-3 py-2 rounded-full" whileHover={{ scale: 1.05 }}>
              <Trophy className="w-4 h-4 text-yellow-600" />
              <motion.span key={score} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-bold text-sm">{score}</motion.span>
            </motion.div>
            <div className="bg-sky-100 px-3 py-2 rounded-full font-bold text-sky-700 text-sm">{goals} GOL</div>
            <div className={`px-3 py-2 rounded-full font-bold flex items-center gap-1 text-sm ${saves >= 2 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-100 text-orange-700'}`}>
              <Shield className="w-4 h-4" />
              <span>{saves}/{MAX_SAVES}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Combo */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40">
            <motion.div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-2 rounded-full font-black text-xl shadow-xl flex items-center gap-2"
              animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <Zap className="w-5 h-5" /> COMBO x{combo}!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fairy */}
      <AnimatePresence>
        {showFairy && (
          <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="fixed top-32 left-4 z-40">
            <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-xs border-4 border-sky-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-300 to-sky-400 flex items-center justify-center"><Star className="w-6 h-6 text-white" /></div>
                <p className="text-gray-700 font-medium text-sm">{fairyMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <motion.div className={`text-center px-12 py-6 rounded-3xl shadow-2xl border-4 ${
              showFeedback.type === 'success' ? 'bg-gradient-to-r from-green-400 to-green-500 border-yellow-300' : 
              showFeedback.type === 'partial' ? 'bg-gradient-to-r from-blue-400 to-blue-500 border-white' :
              'bg-gradient-to-r from-red-400 to-red-500 border-gray-300'
            }`} animate={{ scale: [1, 1.15, 1] }}>
              <p className="text-5xl font-black text-white mb-2">{showFeedback.text}</p>
              {showFeedback.points > 0 && <p className="text-5xl font-black text-yellow-300">+{showFeedback.points}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particles */}
      {particles.map(p => (
        <motion.div key={p.id} className="absolute pointer-events-none z-30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          initial={{ scale: 1, opacity: p.life }} animate={{ scale: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
          {p.type === 'foam' ? (
            <div className="w-full h-full bg-white rounded-full opacity-80" style={{ filter: 'blur(2px)' }} />
          ) : (
            <div className="w-full h-full rounded-full" style={{ backgroundColor: p.color, boxShadow: `0 0 ${p.size}px ${p.color}` }} />
          )}
        </motion.div>
      ))}

      {/* GAME AREA */}
      <div className="pt-20 h-screen flex flex-col relative">
        
        {/* MOUTH - INVERTED SEMICIRCLE at top */}
        <div className="relative w-full flex justify-center pt-2" style={{ height: '28vh' }}>
          <div className="relative w-[60%] h-full">
            
            {/* 3D Upper Lip */}
            <div 
              className="absolute top-0 left-0 right-0 h-[82%] bg-gradient-to-b from-pink-300 via-pink-500 to-rose-500"
              style={{
                borderRadius: '50% 50% 0% 0% / 100% 100% 0% 0%',
                boxShadow: '0 10px 35px rgba(244, 63, 94, 0.35), inset 0 -5px 20px rgba(0,0,0,0.15), inset 0 10px 30px rgba(255,255,255,0.35)',
              }}
            >
              <div className="absolute top-4 left-1/4 right-1/4 h-6 bg-gradient-to-b from-pink-200 to-transparent rounded-full opacity-70" />
            </div>
            
            {/* Lower Lip */}
            <div 
              className="absolute bottom-[8%] left-[4%] right-[4%] h-[15%] bg-gradient-to-t from-rose-500 to-pink-400"
              style={{
                borderRadius: '0% 0% 50% 50% / 0% 0% 100% 100%',
                boxShadow: '0 4px 12px rgba(244, 63, 94, 0.25), inset 0 3px 10px rgba(255,255,255,0.2)',
              }}
            />
            
            {/* Inner mouth */}
            <div 
              className="absolute top-[6%] left-[5%] right-[5%] bottom-[14%] bg-gradient-to-b from-red-500 via-red-700 to-red-900"
              style={{
                borderRadius: '50% 50% 0% 0% / 100% 100% 0% 0%',
                boxShadow: 'inset 0 8px 25px rgba(0,0,0,0.4)',
              }}
            />
            
            {/* Teeth on curved top */}
            <div className="absolute top-[5%] left-1/2 transform -translate-x-1/2 flex items-end" style={{ width: '88%' }}>
              {[...Array(10)].map((_, i) => {
                const offset = Math.abs(i - 4.5) * 2;
                return (
                  <div key={i} className="flex-1 bg-gradient-to-b from-white to-gray-100 rounded-b-lg mx-0.5 relative"
                    style={{ height: `${26 - offset}px`, marginBottom: `${offset}px`, boxShadow: '0 3px 8px rgba(0,0,0,0.2)' }}>
                    <div className="absolute top-1 left-1 w-1 h-4 bg-white/90 rounded-full" />
                  </div>
                );
              })}
            </div>

            {/* Gums */}
            <div className="absolute top-[3%] left-1/2 transform -translate-x-1/2 w-[92%] h-4 bg-pink-300 rounded-t-full" />

            {/* TARGET LINE */}
            <div className="absolute bottom-[12%] left-[5%] right-[5%] h-2 bg-gradient-to-r from-red-400 via-red-500 to-red-400 rounded-full shadow-lg z-10" />

            {/* TONGUE - In front, SMALLER for easier scoring */}
            <motion.div className="absolute z-30" style={{ bottom: '10%', left: `${tongueX}%`, transform: 'translateX(-50%)' }}>
              <motion.div className="relative w-16 h-10">
                <div className="absolute inset-0 bg-gradient-to-b from-pink-300 to-rose-400 rounded-full"
                  style={{ borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.4)' }}>
                  <div className="absolute top-1/3 left-1/4 w-1.5 h-1 bg-rose-500/40 rounded-full" />
                  <div className="absolute top-1/3 right-1/4 w-1.5 h-1 bg-rose-500/40 rounded-full" />
                </div>
                <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                  <div className="w-3 h-3 bg-white rounded-full shadow relative"><div className="w-1 h-1 bg-gray-800 rounded-full absolute top-0.5 right-0.5" /></div>
                  <div className="w-3 h-3 bg-white rounded-full shadow relative"><div className="w-1 h-1 bg-gray-800 rounded-full absolute top-0.5 right-0.5" /></div>
                </div>
              </motion.div>
            </motion.div>

            {/* Happy reaction */}
            <motion.div className="absolute bottom-[25%] left-1/2 transform -translate-x-1/2 text-5xl"
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: showFeedback?.type === 'success' ? 1 : 0, scale: showFeedback?.type === 'success' ? 1 : 0 }}>
              😋
            </motion.div>
          </div>
        </div>

        {/* MIDDLE SPACE - Ball flight */}
        <div className="flex-1 relative">
          {/* Trajectory line */}
          {phase === 'aim' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#FBBF24" />
                </marker>
              </defs>
              <line x1="50%" y1="86%" x2={`${trajEnd.x}%`} y2={`${trajEnd.y}%`}
                stroke="#FBBF24" strokeWidth="4" strokeDasharray="10,5" strokeOpacity="0.75" markerEnd="url(#arrowhead)" />
            </svg>
          )}

          {/* Balls - go UP and get smaller */}
          <AnimatePresence>
            {balls.map(ball => (
              <motion.div key={ball.id} className="absolute z-30"
                style={{ 
                  left: `${ball.x}%`, 
                  top: `${ball.y}%`, 
                  transform: `translate(-50%, -50%) rotate(${ball.rotation}deg) scale(${ball.scale})`,
                }}
                initial={{ scale: 0 }} animate={{ scale: ball.scale }} exit={{ scale: 0 }}>
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-full shadow-xl border-2 border-blue-100"
                    style={{ background: 'radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0)', boxShadow: '0 0 20px rgba(255,255,255,0.9)' }}>
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-blue-300/60 transform -rotate-45" />
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-300/60 transform -rotate-45" />
                    </div>
                  </div>
                  <motion.div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full"
                    animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 0.3, repeat: Infinity }} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ARROW AT BOTTOM */}
        <div className="h-[30vh] relative flex items-center justify-center">
          <div className="relative">
            {phase !== 'shooting' && (
              <motion.div className="relative" animate={{ rotate: arrowAngle }} style={{ transformOrigin: 'center bottom' }}>
                <div className="w-8 h-44 bg-gradient-to-t from-yellow-500 via-orange-400 to-orange-300 rounded-full relative"
                  style={{ boxShadow: '0 0 35px rgba(251, 191, 36, 0.7), inset -2px 0 6px rgba(255,255,255,0.3)' }}>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2"
                    style={{ width: 0, height: 0, borderLeft: '18px solid transparent', borderRight: '18px solid transparent', borderBottom: '28px solid #EF4444', filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.9))' }} />
                </div>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-yellow-400/50 rounded-full blur-lg" />
              </motion.div>
            )}

            {phase === 'aim' && (
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="text-yellow-700 font-bold bg-yellow-100 px-4 py-1.5 rounded-full text-sm shadow">{Math.round(arrowAngle)}°</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLLER */}
        <div className="bg-white/98 backdrop-blur-lg p-4 pb-6 shadow-2xl border-t border-sky-200 z-50">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-center gap-2 mb-3">
              <motion.div className={`px-4 py-2 rounded-full text-sm font-bold ${phase === 'aim' ? 'bg-yellow-500 text-white shadow-lg' : phase === 'shooting' || phase === 'result' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                animate={phase === 'aim' ? { scale: [1, 1.05, 1] } : {}}>1. Țintește</motion.div>
              <motion.div className={`px-4 py-2 rounded-full text-sm font-bold ${phase === 'power' ? 'bg-orange-500 text-white shadow-lg' : phase === 'shooting' || phase === 'result' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                animate={phase === 'power' ? { scale: [1, 1.05, 1] } : {}}>2. Putere</motion.div>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              {phase === 'aim' && (
                <motion.button onClick={handlePhaseClick} className="flex items-center gap-4 bg-yellow-50 rounded-2xl p-4 w-full border-2 border-yellow-300"
                  whileHover={{ scale: 1.02, borderColor: '#FBBF24' }} whileTap={{ scale: 0.98 }}>
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-inner border-2 border-yellow-200">
                    <motion.div className="w-4 h-16 bg-yellow-500 rounded-full relative" animate={{ rotate: [-25, 25, -25] }} transition={{ duration: 1, repeat: Infinity }}>
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0" style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '12px solid #EF4444' }} />
                    </motion.div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-yellow-800 text-lg">Rotește săgeata</p>
                    <p className="text-yellow-600 text-sm">Țintește spre linia roșie</p>
                    <p className="text-yellow-500 text-xs mt-1">Unghi: {Math.round(arrowAngle)}°</p>
                  </div>
                  <ChevronRight className="w-8 h-8 text-yellow-500" />
                </motion.button>
              )}
              
              {phase === 'power' && (
                <motion.button onClick={handlePhaseClick} className="flex items-center gap-4 bg-orange-50 rounded-2xl p-4 w-full border-2 border-orange-300"
                  whileHover={{ scale: 1.02, borderColor: '#F97316' }} whileTap={{ scale: 0.98 }}>
                  <div className="w-16 h-24 bg-white rounded-xl flex items-center justify-center shadow-inner border-2 border-orange-200 relative overflow-hidden">
                    <div className="absolute inset-2 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-green-400 via-yellow-400 to-red-500" />
                    </div>
                    <motion.div className="absolute left-1 right-1 h-2.5 bg-black rounded-full shadow-lg z-10" animate={{ bottom: `${powerLevel}%` }} style={{ boxShadow: '0 0 10px rgba(0,0,0,0.6)' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-orange-800 text-lg">{SPEED_NAMES[selectedSpeed]}</p>
                    <p className="text-orange-600 text-sm">Oprește pentru viteză</p>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div key={level} className={`w-8 h-3 rounded-full transition-all ${level <= selectedSpeed ? level <= 2 ? 'bg-green-500' : level === 3 ? 'bg-yellow-500' : level === 4 ? 'bg-orange-500' : 'bg-red-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"><Target className="w-7 h-7 text-white" /></div>
                </motion.button>
              )}
              
              {(phase === 'shooting' || phase === 'result') && (
                <div className="flex items-center gap-4 bg-gray-100 rounded-2xl p-4 w-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <div className="w-6 h-6 bg-white rounded-full" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-700 text-lg">Mingea urcă...</p>
                    <p className="text-gray-500 text-sm">Se oprește la linie!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={endGame}
        className="fixed top-20 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-full text-gray-600 text-sm font-medium shadow-lg z-50 border border-gray-200">Termină</motion.button>
    </div>
  );
}
