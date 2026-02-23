import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Heart, Zap, Clock } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { ToothFairyAvatar } from '../ToothFairyAvatar';

interface FluorAdventureProps {
  onBack: () => void;
}

interface Player {
  x: number;
  y: number;
  vy: number;
  isJumping: boolean;
  invincible: boolean;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  type: 'candy' | 'pit' | 'bacteria';
  width: number;
  height: number;
}

interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
}

interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'toothbrush' | 'paste';
}

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y = 70;
const GAME_SPEED = 3;

export function FluorAdventure({ onBack }: FluorAdventureProps) {
  const { saveGameSession, newBadges } = useGameProgress();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'gameOver' | 'victory'>('intro');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [distance, setDistance] = useState(0);
  const [invincibleTime, setInvincibleTime] = useState(0);
  
  const [player, setPlayer] = useState<Player>({ x: 10, y: GROUND_Y, vy: 0, isJumping: false, invincible: false });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [fairyComment, setFairyComment] = useState('');
  
  const gameLoopRef = useRef<number>();
  const lastObstacleTime = useRef(0);
  const startTime = useRef(0);

  // Generate obstacles
  const generateObstacle = useCallback(() => {
    const types: Obstacle['type'][] = ['candy', 'candy', 'bacteria'];
    if (Math.random() > 0.7) types.push('pit');
    
    const type = types[Math.floor(Math.random() * types.length)];
    const id = Math.random().toString(36).substr(2, 9);
    
    if (type === 'pit') {
      return { id, x: 100, y: GROUND_Y + 10, type, width: 15, height: 20 };
    }
    return { 
      id, 
      x: 100, 
      y: GROUND_Y - (type === 'candy' ? 5 : 10), 
      type, 
      width: type === 'bacteria' ? 8 : 5, 
      height: type === 'bacteria' ? 8 : 5 
    };
  }, []);

  // Generate platform
  const generatePlatform = useCallback(() => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: 100,
      y: GROUND_Y - 20 - Math.random() * 15,
      width: 20 + Math.random() * 15,
    };
  }, []);

  // Generate collectible
  const generateCollectible = useCallback(() => {
    const isPaste = Math.random() > 0.8;
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: 100,
      y: GROUND_Y - 15 - Math.random() * 20,
      type: isPaste ? 'paste' as const : 'toothbrush' as const,
    };
  }, []);

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    setDistance(0);
    setPlayer({ x: 10, y: GROUND_Y, vy: 0, isJumping: false, invincible: false });
    setObstacles([]);
    setPlatforms([]);
    setCollectibles([]);
    startTime.current = Date.now();
    lastObstacleTime.current = 0;
    setFairyComment('Sari peste dulciuri și bacterii!');
  };

  // Jump
  const jump = useCallback(() => {
    if (!player.isJumping && gameState === 'playing') {
      setPlayer(p => ({ ...p, vy: JUMP_FORCE, isJumping: true }));
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [player.isJumping, gameState]);

  // Double jump
  const doubleJump = useCallback(() => {
    if (player.isJumping && player.vy > -5 && gameState === 'playing') {
      setPlayer(p => ({ ...p, vy: JUMP_FORCE * 0.8 }));
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [player.isJumping, player.vy, gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();
      const elapsed = (now - startTime.current) / 1000;
      
      // Update distance
      setDistance(d => d + GAME_SPEED * 0.1);
      
      // Level progression
      if (elapsed > 30 && level === 1) {
        setLevel(2);
        setFairyComment('Nivel 2! Mai rapid acum!');
      } else if (elapsed > 60 && level === 2) {
        setLevel(3);
        setFairyComment('Nivel 3! Finalul!');
      } else if (elapsed > 90) {
        setGameState('victory');
        saveGameSession({
          gameId: 'fluor',
          score: score + lives * 100,
          duration: elapsed,
          level: 3,
        });
        return;
      }

      // Spawn obstacles
      if (now - lastObstacleTime.current > (2000 - level * 300)) {
        lastObstacleTime.current = now;
        setObstacles(prev => [...prev.slice(-5), generateObstacle()]);
        
        if (Math.random() > 0.5) {
          setPlatforms(prev => [...prev.slice(-3), generatePlatform()]);
        }
        
        if (Math.random() > 0.3) {
          setCollectibles(prev => [...prev.slice(-4), generateCollectible()]);
        }
      }

      // Update player physics
      setPlayer(p => {
        let newY = p.y + p.vy;
        let newVy = p.vy + GRAVITY;
        let isJumping = true;

        // Ground collision
        if (newY >= GROUND_Y) {
          newY = GROUND_Y;
          newVy = 0;
          isJumping = false;
        }

        // Platform collision
        platforms.forEach(plat => {
          if (Math.abs(plat.x - p.x) < plat.width / 2 && 
              newY >= plat.y - 5 && newY <= plat.y + 5 && 
              p.vy >= 0) {
            newY = plat.y;
            newVy = 0;
            isJumping = false;
          }
        });

        return { ...p, y: newY, vy: newVy, isJumping };
      });

      // Move obstacles
      setObstacles(prev => prev.map(o => ({ ...o, x: o.x - GAME_SPEED * (1 + level * 0.2) })).filter(o => o.x > -10));
      setPlatforms(prev => prev.map(p => ({ ...p, x: p.x - GAME_SPEED * (1 + level * 0.2) })).filter(p => p.x > -20));
      setCollectibles(prev => prev.map(c => ({ ...c, x: c.x - GAME_SPEED * (1 + level * 0.2) })).filter(c => c.x > -5));

      // Check collisions
      obstacles.forEach(obs => {
        if (Math.abs(obs.x - player.x) < 8 && Math.abs(obs.y - player.y) < 10 && !player.invincible) {
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState('gameOver');
              saveGameSession({
                gameId: 'fluor',
                score,
                duration: elapsed,
                level,
              });
            } else {
              setPlayer(p => ({ ...p, invincible: true }));
              setInvincibleTime(3);
              setFairyComment('Ai! Ai pierdut o viață!');
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
            return newLives;
          });
        }
      });

      // Check collectible collisions
      collectibles.forEach(col => {
        if (Math.abs(col.x - player.x) < 8 && Math.abs(col.y - player.y) < 10) {
          if (col.type === 'toothbrush') {
            setScore(s => s + 50);
            setFairyComment('+50 Periuță!');
          } else {
            setPlayer(p => ({ ...p, invincible: true }));
            setInvincibleTime(5);
            setFairyComment('Paste invincibilitate!');
          }
          setCollectibles(prev => prev.filter(c => c.id !== col.id));
        }
      });

      // Update invincibility
      if (invincibleTime > 0) {
        setInvincibleTime(t => t - 0.016);
      } else if (player.invincible) {
        setPlayer(p => ({ ...p, invincible: false }));
      }

      // Update score
      setScore(s => s + 1);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, level, player.x, player.y, player.invincible, obstacles, platforms, collectibles, score]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (player.isJumping) {
          doubleJump();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, doubleJump, player.isJumping]);

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-700 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <button onClick={onBack} className="text-white/80 hover:text-white mb-6 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">💧 Aventura lui Fluor</h1>
            <p className="text-xl text-purple-200 mb-8">Ajuțilă pe Fluor să salveze Orașul Dinților!</p>
            
            <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-8">
              <div className="text-6xl mb-4">🏃</div>
              <p className="text-white">Fluor aleargă prin oraș!</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-8 text-left text-white">
              <h3 className="font-bold mb-2">📖 Cum se joacă:</h3>
              <ul className="space-y-1 text-purple-200 text-sm">
                <li>• Apasă SPACE sau atinge ecranul pentru săritură</li>
                <li>• Apasă din nou în aer pentru dublă săritură</li>
                <li>• Evită dulciurile și bacteriile!</li>
                <li>• Colectează periuțe pentru puncte</li>
                <li>• Pasta te face invincibil 5 secunde</li>
                <li>• Supraviețuiește 90 de secunde pentru victorie!</li>
              </ul>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-400 to-pink-500 text-white text-xl font-bold px-12 py-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              🎮 Joacă Acum!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-700 p-4">
        <div className="max-w-2xl mx-auto pt-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">💔 Game Over</h1>
          <p className="text-xl text-purple-200 mb-6">Fluor a obosit...</p>
          
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 mb-6">
            <p className="text-5xl font-bold text-white mb-2">{score}</p>
            <p className="text-purple-200">puncte</p>
          </div>
          
          {newBadges.length > 0 && (
            <div className="bg-yellow-400/20 rounded-2xl p-4 mb-6">
              <p className="text-yellow-300 font-bold mb-2">🏅 Insigne Noi!</p>
              {newBadges.map((badge, i) => (
                <span key={i} className="inline-block bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm m-1">
                  {badge}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <button onClick={startGame} className="bg-purple-500 text-white px-8 py-3 rounded-full font-bold">
              Încearcă Din Nou
            </button>
            <button onClick={onBack} className="bg-white/20 text-white px-8 py-3 rounded-full font-bold">
              Înapoi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-500 p-4">
        <div className="max-w-2xl mx-auto pt-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">🏆 VICTORIE!</h1>
          <p className="text-xl text-white/80 mb-6">Ai salvat Orașul Dinților!</p>
          
          <div className="text-8xl mb-6">🎉</div>
          
          <div className="bg-white rounded-3xl p-8 mb-6">
            <p className="text-5xl font-bold text-purple-600 mb-2">{score + lives * 100}</p>
            <p className="text-gray-500">puncte finale</p>
          </div>
          
          {newBadges.length > 0 && (
            <div className="bg-white/20 rounded-2xl p-4 mb-6">
              <p className="text-white font-bold mb-2">🏅 Insigne Noi!</p>
              {newBadges.map((badge, i) => (
                <span key={i} className="inline-block bg-white text-orange-600 px-3 py-1 rounded-full text-sm m-1">
                  {badge}
                </span>
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
    <div 
      className="min-h-screen bg-gradient-to-b from-purple-800 to-purple-600 overflow-hidden"
      onClick={() => player.isJumping ? doubleJump() : jump()}
    >
      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-black/20">
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="text-white/80 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-4 text-white">
          <div className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-bold">{score}</span>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-1">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="font-bold">{lives}</span>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="font-bold">N{level}</span>
          </div>
        </div>
        
        {invincibleTime > 0 && (
          <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold animate-pulse flex items-center gap-1">
            <Zap className="w-4 h-4" />
            {Math.ceil(invincibleTime)}s
          </div>
        )}
      </div>

      {/* Fairy Comment */}
      <AnimatePresence>
        {fairyComment && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow">
              <ToothFairyAvatar size="sm" />
              <span className="text-sm">{fairyComment}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Area */}
      <div className="relative w-full h-screen">
        {/* Background elements */}
        <div className="absolute inset-0">
          {/* Tooth buildings */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-20 text-6xl opacity-30"
              style={{ left: `${i * 25 - (distance * 0.1) % 25}%` }}
            >
              🦷
            </div>
          ))}
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-green-600 to-green-400">
          <div className="absolute top-0 left-0 right-0 h-4 bg-green-300" />
        </div>

        {/* Platforms */}
        {platforms.map(plat => (
          <div
            key={plat.id}
            className="absolute bg-amber-600 rounded"
            style={{
              left: `${plat.x}%`,
              top: `${plat.y}%`,
              width: `${plat.width}%`,
              height: '8px',
            }}
          />
        ))}

        {/* Player - Fluor */}
        <motion.div
          className={`absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 ${player.invincible ? 'animate-pulse' : ''}`}
          style={{
            left: `${player.x}%`,
            top: `${player.y}%`,
          }}
          animate={{
            rotate: player.isJumping ? -15 : 0,
            scale: player.invincible ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-5xl filter drop-shadow-lg">
            {player.invincible ? '✨💧✨' : '💧'}
          </div>
        </motion.div>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${obs.x}%`,
              top: `${obs.y}%`,
            }}
          >
            <div className="text-4xl">
              {obs.type === 'candy' && '🍬'}
              {obs.type === 'bacteria' && '🦠'}
              {obs.type === 'pit' && '🕳️'}
            </div>
          </div>
        ))}

        {/* Collectibles */}
        {collectibles.map(col => (
          <motion.div
            key={col.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${col.x}%`,
              top: `${col.y}%`,
            }}
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <div className="text-3xl">
              {col.type === 'toothbrush' ? '🪥' : '🧴'}
            </div>
          </motion.div>
        ))}

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
          Apasă pentru săritură, apasă din nou pentru dublă!
        </div>
      </div>
    </div>
  );
}
