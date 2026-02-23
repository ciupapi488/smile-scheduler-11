import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Volume2, VolumeX } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { ToothFairyAvatar } from '../ToothFairyAvatar';

interface TongueGoalGameProps {
  onBack: () => void;
}

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface CavityTooth {
  id: string;
  x: number;
  y: number;
  healed: boolean;
  moving?: boolean;
  vy?: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const LEVELS = [
  { level: 1, tongueSpeed: 2000, name: 'Începător', nameEn: 'Beginner' },
  { level: 2, tongueSpeed: 1000, name: 'Mediu', nameEn: 'Medium', hasObstacles: true },
  { level: 3, tongueSpeed: 500, name: 'Expert', nameEn: 'Expert', hasObstacles: true, movingTeeth: true },
];

export function TongueGoalGame({ onBack }: TongueGoalGameProps) {
  const { saveGameSession, newBadges, clearNewBadges } = useGameProgress();
  
  // Game state
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'gameOver'>('intro');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [shots, setShots] = useState(0);
  const [hits, setHits] = useState(0);
  
  // Tongue state
  const [tongueX, setTongueX] = useState(50);
  const [tongueDirection, setTongueDirection] = useState(1);
  const [tongueExpression, setTongueExpression] = useState<'focused' | 'scared' | 'happy' | 'laugh' | 'eww'>('focused');
  const [tongueDancing, setTongueDancing] = useState(false);
  
  // Player/shooting state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [balls, setBalls] = useState<Ball[]>([]);
  const [cavityTeeth, setCavityTeeth] = useState<CavityTooth[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fairyComment, setFairyComment] = useState('');
  
  // Refs
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastShotTime = useRef(0);

  // Initialize cavity teeth
  useEffect(() => {
    if (gameState === 'playing') {
      spawnCavityTooth();
    }
  }, [gameState, shots]);

  const spawnCavityTooth = () => {
    if (Math.random() > 0.3) return; // 30% chance
    
    const newTooth: CavityTooth = {
      id: Math.random().toString(36).substr(2, 9),
      x: 20 + Math.random() * 60,
      y: 30 + Math.random() * 20,
      healed: false,
      moving: LEVELS[level - 1]?.movingTeeth || false,
      vy: LEVELS[level - 1]?.movingTeeth ? (Math.random() > 0.5 ? 1 : -1) : 0,
    };
    
    setCavityTeeth(prev => [...prev.slice(-2), newTooth]);
  };

  // Tongue movement
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const currentLevel = LEVELS[level - 1];
    const speed = currentLevel?.tongueSpeed || 2000;
    
    const interval = setInterval(() => {
      setTongueX(prev => {
        let newX = prev + (tongueDirection * 2);
        if (newX >= 80) {
          setTongueDirection(-1);
          newX = 80;
        } else if (newX <= 20) {
          setTongueDirection(1);
          newX = 20;
        }
        return newX;
      });
    }, speed / 100);
    
    return () => clearInterval(interval);
  }, [gameState, level, tongueDirection]);

  // Move cavity teeth
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setCavityTeeth(prev => prev.map(tooth => {
        if (!tooth.moving) return tooth;
        let newY = tooth.y + (tooth.vy || 0) * 0.5;
        if (newY < 20 || newY > 50) {
          return { ...tooth, vy: -(tooth.vy || 0), y: Math.max(20, Math.min(50, newY)) };
        }
        return { ...tooth, y: newY };
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [gameState]);

  // Physics engine
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const updatePhysics = () => {
      setBalls(prev => prev.map(ball => {
        if (!ball.active) return ball;
        
        // Update position
        let newX = ball.x + ball.vx;
        let newY = ball.y + ball.vy;
        let newVx = ball.vx;
        let newVy = ball.vy + 0.15; // Gravity
        
        // Check boundaries
        if (newX < 0 || newX > 100) newVx = -newVx * 0.8;
        if (newY > 90) {
          // Hit ground - deactivate
          return { ...ball, active: false };
        }
        
        // Check collision with cavity teeth
        let hitTooth = false;
        setCavityTeeth(prevTeeth => prevTeeth.map(tooth => {
          if (tooth.healed) return tooth;
          const dx = newX - tooth.x;
          const dy = newY - tooth.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 8) {
            hitTooth = true;
            // Heal the tooth!
            setScore(s => s + 50);
            createParticles(tooth.x, tooth.y, '#FFD700');
            setFairyComment('Super! Ai vindecat un dinte! +50');
            return { ...tooth, healed: true };
          }
          return tooth;
        }));
        
        if (hitTooth) {
          return { ...ball, active: false };
        }
        
        // Check collision with tongue
        const tongueLeft = tongueX - 12;
        const tongueRight = tongueX + 12;
        const mouthLeft = tongueX - 6;
        const mouthRight = tongueX + 6;
        const tongueTop = 70;
        
        if (newY >= tongueTop && newY <= tongueTop + 15 && newX >= tongueLeft && newX <= tongueRight) {
          // Hit tongue!
          if (newX >= mouthLeft && newX <= mouthRight) {
            // HIT MOUTH! +20 points
            setScore(s => s + 20);
            setHits(h => h + 1);
            setTongueExpression('happy');
            setTongueDancing(true);
            createParticles(newX, newY, '#FFFFFF');
            createConfetti();
            setFairyComment('GOL! Bravo! +20');
            
            setTimeout(() => {
              setTongueDancing(false);
              setTongueExpression('focused');
            }, 1500);
          } else if ((newX >= tongueLeft && newX < mouthLeft) || (newX > mouthRight && newX <= tongueRight)) {
            // Hit hands +5 points
            setScore(s => s + 5);
            setTongueExpression('scared');
            createParticles(newX, newY, '#87CEEB');
            setFairyComment('Aparat! Dar ai punctat! +5');
            
            setTimeout(() => setTongueExpression('focused'), 1000);
          } else {
            // Missed mouth
            setTongueExpression('laugh');
            setFairyComment('Ratat! Limbă râde de tine!');
            
            setTimeout(() => setTongueExpression('focused'), 1500);
          }
          
          return { ...ball, active: false };
        }
        
        return { ...ball, x: newX, y: newY, vx: newVx, vy: newVy };
      }).filter(ball => ball.active || ball.y < 95));
      
      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1,
        life: p.life - 0.02,
      })).filter(p => p.life > 0));
      
      animationRef.current = requestAnimationFrame(updatePhysics);
    };
    
    animationRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, tongueX]);

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 1,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createConfetti = () => {
    const colors = ['#FFD700', '#FF69B4', '#00CED1', '#7FFF00'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x: 50,
        y: 30,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * -5 - 2,
        life: 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing') return;
    
    const now = Date.now();
    if (now - lastShotTime.current < 500) return; // Rate limit
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragCurrent({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragCurrent({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, 15);
    const angle = Math.atan2(dy, dx);
    
    if (power > 2) {
      const newBall: Ball = {
        id: Math.random().toString(36).substr(2, 9),
        x: 50,
        y: 80,
        vx: Math.cos(angle) * power * 0.3,
        vy: Math.sin(angle) * power * 0.3,
        active: true,
      };
      
      setBalls(prev => [...prev, newBall]);
      setShots(s => s + 1);
      lastShotTime.current = Date.now();
      
      // Play sound effect (simulated)
      if (soundEnabled && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    
    setIsDragging(false);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setShots(0);
    setHits(0);
    setLevel(1);
    setBalls([]);
    setCavityTeeth([]);
    setParticles([]);
    setFairyComment('Trage cu pasta de dinți spre gura limbii!');
  };

  const endGame = () => {
    setGameState('gameOver');
    saveGameSession({
      gameId: 'tongue',
      score,
      duration: shots * 3,
      level,
    });
  };

  // Calculate aim line
  const getAimLine = () => {
    if (!isDragging) return null;
    
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const length = Math.min(Math.sqrt(dx * dx + dy * dy) / 5, 20);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return { length, angle };
  };

  const aimLine = getAimLine();

  // INTRO SCREEN
  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <button onClick={onBack} className="text-white/80 hover:text-white mb-6 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Înapoi
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">⚽ Gol în Gura Limbii</h1>
            <p className="text-xl text-blue-200 mb-8">Trage cu pasta de dinți și înscrie în gura limbii!</p>
            
            {/* Preview of tongue */}
            <div className="relative h-48 bg-blue-800/50 rounded-3xl mb-8 overflow-hidden">
              <TongueSVG x={50} expression="focused" dancing={false} />
              <ToothpasteTube x={50} y={85} squeezing={false} />
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 text-left text-white">
              <h3 className="font-bold text-lg mb-3">📖 Cum se joacă:</h3>
              <ul className="space-y-2 text-blue-100">
                <li>• Trage înapoi cu mouse-ul sau degetul pentru a ținti</li>
                <li>• Lovește în gura limbii pentru +20 puncte</li>
                <li>• Vindecă dinții negri pentru +50 puncte bonus</li>
                <li>• Evită mânușile portarului!</li>
              </ul>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-400 to-green-600 text-white text-xl font-bold px-12 py-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              🎮 Joacă Acum!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20">
        <button onClick={onBack} className="text-white/80 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4 text-white">
          <div className="bg-white/10 px-4 py-1 rounded-full">
            <span className="font-bold">{score}</span> puncte
          </div>
          <div className="bg-white/10 px-4 py-1 rounded-full">
            Nivel {level}
          </div>
        </div>
        
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-white/80 hover:text-white">
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Fairy Comment */}
      <AnimatePresence>
        {fairyComment && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20"
          >
            <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-xl">
              <ToothFairyAvatar size="sm" isSpeaking />
              <span className="font-medium text-gray-700">{fairyComment}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="relative w-full h-[calc(100vh-80px)]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Cavity Teeth */}
        {cavityTeeth.map(tooth => (
          <div
            key={tooth.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all"
            style={{ left: `${tooth.x}%`, top: `${tooth.y}%` }}
          >
            <div className={`text-4xl ${tooth.healed ? 'animate-bounce' : ''}`}>
              {tooth.healed ? '🦷' : '🦷'}
            </div>
            {!tooth.healed && (
              <div className="absolute inset-0 bg-black/60 rounded-lg" style={{ clipPath: 'polygon(20% 40%, 40% 30%, 60% 45%, 80% 35%)' }} />
            )}
            {tooth.healed && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold text-sm whitespace-nowrap">
                +50!
              </div>
            )}
          </div>
        ))}

        {/* Balls */}
        {balls.map(ball => (
          <div
            key={ball.id}
            className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${ball.x}%`, 
              top: `${ball.y}%`,
              boxShadow: '0 0 10px rgba(255,255,255,0.8)',
            }}
          />
        ))}

        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
              opacity: p.life,
            }}
          />
        ))}

        {/* Aim Line */}
        {aimLine && (
          <div
            className="absolute left-1/2 top-[80%] h-1 bg-gradient-to-r from-white/80 to-transparent origin-left"
            style={{
              width: `${aimLine.length}%`,
              transform: `rotate(${aimLine.angle}deg)`,
            }}
          />
        )}

        {/* Tongue Goalkeeper */}
        <TongueSVG x={tongueX} expression={tongueExpression} dancing={tongueDancing} />

        {/* Toothpaste Tube (Player) */}
        <ToothpasteTube 
          x={50} 
          y={85} 
          squeezing={isDragging}
        />

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm text-center">
          Trage înapoi și lasă pentru a trage!
        </div>
      </div>

      {/* Level Up Modal */}
      {hits > 0 && hits % 5 === 0 && level < 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 z-30"
        >
          <div className="bg-white rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">🎉 Nivel Următor!</h2>
            <p className="text-gray-600 mb-4">Limbă se mișcă mai repede acum!</p>
            <button
              onClick={() => setLevel(l => Math.min(3, l + 1))}
              className="bg-blue-500 text-white px-8 py-3 rounded-full font-bold"
            >
              Continuă
            </button>
          </div>
        </motion.div>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
          <div className="bg-white rounded-3xl p-8 text-center max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">🏆 Joc Terminat!</h2>
            <div className="text-6xl mb-4">{score >= 500 ? '🥇' : score >= 200 ? '🥈' : '🥉'}</div>
            <p className="text-2xl font-bold text-blue-600 mb-2">{score} puncte</p>
            <p className="text-gray-600 mb-6">{hits} goluri din {shots} încercări</p>
            
            {newBadges.length > 0 && (
              <div className="bg-yellow-100 rounded-2xl p-4 mb-6">
                <p className="font-bold text-yellow-800 mb-2">🏅 Insigne Noi!</p>
                {newBadges.map((badge, i) => (
                  <span key={i} className="inline-block bg-yellow-400 text-white px-3 py-1 rounded-full text-sm m-1">
                    {badge}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="flex-1 bg-green-500 text-white py-3 rounded-full font-bold"
              >
                Joacă Din Nou
              </button>
              <button
                onClick={onBack}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full font-bold"
              >
                Înapoi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Game Button */}
      <button
        onClick={endGame}
        className="absolute bottom-4 right-4 bg-white/20 text-white px-4 py-2 rounded-full text-sm hover:bg-white/30"
      >
        Termină Jocul
      </button>
    </div>
  );
}

// Tongue SVG Component
function TongueSVG({ x, expression, dancing }: { x: number; expression: string; dancing: boolean }) {
  const getEyeExpression = () => {
    switch (expression) {
      case 'scared': return { ry: 3, rx: 4 };
      case 'happy': return { ry: 1, rx: 4 }; // Closed happy eyes
      case 'laugh': return { ry: 1, rx: 4 };
      default: return { ry: 4, rx: 4 };
    }
  };

  const getMouthExpression = () => {
    switch (expression) {
      case 'happy': return 'M35 50 Q50 65 65 50';
      case 'laugh': return 'M35 45 Q50 70 65 45';
      case 'eww': return 'M40 55 Q50 50 60 55';
      default: return 'M40 55 Q50 60 60 55';
    }
  };

  const eyes = getEyeExpression();

  return (
    <div 
      className={`absolute transform -translate-x-1/2 ${dancing ? 'animate-bounce' : ''}`}
      style={{ left: `${x}%`, top: '60%', width: '200px', height: '250px' }}
    >
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl">
        {/* Main tongue body */}
        <path
          d="M20 20 Q10 60 20 90 Q50 110 80 90 Q90 60 80 20 Q50 5 20 20"
          fill="#FF6B6B"
          stroke="#E74C3C"
          strokeWidth="2"
        />
        
        {/* Tongue texture dots */}
        <circle cx="35" cy="50" r="3" fill="#FF8585" opacity="0.5" />
        <circle cx="50" cy="60" r="4" fill="#FF8585" opacity="0.5" />
        <circle cx="65" cy="50" r="3" fill="#FF8585" opacity="0.5" />
        <circle cx="45" cy="40" r="2" fill="#FF8585" opacity="0.5" />
        <circle cx="55" cy="40" r="2" fill="#FF8585" opacity="0.5" />
        
        {/* Eyes */}
        <ellipse cx="35" cy="30" rx={eyes.rx} ry={eyes.ry} fill="white" />
        <ellipse cx="65" cy="30" rx={eyes.rx} ry={eyes.ry} fill="white" />
        
        {expression !== 'happy' && expression !== 'laugh' && (
          <>
            <circle cx="37" cy="30" r="2" fill="#1A1A1A" />
            <circle cx="67" cy="30" r="2" fill="#1A1A1A" />
          </>
        )}
        
        {expression === 'happy' && (
          <>
            <path d="M31 30 Q35 26 39 30" fill="none" stroke="#1A1A1A" strokeWidth="1.5" />
            <path d="M61 30 Q65 26 69 30" fill="none" stroke="#1A1A1A" strokeWidth="1.5" />
          </>
        )}
        
        {/* Mouth */}
        <path
          d={getMouthExpression()}
          fill={expression === 'happy' || expression === 'laugh' ? '#4A0000' : '#FF8585'}
          stroke="#C0392B"
          strokeWidth="1.5"
        />
        
        {/* Goalkeeper Gloves (Hands) */}
        <g transform="translate(-15, 50)">
          <ellipse cx="0" cy="0" rx="12" ry="20" fill="#3498DB" stroke="#2980B9" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="8" ry="14" fill="#5DADE2" />
          <circle cx="-3" cy="-8" r="3" fill="#85C1E9" />
          <circle cx="3" cy="-8" r="3" fill="#85C1E9" />
        </g>
        <g transform={`translate(${100 + 15}, 50) scale(-1, 1)`}>
          <ellipse cx="0" cy="0" rx="12" ry="20" fill="#3498DB" stroke="#2980B9" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="8" ry="14" fill="#5DADE2" />
          <circle cx="-3" cy="-8" r="3" fill="#85C1E9" />
          <circle cx="3" cy="-8" r="3" fill="#85C1E9" />
        </g>
        
        {/* Tiny legs at bottom */}
        <g transform="translate(35, 105)">
          <rect x="0" y="0" width="6" height="15" rx="3" fill="#FF6B6B" />
          <ellipse cx="3" cy="15" rx="5" ry="3" fill="#E74C3C" />
        </g>
        <g transform="translate(59, 105)">
          <rect x="0" y="0" width="6" height="15" rx="3" fill="#FF6B6B" />
          <ellipse cx="3" cy="15" rx="5" ry="3" fill="#E74C3C" />
        </g>
        
        {/* Expression indicators */}
        {expression === 'eww' && (
          <text x="50" y="15" textAnchor="middle" fontSize="12">🤢</text>
        )}
      </svg>
    </div>
  );
}

// Toothpaste Tube Component
function ToothpasteTube({ x, y, squeezing }: { x: number; y: number; squeezing: boolean }) {
  return (
    <div 
      className={`absolute transform -translate-x-1/2 transition-transform ${squeezing ? 'scale-90' : 'scale-100'}`}
      style={{ left: `${x}%`, top: `${y}%`, width: '60px', height: '100px' }}
    >
      <svg viewBox="0 0 60 100" className="w-full h-full">
        {/* Tube body */}
        <rect x="10" y="20" width="40" height="60" rx="5" fill="#E8F8F5" stroke="#1ABC9C" strokeWidth="2" />
        
        {/* Tube cap */}
        <rect x="20" y="80" width="20" height="15" rx="3" fill="#16A085" />
        
        {/* Label */}
        <rect x="15" y="35" width="30" height="30" rx="3" fill="#FFFFFF" />
        <text x="30" y="50" textAnchor="middle" fontSize="8" fill="#1ABC9C" fontWeight="bold">PASTĂ</text>
        <text x="30" y="58" textAnchor="middle" fontSize="6" fill="#7F8C8D">DENTARĂ</text>
        
        {/* Sparkle on tube */}
        <circle cx="45" cy="30" r="3" fill="#FFD700" className="animate-pulse" />
        
        {/* Squeeze effect lines */}
        {squeezing && (
          <>
            <line x1="5" y1="35" x2="15" y2="40" stroke="#1ABC9C" strokeWidth="2" />
            <line x1="5" y1="50" x2="15" y2="50" stroke="#1ABC9C" strokeWidth="2" />
            <line x1="5" y1="65" x2="15" y2="60" stroke="#1ABC9C" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
}
