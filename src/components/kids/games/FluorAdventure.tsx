import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Zap, Trophy, RotateCcw } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';

interface Player {
  x: number;
  y: number;
  vy: number;
  isJumping: boolean;
  invincible: boolean;
  scaleY: number;
  rotation: number;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  type: 'candy' | 'bacteria' | 'pit' | 'flying-candy';
  width: number;
  height: number;
  rotation: number;
}

interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'toothbrush' | 'paste' | 'coin';
  collected: boolean;
  floatOffset: number;
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
}

const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const GROUND_Y = 65;

export function FluorAdventure({ onBack }: { onBack: () => void }) {
  const { saveGameSession } = useGameProgress();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'gameOver' | 'victory'>('intro');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [distance, setDistance] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [invincibleTime, setInvincibleTime] = useState(0);
  
  const [player, setPlayer] = useState<Player>({ 
    x: 15, 
    y: GROUND_Y, 
    vy: 0, 
    isJumping: false, 
    invincible: false,
    scaleY: 1,
    rotation: 0,
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  const [showFairy, setShowFairy] = useState(true);
  const [fairyMessage, setFairyMessage] = useState('Ajuțilă pe Fluor să salveze Orașul Dinților!');
  const [screenShake, setScreenShake] = useState(0);
  
  const gameLoopRef = useRef<number>();
  const lastSpawnRef = useRef(0);
  const particleIdRef = useRef(0);
  const startTimeRef = useRef(0);
  const speedRef = useRef(2.5);
  const levelRef = useRef(1);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  // Sync refs with state for game loop access
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { collectiblesRef.current = collectibles; }, [collectibles]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 5,
        color,
        size: Math.random() * 8 + 4,
        life: 1,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Update particles
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.4, life: p.life - 0.025 }))
        .filter(p => p.life > 0)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [particles.length]);

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    setDistance(0);
    setGameTime(0);
    setPlayer({ x: 15, y: GROUND_Y, vy: 0, isJumping: false, invincible: false, scaleY: 1, rotation: 0 });
    setObstacles([]);
    setCollectibles([]);
    setParticles([]);
    setBackgroundOffset(0);
    startTimeRef.current = Date.now();
    // Reset all refs
    speedRef.current = 2.5;
    levelRef.current = 1;
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    setFairyMessage('Apasă SPACE sau atinge pentru săritură! Așteaptă să aterizezi!');
    setShowFairy(true);
    setTimeout(() => setShowFairy(false), 3000);
  };

  // Jump - only allowed when on ground (not jumping)
  const jump = useCallback(() => {
    if (!player.isJumping && gameState === 'playing') {
      setPlayer(p => ({ ...p, vy: JUMP_FORCE, isJumping: true, scaleY: 1.3 }));
      createParticles(player.x, player.y + 5, '#4FC3F7', 8);
      if (navigator.vibrate) navigator.vibrate(40);
    }
    // No double jump - player must land first
  }, [player.isJumping, player.x, player.y, gameState, createParticles]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      setGameTime(elapsed);
      
      // Level progression - speed only increases when level changes
      if (elapsed > 30 && levelRef.current === 1) {
        levelRef.current = 2;
        speedRef.current = 3.3; // Level 2 speed
        setLevel(2);
        setFairyMessage('Nivelul 2! Viteza crește!');
        setShowFairy(true);
        setTimeout(() => setShowFairy(false), 2500);
      } else if (elapsed > 60 && levelRef.current === 2) {
        levelRef.current = 3;
        speedRef.current = 4.1; // Level 3 speed
        setLevel(3);
        setFairyMessage('Nivelul 3! Finalul!');
        setShowFairy(true);
        setTimeout(() => setShowFairy(false), 2500);
      } else if (elapsed > 90) {
        setGameState('victory');
        saveGameSession({ gameId: 'fluor', score: scoreRef.current + livesRef.current * 100, duration: elapsed, level: 3 });
        return;
      }

      // Spawn obstacles - spawn rate based on level ref
      const spawnRate = Math.max(1500, 2500 - levelRef.current * 400);
      if (now - lastSpawnRef.current > spawnRate) {
        lastSpawnRef.current = now;
        const types: Obstacle['type'][] = ['candy', 'bacteria', 'candy', 'flying-candy'];
        if (level >= 2) types.push('pit');
        
        const type = types[Math.floor(Math.random() * types.length)];
        // All obstacles at player path level for guaranteed collision
        const newObstacle: Obstacle = {
          id: Math.random().toString(36).substr(2, 9),
          x: 110,
          y: GROUND_Y, // All at player level
          type,
          width: 10,
          height: 10,
          rotation: 0,
        };
        setObstacles(prev => [...prev.slice(-6), newObstacle]);
        // Also update ref immediately for collision detection
        obstaclesRef.current = [...obstaclesRef.current.slice(-6), newObstacle];
        
        // Spawn collectible
        if (Math.random() > 0.4) {
          const types: Collectible['type'][] = ['coin', 'coin', 'toothbrush', 'paste'];
          const type = types[Math.floor(Math.random() * types.length)];
          setCollectibles(prev => [...prev.slice(-5), {
            id: Math.random().toString(36).substr(2, 9),
            x: 110,
            y: GROUND_Y - 20 - Math.random() * 20,
            type,
            collected: false,
            floatOffset: Math.random() * Math.PI * 2,
          }]);
        }
      }

      // Use constant speed from ref - only changes when level changes
      const speed = speedRef.current;
      setDistance(d => d + speed * 0.05);
      setBackgroundOffset(o => (o + speed * 0.02) % 100);

      // Player physics
      setPlayer(p => {
        let newY = p.y + p.vy;
        let newVy = p.vy + GRAVITY;
        let isJumping = true;
        let scaleY = p.scaleY;
        let rotation = p.rotation;

        if (newY >= GROUND_Y) {
          newY = GROUND_Y;
          newVy = 0;
          isJumping = false;
          scaleY = 1;
          rotation = 0;
        } else {
          scaleY = Math.max(0.8, 1 - Math.abs(newVy) * 0.02);
          rotation = newVy * 2;
        }

        return { ...p, y: newY, vy: newVy, isJumping, scaleY, rotation };
      });

      // Move obstacles - update ref immediately for collision detection
      const updatedObstacles = obstaclesRef.current.map(o => ({
        ...o,
        x: o.x - speed,
        rotation: o.rotation + 2,
        y: o.type === 'flying-candy' ? o.y + Math.sin(now / 300) * 0.5 : o.y,
      })).filter(o => o.x > -20);
      obstaclesRef.current = updatedObstacles;
      setObstacles(updatedObstacles);

      // Move collectibles - update ref immediately
      const updatedCollectibles = collectiblesRef.current.map(c => ({
        ...c,
        x: c.x - speed,
      })).filter(c => c.x > -10 && !c.collected);
      collectiblesRef.current = updatedCollectibles;
      setCollectibles(updatedCollectibles);

      // Collision detection - SIMPLE: check if obstacle overlaps with player
      // Player is at fixed x=15%, y=GROUND_Y with size ~5%
      // Obstacles move from right to left
      obstaclesRef.current.forEach(obs => {
        // Simple box collision - player is roughly at x=15, y=GROUND_Y
        // Player width ~5%, height ~8%
        const playerLeft = player.x - 3;
        const playerRight = player.x + 3;
        const playerTop = player.y - 4;
        const playerBottom = player.y + 4;
        
        const obsLeft = obs.x - 4;
        const obsRight = obs.x + 4;
        const obsTop = obs.y - 4;
        const obsBottom = obs.y + 4;
        
        // Check if boxes overlap
        const collideX = playerLeft < obsRight && playerRight > obsLeft;
        const collideY = playerTop < obsBottom && playerBottom > obsTop;
        
        if (collideX && collideY && !player.invincible) {
          setLives(l => {
            const newLives = l - 1;
            livesRef.current = newLives;
            setPlayer(p => ({ ...p, invincible: true, scaleY: 0.8 }));
            setInvincibleTime(3);
            setScreenShake(10);
            createParticles(player.x, player.y, '#EF5350', 20);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            
            if (newLives <= 0) {
              setGameState('gameOver');
              saveGameSession({ gameId: 'fluor', score: scoreRef.current, duration: elapsed, level: levelRef.current });
            } else {
              setFairyMessage(`Ai! Mai ai ${newLives} vieți!`);
              setShowFairy(true);
              setTimeout(() => setShowFairy(false), 2000);
            }
            return newLives;
          });
        }
      });

      // Collectible collision - use refs for latest values
      collectiblesRef.current.forEach(col => {
        if (!col.collected) {
          const dx = col.x - player.x;
          const dy = col.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 12) {
            // Update both state and ref
            const updatedCols = collectiblesRef.current.map(c => c.id === col.id ? { ...c, collected: true } : c);
            collectiblesRef.current = updatedCols;
            setCollectibles(updatedCols);
            
            if (col.type === 'coin') {
              setScore(s => { scoreRef.current = s + 10; return s + 10; });
              createParticles(col.x, col.y, '#FFD700', 8);
            } else if (col.type === 'toothbrush') {
              setScore(s => { scoreRef.current = s + 50; return s + 50; });
              createParticles(col.x, col.y, '#4FC3F7', 15);
              setFairyMessage('+50 Periuță!');
              setShowFairy(true);
              setTimeout(() => setShowFairy(false), 1500);
            } else if (col.type === 'paste') {
              setPlayer(p => ({ ...p, invincible: true }));
              setInvincibleTime(5);
              createParticles(col.x, col.y, '#FFFFFF', 20);
              setFairyMessage('⭐ Invincibilitate! ⭐');
              setShowFairy(true);
              setTimeout(() => setShowFairy(false), 2000);
            }
          }
        }
      });

      // Screen shake decay
      setScreenShake(s => Math.max(0, s - 1));

      // Invincibility
      if (invincibleTime > 0) {
        setInvincibleTime(t => t - 0.016);
      } else if (player.invincible) {
        setPlayer(p => ({ ...p, invincible: false }));
      }

      setScore(s => s + 1);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, player.invincible, createParticles, saveGameSession]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
        <div className="max-w-2xl mx-auto p-6 pt-8">
          <motion.button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-white/80 font-medium"
            whileHover={{ scale: 1.05 }}
          >
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </motion.button>
          
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <motion.div 
              className="text-8xl mb-6"
              animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💧
            </motion.div>
            <h1 className="text-5xl font-black text-white mb-4">Aventura lui Fluor</h1>
            <p className="text-blue-200 mb-8">Ajuțilă pe Fluor să salveze Orașul Dinților!</p>
            
            <motion.div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-8">
              <div className="grid grid-cols-3 gap-4 text-center text-white">
                <div>
                  <div className="text-4xl mb-2">🍬</div>
                  <p className="text-sm">Evită dulciurile</p>
                </div>
                <div>
                  <div className="text-4xl mb-2">🦠</div>
                  <p className="text-sm">Ferește-te de bacterii</p>
                </div>
                <div>
                  <div className="text-4xl mb-2">🪥</div>
                  <p className="text-sm">Colectează periuțe</p>
                </div>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white text-2xl font-black px-16 py-5 rounded-full shadow-2xl"
            >
              🎮 ÎNCEPE AVENTURA!
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
          <motion.div className="text-8xl mb-6" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
            💧😵
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-4">Joc Terminat!</h1>
          <div className="bg-white/10 rounded-3xl p-8 mb-6">
            <p className="text-6xl font-black text-cyan-400 mb-2">{score}</p>
            <p className="text-gray-400">puncte</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} onClick={startGame} className="bg-cyan-500 text-white px-8 py-3 rounded-full font-bold">
            <RotateCcw className="w-5 h-5 inline mr-2" /> Încearcă Din Nou
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-500 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div key={i} className="absolute text-4xl" initial={{ y: -50, x: Math.random() * window.innerWidth }} animate={{ y: window.innerHeight + 50 }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}>
            {['🎉', '🎊', '⭐', '🏆'][i % 4]}
          </motion.div>
        ))}
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
            <motion.div className="text-9xl mb-6" animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity }}>
              👑
            </motion.div>
            <h1 className="text-5xl font-black text-white mb-4">VICTORIE!</h1>
            <div className="bg-white rounded-3xl p-8">
              <p className="text-6xl font-black text-orange-500">{score + lives * 100}</p>
              <p className="text-gray-500">puncte finale</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen overflow-hidden relative"
      style={{ transform: `translate(${screenShake * (Math.random() - 0.5)}px, ${screenShake * (Math.random() - 0.5)}px)` }}
      onClick={jump}
    >
      {/* SEAMLESS BACKGROUND - Sky gradient top ~65%, Ground bottom ~35% */}
      <div className="absolute inset-0">
        {/* Sky gradient from deep blue to light blue */}
        <div className="absolute inset-x-0 top-0 h-[65%] bg-gradient-to-b from-blue-500 via-blue-300 to-blue-100" />
        
        {/* Ground gradient - green area */}
        <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-b from-green-400 to-green-500" />
        
        {/* Soft clouds in sky */}
        <div className="absolute inset-0" style={{ transform: `translateX(-${backgroundOffset * 0.2}%)` }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute bg-white/40 rounded-full blur-xl" 
              style={{ 
                width: `${120 + i * 30}px`, 
                height: `${40 + i * 10}px`, 
                top: `${10 + (i % 3) * 15}%`, 
                left: `${i * 25}%` 
              }} 
            />
          ))}
        </div>
        
        {/* Distant teeth silhouettes on horizon */}
        <div className="absolute top-[55%] left-0 right-0 h-20 flex items-end opacity-20" style={{ transform: `translateX(-${backgroundOffset * 0.3}%)` }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="text-6xl text-white mx-4">🦷</div>
          ))}
        </div>
      </div>

      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-40">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="text-white p-2 hover:bg-white/20 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <motion.div className="flex items-center gap-2 bg-yellow-400/90 px-4 py-2 rounded-full" whileHover={{ scale: 1.05 }}>
              <Trophy className="w-5 h-5 text-yellow-800" />
              <span className="font-black text-yellow-900">{score}</span>
            </motion.div>
            
            <div className="flex items-center gap-1 bg-red-500/90 px-4 py-2 rounded-full">
              {[...Array(3)].map((_, i) => (
                <motion.div key={i} animate={{ scale: i < lives ? 1 : 0.5, opacity: i < lives ? 1 : 0.3 }}>
                  <Heart className="w-5 h-5 text-white fill-white" />
                </motion.div>
              ))}
            </div>
            
            {invincibleTime > 0 && (
              <motion.div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1">
                <Zap className="w-4 h-4" />
                {Math.ceil(invincibleTime)}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Fairy */}
      <AnimatePresence>
        {showFairy && (
          <motion.div initial={{ x: -200 }} animate={{ x: 0 }} exit={{ x: -200 }} className="fixed top-24 left-4 z-30">
            <div className="bg-white rounded-2xl p-4 shadow-2xl border-4 border-blue-300">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🧚‍♀️</span>
                <p className="text-gray-700 font-bold">{fairyMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level indicator */}
      <div className="fixed top-20 right-4 z-30">
        <motion.div 
          className="bg-blue-600 text-white px-4 py-2 rounded-full font-black shadow-lg"
          key={level}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
        >
          Nivel {level}
        </motion.div>
      </div>

      {/* Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none z-20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          initial={{ scale: 1, opacity: p.life }}
          animate={{ scale: 0, opacity: 0 }}
        >
          <div className="w-full h-full rounded-full" style={{ backgroundColor: p.color, boxShadow: `0 0 ${p.size}px ${p.color}` }} />
        </motion.div>
      ))}

      {/* Horizon line indicator - subtle glow where player runs */}
      <div className="absolute left-0 right-0 h-1 bg-white/20" style={{ top: `${GROUND_Y}%` }} />

      {/* Obstacles */}
      <AnimatePresence>
        {obstacles.map(obs => (
          <motion.div
            key={obs.id}
            initial={{ x: '110vw' }}
            animate={{ x: `${obs.x}vw` }}
            exit={{ opacity: 0 }}
            className="absolute z-10"
            style={{ top: `${obs.y}%`, transform: `rotate(${obs.rotation}deg)` }}
          >
            {obs.type === 'candy' && (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <span className="text-6xl filter drop-shadow-lg">🍬</span>
              </motion.div>
            )}
            {obs.type === 'flying-candy' && (
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                <span className="text-5xl">🍭</span>
              </motion.div>
            )}
            {obs.type === 'bacteria' && (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <span className="text-5xl">🦠</span>
              </motion.div>
            )}
            {obs.type === 'pit' && (
              <div className="w-16 h-16 bg-gray-900 rounded-full shadow-inner border-4 border-gray-700">
                <div className="absolute inset-2 bg-black rounded-full" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Collectibles */}
      {collectibles.filter(c => !c.collected).map(col => (
        <motion.div
          key={col.id}
          className="absolute z-10"
          style={{ left: `${col.x}%`, top: `${col.y}%` }}
          animate={{ y: [0, -8, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl filter drop-shadow-lg">
            {col.type === 'coin' && '🪙'}
            {col.type === 'toothbrush' && '🪥'}
            {col.type === 'paste' && '🧴'}
          </span>
          <motion.div 
            className="absolute -inset-2 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ backgroundColor: col.type === 'paste' ? '#FFD700' : 'transparent' }}
          />
        </motion.div>
      ))}

      {/* Player - Fluor */}
      <motion.div
        className="absolute z-20"
        style={{ left: `${player.x}%`, top: `${player.y}%`, transform: `translate(-50%, -50%)` }}
        animate={{ 
          scaleY: player.scaleY,
          rotate: player.rotation,
          opacity: player.invincible ? [1, 0.5, 1] : 1,
        }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="relative">
          {/* Glow when invincible */}
          {player.invincible && (
            <motion.div 
              className="absolute -inset-8 bg-yellow-400/30 rounded-full blur-xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
          
          {/* Fluor body */}
          <motion.div 
            className="w-16 h-20 relative"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #81D4FA, #29B6F6, #0288D1)',
              borderRadius: '50% 50% 45% 45%',
              boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.3)',
            }}
          >
            {/* Face */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <div className="w-3 h-3 bg-white rounded-full">
                <div className="w-1.5 h-1.5 bg-black rounded-full absolute top-1 right-0.5" />
              </div>
              <div className="w-3 h-3 bg-white rounded-full">
                <div className="w-1.5 h-1.5 bg-black rounded-full absolute top-1 right-0.5" />
              </div>
            </div>
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-white rounded-full" />
            
            {/* Shine effect */}
            <div className="absolute top-2 left-3 w-4 h-3 bg-white/40 rounded-full" />
          </motion.div>
          
          {/* Arms */}
          <motion.div 
            className="absolute top-6 -left-3 w-4 h-8 bg-blue-400 rounded-full origin-top"
            animate={{ rotate: player.isJumping ? -30 : [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: !player.isJumping ? Infinity : 0 }}
          />
          <motion.div 
            className="absolute top-6 -right-3 w-4 h-8 bg-blue-400 rounded-full origin-top"
            animate={{ rotate: player.isJumping ? 30 : [0, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: !player.isJumping ? Infinity : 0 }}
          />
          
          {/* Legs */}
          <motion.div 
            className="absolute -bottom-4 left-2 w-4 h-6 bg-blue-400 rounded-full origin-top"
            animate={{ rotate: player.isJumping ? -20 : [0, 20, 0] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-4 right-2 w-4 h-6 bg-blue-400 rounded-full origin-top"
            animate={{ rotate: player.isJumping ? 20 : [0, -20, 0] }}
            transition={{ duration: 0.3, repeat: Infinity, delay: 0.15 }}
          />
        </div>
      </motion.div>

      {/* Instructions */}
      <div className="fixed bottom-4 left-0 right-0 text-center z-30 pointer-events-none">
        <p className="text-gray-600 font-bold bg-white/80 inline-block px-6 py-2 rounded-full shadow-lg">
          Apasă sau atinge pentru săritură!
        </p>
      </div>
    </motion.div>
  );
}
