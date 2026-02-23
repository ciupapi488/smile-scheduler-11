import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, Music, Heart, Target } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';

interface Tower {
  id: string;
  x: number;
  y: number;
  type: 'brush' | 'floss' | 'paste' | 'fluor';
  lastShot: number;
  rotation: number;
}

interface Bacterium {
  id: string;
  x: number;
  y: number;
  lane: number;
  hp: number;
  maxHp: number;
  type: 'normal' | 'fast' | 'flying' | 'boss';
  frozen: boolean;
  scale: number;
  rotation: number;
}

interface RhythmNote {
  id: string;
  lane: number;
  y: number;
  hit: boolean;
  perfect: boolean;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  type: string;
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
}

const TOWER_TYPES = {
  brush: { name: 'Periuță', emoji: '🪥', cost: 50, damage: 15, speed: 400, range: 25, color: 'from-blue-400 to-blue-600' },
  floss: { name: 'Ață', emoji: '🧵', cost: 100, damage: 35, speed: 800, range: 35, color: 'from-green-400 to-green-600' },
  paste: { name: 'Pastă', emoji: '🧴', cost: 150, damage: 50, speed: 1200, range: 30, color: 'from-purple-400 to-purple-600' },
  fluor: { name: 'Fluor', emoji: '💧', cost: 300, damage: 120, speed: 1500, range: 45, color: 'from-yellow-400 to-yellow-600' },
};

const LANES = [18, 38, 58, 78, 98];

