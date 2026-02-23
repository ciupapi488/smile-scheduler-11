import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, Music, AlertTriangle } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { ToothFairyAvatar } from '../ToothFairyAvatar';

interface BacteriaWarsProps {
  onBack: () => void;
}

interface Tower {
  id: string;
  x: number;
  y: number;
  type: 'brush' | 'floss' | 'paste' | 'fluor';
  lastShot: number;
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
}

interface RhythmNote {
  id: string;
  lane: number;
  y: number;
  hit: boolean;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  type: string;
}

const TOWER_TYPES = {
  brush: { name: 'Periuță', emoji: '🪥', cost: 50, damage: 10, speed: 500, range: 20, color: 'bg-blue-500' },
  floss: { name: 'Ață', emoji: '🧵', cost: 100, damage: 25, speed: 1000, range: 30, color: 'bg-green-500' },
  paste: { name: 'Pastă', emoji: '🧴', cost: 150, damage: 40, speed: 1500, range: 25, color: 'bg-purple-500' },
  fluor: { name: 'Fluor', emoji: '💧', cost: 300, damage: 100, speed: 2000, range: 40, color: 'bg-yellow-500' },
};

const LANES = [15, 35, 55, 75, 95];

export function BacteriaWars({ onBack }: BacteriaWarsProps) {
  const { saveGameSession, newBadges } = useGameProgress();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameOver' | 'victory'>('intro');
  const [wave, setWave] = useState(1);
  const [energy, setEnergy] = useState(150);
  const [score, setScore] = useState(0);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [bacterias, setBacterias] = useState<Bacterium[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [rhythmNotes, setRhythmNotes] = useState<RhythmNote[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [selectedTower, setSelectedTower] = useState<keyof typeof TOWER_TYPES | null>(null);
  const [fairyComment, setFairyComment] = useState('');
  const [toothHealth, setToothHealth] = useState(100);
  const [showRhythmLine, setShowRhythmLine] = useState(false);
  
  const gameLoopRef = useRef<number>();
  const lastSpawnRef = useRef(0);
  const rhythmIntervalRef = useRef<NodeJS.Timeout>();

  // Spawn bacteria wave
  const spawnBacteria = useCallback(() => {
    const now = Date.now();
    const spawnRate = Math.max(1000, 3000 - wave * 200);
    
    if (now - lastSpawnRef.current > spawnRate) {
      lastSpawnRef.current = now;
      
      const types: Bacterium['type'][] = ['normal'];
      if (wave >= 2) types.push('fast');
      if (wave >= 3) types.push('flying');
      if (wave % 5 === 0) types.push('boss');
      
      const type = types[Math.floor(Math.random() * types.length)];
      const lane = Math.floor(Math.random() * LANES.length);
      
      const newBacterium: Bacterium = {
        id: Math.random().toString(36).substr(2, 9),
        x: 100,
        y: LANES[lane],
        lane,
        hp: type === 'boss' ? 500 : type === 'fast' ? 30 : 50,
        maxHp: type === 'boss' ? 500 : type === 'fast' ? 30 : 50,
        type,
        frozen: false,
      };
      
      setBacterias(prev => [...prev, newBacterium]);
    }
  }, [wave]);

  // Rhythm game
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const bpm = 100 + wave * 5;
    const interval = 60000 / bpm;
    
    rhythmIntervalRef.current = setInterval(() => {
      const lane = Math.floor(Math.random() * 4);
      setRhythmNotes(prev => [...prev.slice(-8), {
        id: Math.random().toString(36).substr(2, 9),
        lane,
        y: 0,
        hit: false,
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
      
      // Move bacteria
      setBacterias(prev => prev.map(b => {
        const speed = b.type === 'fast' ? 0.8 : b.type === 'boss' ? 0.3 : 0.5;
        const newX = b.x - speed * (1 + wave * 0.1);
        
        if (newX <= 0) {
          setToothHealth(h => {
            const damage = b.type === 'boss' ? 30 : 10;
            const newHealth = h - damage;
            if (newHealth <= 0) {
              setGameState('gameOver');
              saveGameSession({
                gameId: 'bacteria',
                score,
                duration: wave * 30,
                level: wave,
              });
            }
            return Math.max(0, newHealth);
          });
          return null;
        }
        
        return { ...b, x: newX };
      }).filter(Boolean) as Bacterium[]);

      // Move rhythm notes
      setRhythmNotes(prev => prev.map(n => ({ ...n, y: n.y + 2 })).filter(n => n.y < 100 && !n.hit));

      // Tower shooting
      const now = Date.now();
      setTowers(prev => prev.map(tower => {
        const towerType = TOWER_TYPES[tower.type];
        if (now - tower.lastShot < towerType.speed) return tower;
        
        // Find target
        const target = bacterias.find(b => {
          const dist = Math.sqrt(Math.pow(b.x - tower.x, 2) + Math.pow(b.y - tower.y, 2));
          return dist < towerType.range && b.type !== 'flying';
        });
        
        if (target) {
          setProjectiles(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            type: tower.type,
          }]);
          return { ...tower, lastShot: now };
        }
        
        return tower;
      }));

      // Move projectiles
      setProjectiles(prev => prev.map(p => {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 3;
        
        if (dist < speed) {
          // Hit!
          setBacterias(prevB => prevB.map(b => {
            if (Math.abs(b.x - p.targetX) < 5 && Math.abs(b.y - p.targetY) < 5) {
              const damage = TOWER_TYPES[p.type as keyof typeof TOWER_TYPES].damage * (1 + combo * 0.1);
              const newHp = b.hp - damage;
              if (newHp <= 0) {
                setEnergy(e => e + 10);
                setScore(s => s + (b.type === 'boss' ? 100 : 20));
                setFairyComment(b.type === 'boss' ? 'BOSS ÎNVINS!' : '+20');
                return null;
              }
              return { ...b, hp: newHp };
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
      setEnergy(e => Math.min(500, e + 0.5));
      
      // Wave progression
      if (score > wave * 500) {
        setWave(w => {
          const newWave = w + 1;
          setFairyComment(`Valul ${newWave}! Pregătește-te!`);
          if (newWave === 20) {
            setGameState('victory');
            saveGameSession({
              gameId: 'bacteria',
              score,
              duration: newWave * 30,
              level: 20,
            });
          }
          return newWave;
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, wave, bacterias, combo, score, spawnBacteria]);

  const placeTower = (laneIndex: number) => {
    if (!selectedTower || energy < TOWER_TYPES[selectedTower].cost) return;
    
    setEnergy(e => e - TOWER_TYPES[selectedTower].cost);
    setTowers(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      x: 15,
      y: LANES[laneIndex],
      type: selectedTower,
      lastShot: 0,
    }]);
    setSelectedTower(null);
  };

  const hitRhythmNote = (lane: number) => {
    const note = rhythmNotes.find(n => n.lane === lane && n.y > 70 && n.y < 90 && !n.hit);
    if (note) {
      setRhythmNotes(prev => prev.map(n => n.id === note.id ? { ...n, hit: true } : n));
      setCombo(c => {
        const newCombo = c + 1;
        if (newCombo > maxCombo) setMaxCombo(newCombo);
        return newCombo;
      });
      setScore(s => s + 10 * (1 + combo * 0.1));
      setEnergy(e => e + 5);
      if (navigator.vibrate) navigator.vibrate(20);
    } else {
      setCombo(0);
      setFairyComment('Ratat! Combo pierdut!');
    }
  };

  const startGame = () => {
    setGameState('playing');
    setWave(1);
    setEnergy(150);
    setScore(0);
    setTowers([]);
    setBacterias([]);
    setProjectiles([]);
    setRhythmNotes([]);
    setCombo(0);
    setMaxCombo(0);
    setToothHealth(100);
    setFairyComment('Apără dintele! Plasează turnuri și apasă pe ritm!');
  };

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-700 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <button onClick={onBack} className="text-white/80 hover:text-white mb-6 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">⚔️ Războiul Bacteriilor</h1>
            <p className="text-xl text-red-200 mb-8">Apară dintele de armatele de bacterii!</p>
            
            <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-8">
              <div className="text-6xl mb-4">🦷</div>
              <p className="text-white">Protejează dintele până la valul 20!</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-8 text-left text-white">
              <h3 className="font-bold mb-2">📖 Cum se joacă:</h3>
              <ul className="space-y-1 text-red-200 text-sm">
                <li>• Apasă Q/W/E/R pentru a selecta turnuri</li>
                <li>• Click pe pistă pentru a plasa turnuri</li>
                <li>• Apasă A/S/D/F când notele muzicale ajung la linie</li>
                <li>• Combo mare = turnuri trag mai repede!</li>
                <li>• Valul 20 e LEGENDAR - doar 5% reușesc!</li>
              </ul>
            </div>
            
            <div className="bg-yellow-400/20 rounded-2xl p-4 mb-8">
              <p className="text-yellow-300 font-bold">🏆 Legendă Orală</p>
              <p className="text-white text-sm">Insigna rară pentru cei care ajung la valul 20!</p>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xl font-bold px-12 py-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              🎮 Începe Bătălia!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <div className="max-w-2xl mx-auto pt-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">💀 Dintele a Căzut!</h1>
          <p className="text-xl text-gray-400 mb-6">Bacteriile au câștigat...</p>
          
          <div className="bg-white/10 rounded-3xl p-8 mb-6">
            <p className="text-5xl font-bold text-red-500 mb-2">Valul {wave}</p>
            <p className="text-gray-400">Maxim atins</p>
            <p className="text-3xl font-bold text-white mt-4">{score} puncte</p>
          </div>
          
          {newBadges.length > 0 && (
            <div className="bg-yellow-400/20 rounded-2xl p-4 mb-6">
              {newBadges.map((badge, i) => (
                <span key={i} className="inline-block bg-yellow-400 text-red-900 px-4 py-2 rounded-full font-bold m-1">
                  {badge}
                </span>
              ))}
            </div>
          )}
          
          <button onClick={startGame} className="bg-red-500 text-white px-8 py-3 rounded-full font-bold">
            Încearcă Din Nou
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-500 p-4">
        <div className="max-w-2xl mx-auto pt-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-8xl mb-6"
          >
            👑
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">LEGENDA ORALĂ!</h1>
          <p className="text-xl text-white/80 mb-6">Ai supraviețuit tuturor valurilor!</p>
          
          <div className="bg-white rounded-3xl p-8 mb-6">
            <p className="text-6xl font-bold text-yellow-600 mb-2">{score}</p>
            <p className="text-gray-500">puncte</p>
            <p className="text-lg text-purple-600 mt-2">Max Combo: {maxCombo}</p>
          </div>
          
          {newBadges.length > 0 && (
            <div className="bg-white/20 rounded-2xl p-6 mb-6">
              <p className="text-white font-bold mb-3">🏅 INSIGNĂ LEGENDARĂ!</p>
              {newBadges.map((badge, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold text-xl m-2"
                >
                  {badge}
                </motion.span>
              ))}
            </div>
          )}
          
          <button onClick={startGame} className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold">
            Joacă Din Nou
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-800 overflow-hidden">
      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 p-2 bg-black/40 flex justify-between items-center z-30">
        <button onClick={onBack} className="text-white/80 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 text-white text-sm">
          <span className="bg-red-600 px-2 py-1 rounded font-bold">Valul {wave}</span>
          <span className="bg-yellow-600 px-2 py-1 rounded flex items-center gap-1">
            <Zap className="w-4 h-4" /> {Math.floor(energy)}
          </span>
          <span className="bg-blue-600 px-2 py-1 rounded">{score}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-24 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white to-blue-200 transition-all"
              style={{ width: `${toothHealth}%` }}
            />
          </div>
          <span className="text-white text-xs">{toothHealth}%</span>
        </div>
      </div>

      {/* Fairy Comment */}
      <AnimatePresence>
        {fairyComment && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-14 left-1/2 transform -translate-x-1/2 z-20"
          >
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1 shadow text-sm">
              <ToothFairyAvatar size="sm" />
              <span>{fairyComment}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo Display */}
      {combo > 5 && (
        <motion.div
          key={combo}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full font-bold">
            🔥 COMBO x{combo}!
          </div>
        </motion.div>
      )}

      {/* Game Area */}
      <div className="pt-20 pb-32 h-screen">
        {/* Lanes */}
        {LANES.map((y, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-16 border-b border-white/10"
            style={{ top: `${y}%` }}
            onClick={() => placeTower(i)}
          />
        ))}

        {/* Tooth (Base) */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-6xl">
          {toothHealth > 50 ? '🦷' : toothHealth > 25 ? '😬' : '😰'}
        </div>

        {/* Towers */}
        {towers.map(tower => (
          <div
            key={tower.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 ${TOWER_TYPES[tower.type].color} rounded-full flex items-center justify-center text-xl border-2 border-white`}
            style={{ left: `${tower.x}%`, top: `${tower.y}%` }}
          >
            {TOWER_TYPES[tower.type].emoji}
          </div>
        ))}

        {/* Bacterias */}
        {bacterias.map(b => (
          <div
            key={b.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          >
            <div className="text-3xl">
              {b.type === 'boss' ? '👹' : b.type === 'fast' ? '👾' : b.type === 'flying' ? '🦇' : '🦠'}
            </div>
            <div className="w-8 h-1 bg-gray-700 rounded-full mt-1">
              <div 
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${(b.hp / b.maxHp) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {/* Projectiles */}
        {projectiles.map(p => (
          <div
            key={p.id}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}

        {/* Rhythm Notes */}
        {rhythmNotes.map(note => (
          <motion.div
            key={note.id}
            className={`absolute w-12 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
              note.hit ? 'bg-green-500 scale-150 opacity-0' : 'bg-purple-500'
            }`}
            style={{ 
              left: `${20 + note.lane * 20}%`, 
              top: `${note.y}%`,
            }}
          >
            🎵
          </motion.div>
        ))}

        {/* Rhythm Target Line */}
        <div className="absolute left-0 right-0 h-1 bg-yellow-400/50 top-[85%]" />
      </div>

      {/* Rhythm Controls */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center gap-4 px-4">
        {['A', 'S', 'D', 'F'].map((key, i) => (
          <button
            key={key}
            onClick={() => hitRhythmNote(i)}
            className="w-16 h-16 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xl shadow-lg active:scale-95 transition-transform"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Tower Selection */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/60 p-4">
        <p className="text-white text-xs mb-2 text-center">Selectează turn și apasă pe pistă (Q/W/E/R)</p>
        <div className="flex justify-center gap-2">
          {(Object.keys(TOWER_TYPES) as Array<keyof typeof TOWER_TYPES>).map((type, i) => {
            const tower = TOWER_TYPES[type];
            const canAfford = energy >= tower.cost;
            const isSelected = selectedTower === type;
            
            return (
              <button
                key={type}
                onClick={() => setSelectedTower(isSelected ? null : type)}
                disabled={!canAfford}
                className={`p-2 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-yellow-400 bg-yellow-400/20' : 'border-transparent'
                } ${canAfford ? 'opacity-100' : 'opacity-50'}`}
              >
                <div className={`w-12 h-12 ${tower.color} rounded-full flex items-center justify-center text-2xl mb-1`}>
                  {tower.emoji}
                </div>
                <p className="text-white text-xs font-bold">{tower.cost}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <style>{`
        @media (min-width: 768px) {
          .lane:hover {
            background: rgba(255,255,255,0.1);
          }
        }
      `}</style>
    </div>
  );
}