export function BacteriaWars({ onBack }: { onBack: () => void }) {
  const { saveGameSession } = useGameProgress();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameOver' | 'victory'>('intro');
  const [wave, setWave] = useState(1);
  const [energy, setEnergy] = useState(200);
  const [score, setScore] = useState(0);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [bacterias, setBacterias] = useState<Bacterium[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [rhythmNotes, setRhythmNotes] = useState<RhythmNote[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [selectedTower, setSelectedTower] = useState<keyof typeof TOWER_TYPES | null>(null);
  const [toothHealth, setToothHealth] = useState(100);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showFairy, setShowFairy] = useState(true);
  const [fairyMessage, setFairyMessage] = useState('Apară dintele de bacterii! Plasează turnuri și apasă pe ritm!');
  const [screenShake, setScreenShake] = useState(0);
  const [bossWarning, setBossWarning] = useState(false);
  
  const gameLoopRef = useRef<number>();
  const lastSpawnRef = useRef(0);
  const rhythmIntervalRef = useRef<NodeJS.Timeout>();
  const particleIdRef = useRef(0);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 3,
        color,
        size: Math.random() * 6 + 3,
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
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 0.025 }))
        .filter(p => p.life > 0)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [particles.length]);

  // Spawn bacteria
  const spawnBacteria = useCallback(() => {
    const now = Date.now();
    const spawnRate = Math.max(800, 2000 - wave * 100);
    
    if (now - lastSpawnRef.current > spawnRate) {
      lastSpawnRef.current = now;
      
      const types: Bacterium['type'][] = ['normal'];
      if (wave >= 2) types.push('fast');
      if (wave >= 3) types.push('flying');
      if (wave % 5 === 0 && wave >= 5) {
        types.push('boss');
        setBossWarning(true);
        setTimeout(() => setBossWarning(false), 3000);
      }
      
      const type = types[Math.floor(Math.random() * types.length)];
      const lane = Math.floor(Math.random() * LANES.length);
      
      const newBacterium: Bacterium = {
        id: Math.random().toString(36).substr(2, 9),
        x: 105,
        y: LANES[lane],
        lane,
        hp: type === 'boss' ? 800 : type === 'fast' ? 40 : 70,
        maxHp: type === 'boss' ? 800 : type === 'fast' ? 40 : 70,
        type,
        frozen: false,
        scale: 0,
        rotation: 0,
      };
      
      setBacterias(prev => [...prev, newBacterium]);
    }
  }, [wave]);

  // Rhythm game
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const bpm = 100 + wave * 3;
    const interval = 60000 / bpm;
    
    rhythmIntervalRef.current = setInterval(() => {
      const lane = Math.floor(Math.random() * 4);
      setRhythmNotes(prev => [...prev.slice(-8), {
        id: Math.random().toString(36).substr(2, 9),
        lane,
        y: 0,
        hit: false,
        perfect: false,
      }]);
    }, interval);
    
    return () => {
      if (rhythmIntervalRef.current) clearInterval(rhythmIntervalRef.current);
    };
  }, [gameState, wave]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      spawnBacteria();
      
      // Animate bacteria entry
      setBacterias(prev => prev.map(b => ({
        ...b,
        scale: Math.min(1, b.scale + 0.05),
        rotation: b.rotation + (b.type === 'fast' ? 10 : 5),
      })));

      // Move bacteria
      setBacterias(prev => prev.map(b => {
        const speed = b.type === 'fast' ? 0.6 : b.type === 'boss' ? 0.25 : 0.4;
        const newX = b.x - speed * (1 + wave * 0.08);
        
        if (newX <= 5) {
          setToothHealth(h => {
            const damage = b.type === 'boss' ? 25 : 10;
            const newHealth = h - damage;
            setScreenShake(15);
            if (navigator.vibrate) navigator.vibrate(200);
            
            if (newHealth <= 0) {
              setGameState('gameOver');
              saveGameSession({ gameId: 'bacteria', score, duration: wave * 25, level: wave });
            }
            return Math.max(0, newHealth);
          });
          return null;
        }
        
        return { ...b, x: newX };
      }).filter(Boolean) as Bacterium[]);

      // Move rhythm notes
      setRhythmNotes(prev => prev.map(n => ({ ...n, y: n.y + 1.8 })).filter(n => n.y < 100 && !n.hit));

      // Tower shooting
      const now = Date.now();
      setTowers(prev => prev.map(tower => {
        const towerType = TOWER_TYPES[tower.type];
        if (now - tower.lastShot < towerType.speed) return { ...tower, rotation: tower.rotation + 2 };
        
        const target = bacterias.find(b => {
          const dist = Math.sqrt(Math.pow(b.x - tower.x, 2) + Math.pow(b.y - tower.y, 2));
          return dist < towerType.range && b.type !== 'flying';
        });
        
        if (target) {
          const angle = Math.atan2(target.y - tower.y, target.x - tower.x) * (180 / Math.PI);
          setProjectiles(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            type: tower.type,
            rotation: angle,
          }]);
          return { ...tower, lastShot: now, rotation: angle };
        }
        
        return { ...tower, rotation: tower.rotation + 2 };
      }));

      // Move projectiles
      setProjectiles(prev => prev.map(p => {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 4;
        
        if (dist < speed) {
          setBacterias(prevB => prevB.map(b => {
            if (Math.abs(b.x - p.targetX) < 6 && Math.abs(b.y - p.targetY) < 6) {
              const damage = TOWER_TYPES[p.type as keyof typeof TOWER_TYPES].damage * (1 + combo * 0.05);
              const newHp = b.hp - damage;
              
              if (newHp <= 0) {
                setEnergy(e => Math.min(500, e + 15));
                setScore(s => s + (b.type === 'boss' ? 200 : 30));
                createParticles(b.x, b.y, b.type === 'boss' ? '#FF4444' : '#66BB6A', b.type === 'boss' ? 30 : 15);
                if (navigator.vibrate) navigator.vibrate(50);
                return null;
              }
              
              createParticles(b.x, b.y, '#FFFFFF', 5);
              return { ...b, hp: newHp, scale: 0.9 };
            }
            return b;
          }).filter(Boolean) as Bacterium[]);
          return null;
        }
        
        return {
          ...p,
          x: p.x + (dx / dist) * speed,
          y: p.y + (dy / dist) * speed,
        };
      }).filter(Boolean) as Projectile[]);

      // Energy regeneration
      setEnergy(e => Math.min(500, e + 0.3));
      
      // Wave progression
      if (score > wave * 400) {
        setWave(w => {
          const newWave = w + 1;
          setFairyMessage(`Valul ${newWave}! ${newWave === 20 ? 'BOSS FINAL!' : 'Pregătește-te!'}`);
          setShowFairy(true);
          setTimeout(() => setShowFairy(false), 3000);
          
          if (newWave === 20) {
            setTimeout(() => {
              setGameState('victory');
              saveGameSession({ gameId: 'bacteria', score, duration: newWave * 25, level: 20 });
            }, 30000);
          }
          return newWave;
        });
      }

      // Screen shake decay
      setScreenShake(s => Math.max(0, s - 1));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, wave, bacterias, combo, score, spawnBacteria, saveGameSession, createParticles]);

  const placeTower = (laneIndex: number) => {
    if (!selectedTower || energy < TOWER_TYPES[selectedTower].cost) return;
    
    setEnergy(e => e - TOWER_TYPES[selectedTower].cost);
    setTowers(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      x: 15,
      y: LANES[laneIndex],
      type: selectedTower,
      lastShot: 0,
      rotation: 0,
    }]);
    setSelectedTower(null);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const hitRhythmNote = (lane: number) => {
    const note = rhythmNotes.find(n => n.lane === lane && n.y > 75 && n.y < 92 && !n.hit);
    if (note) {
      const isPerfect = note.y > 82 && note.y < 88;
      setRhythmNotes(prev => prev.map(n => n.id === note.id ? { ...n, hit: true, perfect: isPerfect } : n));
      setCombo(c => {
        const newCombo = c + 1;
        if (newCombo > maxCombo) setMaxCombo(newCombo);
        return newCombo;
      });
      setScore(s => s + (isPerfect ? 20 : 10) * (1 + combo * 0.1));
      setEnergy(e => e + (isPerfect ? 10 : 5));
      createParticles(20 + lane * 20, 85, isPerfect ? '#FFD700' : '#4FC3F7', isPerfect ? 10 : 5);
      if (navigator.vibrate) navigator.vibrate(isPerfect ? [50, 20, 50] : 30);
    } else {
      setCombo(0);
    }
  };

  const startGame = () => {
    setGameState('playing');
    setWave(1);
    setEnergy(200);
    setScore(0);
    setTowers([]);
    setBacterias([]);
    setProjectiles([]);
    setRhythmNotes([]);
    setCombo(0);
    setMaxCombo(0);
    setToothHealth(100);
    setParticles([]);
  };

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-orange-900 overflow-hidden">
        <div className="max-w-2xl mx-auto p-6 pt-8">
          <motion.button onClick={onBack} className="mb-6 text-white/80 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </motion.button>
          
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <motion.div className="text-8xl mb-6" animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              ⚔️🦷🦠
            </motion.div>
            <h1 className="text-5xl font-black text-white mb-4">Războiul Bacteriilor</h1>
            <p className="text-red-200 mb-8">Apară dintele de armatele de bacterii până la valul 20!</p>
            
            <motion.div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-white text-sm">
                <div className="flex items-center gap-2"><span className="text-2xl">🪥</span> Turn Periuță (rapid)</div>
                <div className="flex items-center gap-2"><span className="text-2xl">🧵</span> Turn Ață (dist lungă)</div>
                <div className="flex items-center gap-2"><span className="text-2xl">🧴</span> Turn Pastă (area)</div>
                <div className="flex items-center gap-2"><span className="text-2xl">💧</span> Turn Fluor (puternic)</div>
              </div>
            </motion.div>
            
            <motion.div className="bg-yellow-400/20 rounded-2xl p-4 mb-8 border-2 border-yellow-400">
              <p className="text-yellow-300 font-bold text-lg">🏆 Provocare: Valul 20</p>
              <p className="text-white/80 text-sm">Doar 5% din jucători reușesc!</p>
            </motion.div>
            
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={startGame} className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-2xl font-black px-16 py-5 rounded-full shadow-2xl">
              🎮 ÎNCEPE BĂTĂLIA!
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
          <motion.div className="text-8xl mb-6" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
            🦷💀
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-4">Dintele a Căzut!</h1>
          <div className="bg-white/10 rounded-3xl p-8 mb-6">
            <p className="text-6xl font-black text-red-500 mb-2">Valul {wave}</p>
            <p className="text-gray-400">Maxim atins</p>
            <p className="text-3xl font-bold text-white mt-4">{score} puncte</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} onClick={startGame} className="bg-red-500 text-white px-8 py-3 rounded-full font-bold">
            Încearcă Din Nou
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 via-orange-500 to-red-500 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div key={i} className="absolute text-4xl" initial={{ y: -50, x: Math.random() * window.innerWidth }} animate={{ y: window.innerHeight + 50, rotate: 360 }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}>
            {['👑', '🏆', '⭐', '🎉', '🎊'][i % 5]}
          </motion.div>
        ))}
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
            <motion.div className="text-9xl mb-6" animate={{ scale: [1, 1.3, 1], rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity }}>
              👑
            </motion.div>
            <h1 className="text-6xl font-black text-white mb-4 drop-shadow-lg">LEGENDA ORALĂ!</h1>
            <motion.div className="bg-white rounded-3xl p-8 shadow-2xl">
              <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">{score}</p>
              <p className="text-gray-600 mb-4">puncte</p>
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4">
                <p className="text-2xl font-bold text-orange-600">Max Combo: {maxCombo}</p>
                <p className="text-lg text-orange-500">Valuri supraviețuite: 20</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-red-900 to-red-800 overflow-hidden relative"
      style={{ transform: `translate(${screenShake * (Math.random() - 0.5)}px, ${screenShake * (Math.random() - 0.5)}px)` }}
    >
      {/* Boss Warning */}
      <AnimatePresence>
        {bossWarning && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-red-600 text-white text-4xl font-black px-12 py-6 rounded-3xl shadow-2xl animate-pulse border-4 border-yellow-400">
              ⚠️ BOSS INCOMING! ⚠️
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 p-2 bg-black/60 flex justify-between items-center z-40">
        <button onClick={onBack} className="text-white/80 p-2 hover:bg-white/20 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 text-white text-sm">
          <motion.div 
            className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 rounded-full font-black shadow-lg"
            animate={{ scale: wave % 5 === 0 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.5, repeat: wave % 5 === 0 ? Infinity : 0 }}
          >
            Valul {wave}
          </motion.div>
          <motion.div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full flex items-center gap-1 font-bold shadow-lg">
            <Zap className="w-4 h-4" /> {Math.floor(energy)}
          </motion.div>
          <div className="bg-blue-600 px-3 py-2 rounded-full font-bold">{score}</div>
        </div>
        
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          <div className="w-24 h-4 bg-gray-700 rounded-full overflow-hidden border-2 border-white/30">
            <motion.div 
              className="h-full bg-gradient-to-r from-white via-blue-200 to-white"
              animate={{ width: `${toothHealth}%` }}
              transition={{ type: 'spring' }}
            />
          </div>
        </div>
      </div>

      {/* Combo */}
      <AnimatePresence>
        {combo >= 5 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30">
            <motion.div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-black text-2xl shadow-xl border-2 border-yellow-400" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              🔥 COMBO x{combo}!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fairy */}
      <AnimatePresence>
        {showFairy && (
          <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="fixed top-28 left-4 z-20">
            <div className="bg-white rounded-2xl p-4 shadow-2xl border-4 border-pink-300 max-w-xs">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🧚‍♀️</span>
                <p className="text-gray-700 font-bold text-sm">{fairyMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particles */}
      {particles.map(p => (
        <motion.div key={p.id} className="absolute pointer-events-none z-30" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }} initial={{ scale: 1, opacity: p.life }} animate={{ scale: 0, opacity: 0 }}>
          <div className="w-full h-full rounded-full" style={{ backgroundColor: p.color, boxShadow: `0 0 ${p.size}px ${p.color}` }} />
        </motion.div>
      ))}

      {/* Game Area */}
      <div className="pt-20 pb-40 h-screen relative">
        {/* Tooth Base */}
        <motion.div 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-8xl z-10"
          animate={{ scale: toothHealth < 50 ? [1, 0.95, 1] : 1 }}
          transition={{ duration: 0.5, repeat: toothHealth < 50 ? Infinity : 0 }}
        >
          {toothHealth > 70 ? '🦷' : toothHealth > 30 ? '😬' : '😰'}
        </motion.div>

        {/* Lanes */}
        {LANES.map((y, i) => (
          <div key={i} className="absolute left-0 right-0 h-16 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer" style={{ top: `${y}%` }} onClick={() => placeTower(i)} />
        ))}

        {/* Towers */}
        {towers.map(tower => (
          <motion.div
            key={tower.id}
            className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2`}
            style={{ left: `${tower.x}%`, top: `${tower.y}%` }}
            animate={{ rotate: tower.rotation }}
          >
            <div className={`w-14 h-14 bg-gradient-to-br ${TOWER_TYPES[tower.type].color} rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-white`}>
              {TOWER_TYPES[tower.type].emoji}
            </div>
            {/* Range indicator on hover */}
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-white/30"
              initial={{ scale: 0 }}
              whileHover={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        ))}

        {/* Bacterias */}
        <AnimatePresence>
          {bacterias.map(b => (
            <motion.div
              key={b.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: b.scale, x: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
            >
              <motion.div animate={{ rotate: b.rotation }} transition={{ duration: 0.1, repeat: Infinity }}>
                <span className={`filter drop-shadow-lg ${b.type === 'boss' ? 'text-7xl' : 'text-5xl'}`}>
                  {b.type === 'boss' ? '👹' : b.type === 'fast' ? '👾' : b.type === 'flying' ? '🦇' : '🦠'}
                </span>
              </motion.div>
              
              {/* HP bar */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-gray-700 rounded-full overflow-hidden border border-white/30">
                <motion.div 
                  className={`h-full ${b.hp / b.maxHp > 0.5 ? 'bg-green-500' : b.hp / b.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  animate={{ width: `${(b.hp / b.maxHp) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Projectiles */}
        {projectiles.map(p => (
          <motion.div key={p.id} className="absolute z-20" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)` }}>
            <div className={`w-4 h-4 rounded-full ${p.type === 'brush' ? 'bg-blue-400' : p.type === 'floss' ? 'bg-green-400' : p.type === 'paste' ? 'bg-purple-400' : 'bg-yellow-400'}`} style={{ boxShadow: `0 0 10px ${p.type === 'brush' ? '#60A5FA' : p.type === 'floss' ? '#4ADE80' : p.type === 'paste' ? '#A78BFA' : '#FACC15'}` }} />
          </motion.div>
        ))}

        {/* Rhythm Notes */}
        {rhythmNotes.filter(n => !n.hit).map(note => (
          <motion.div key={note.id} className="absolute z-25" style={{ left: `${20 + note.lane * 20}%`, top: `${note.y}%` }}>
            <motion.div 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${note.y > 80 && note.y < 90 ? 'bg-green-500 scale-110' : 'bg-purple-500'}`}
              animate={{ scale: note.y > 80 && note.y < 90 ? [1, 1.2, 1] : 1 }}
            >
              🎵
            </motion.div>
          </motion.div>
        ))}

        {/* Rhythm Target Line */}
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent top-[85%] opacity-80" />
        <div className="absolute left-[10%] right-[10%] h-12 border-2 border-yellow-400/50 rounded-2xl top-[78%]" />
      </div>

      {/* Rhythm Controls */}
      <div className="fixed bottom-36 left-0 right-0 flex justify-center gap-4 px-4 z-30">
        {['A', 'S', 'D', 'F'].map((key, i) => (
          <motion.button
            key={key}
            onClick={() => hitRhythmNote(i)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-2xl font-black text-xl shadow-xl border-2 border-purple-400"
          >
            {key}
          </motion.button>
        ))}
      </div>

      {/* Tower Selection */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-lg p-4 z-40">
        <p className="text-white/80 text-xs mb-3 text-center font-medium">Alege turn și apasă pe pistă</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {(Object.keys(TOWER_TYPES) as Array<keyof typeof TOWER_TYPES>).map((type, i) => {
            const tower = TOWER_TYPES[type];
            const canAfford = energy >= tower.cost;
            const isSelected = selectedTower === type;
            
            return (
              <motion.button
                key={type}
                onClick={() => setSelectedTower(isSelected ? null : type)}
                disabled={!canAfford}
                whileHover={canAfford ? { scale: 1.05 } : {}}
                whileTap={canAfford ? { scale: 0.95 } : {}}
                className={`relative p-3 rounded-2xl transition-all ${
                  isSelected ? 'ring-4 ring-yellow-400 scale-105' : ''
                } ${canAfford ? 'opacity-100' : 'opacity-40'}`}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${tower.color} rounded-xl flex items-center justify-center text-3xl shadow-lg`}>
                  {tower.emoji}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  {tower.cost}
                </div>
                {isSelected && (
                  <motion.div 
                    className="absolute inset-0 bg-yellow-400/30 rounded-2xl"
                    animate={{ opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
