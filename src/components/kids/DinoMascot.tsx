import { useEffect, useState } from 'react';

interface DinoMascotProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'focused' | 'encouraging' | 'talking' | 'celebrating';
  isSpeaking?: boolean;
  className?: string;
}

export function DinoMascot({ 
  size = 'md', 
  mood = 'happy', 
  isSpeaking = false, 
  className = '' 
}: DinoMascotProps) {
  const [blink, setBlink] = useState(false);
  
  // Blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  };

  const getMouthExpression = () => {
    switch (mood) {
      case 'happy':
        return 'M45 55 Q60 65 75 55'; // Smile
      case 'focused':
        return 'M50 60 Q60 58 70 60'; // Small concentrated mouth
      case 'encouraging':
        return 'M40 55 Q60 70 80 55'; // Big smile
      case 'talking':
        return isSpeaking ? 'M50 55 Q60 75 70 55' : 'M45 60 Q60 65 75 60'; // Open/close
      case 'celebrating':
        return 'M35 55 Q60 80 85 55'; // Huge excited smile
      default:
        return 'M45 55 Q60 65 75 55';
    }
  };

  const getEyeExpression = () => {
    if (blink) return 'scaleY(0.1)';
    if (mood === 'focused') return 'scaleY(1.2)';
    return 'scaleY(1)';
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Confetti when celebrating */}
      {mood === 'celebrating' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3'][i % 4],
                left: `${10 + i * 12}%`,
                top: `${-20 + (i % 3) * 10}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main SVG Dino */}
      <svg
        viewBox="0 0 120 120"
        className={`w-full h-full drop-shadow-xl ${mood === 'celebrating' ? 'animate-bounce-slight' : 'animate-breathe'}`}
      >
        {/* Tail */}
        <path
          d="M10 70 Q5 60 15 50 Q25 40 20 55"
          fill="#4CAF50"
          stroke="#388E3C"
          strokeWidth="2"
          className="animate-tail"
        />
        
        {/* Spikes on back */}
        <g className="animate-spikes">
          <path d="M30 35 L35 20 L40 35" fill="#388E3C" />
          <path d="M45 30 L50 15 L55 30" fill="#388E3C" />
          <path d="M60 32 L65 17 L70 32" fill="#388E3C" />
          <path d="M75 35 L80 20 L85 35" fill="#388E3C" />
        </g>

        {/* Body */}
        <ellipse cx="60" cy="70" rx="45" ry="35" fill="#4CAF50" stroke="#388E3C" strokeWidth="2" />
        
        {/* Belly */}
        <ellipse cx="60" cy="75" rx="30" ry="22" fill="#81C784" />

        {/* Head */}
        <g className={mood === 'celebrating' ? 'animate-head-bob' : ''}>
          <ellipse cx="60" cy="45" rx="32" ry="28" fill="#4CAF50" stroke="#388E3C" strokeWidth="2" />
          
          {/* Eyes */}
          <g style={{ transform: getEyeExpression(), transformOrigin: '50px 40px' }}>
            <circle cx="48" cy="38" r="6" fill="white" />
            <circle cx="48" cy="38" r="3" fill="#1A1A1A" />
            <circle cx="50" cy="36" r="1.5" fill="white" />
          </g>
          <g style={{ transform: getEyeExpression(), transformOrigin: '70px 40px' }}>
            <circle cx="72" cy="38" r="6" fill="white" />
            <circle cx="72" cy="38" r="3" fill="#1A1A1A" />
            <circle cx="74" cy="36" r="1.5" fill="white" />
          </g>

          {/* Cheeks */}
          <circle cx="38" cy="50" r="5" fill="#FF8A80" opacity="0.6" />
          <circle cx="82" cy="50" r="5" fill="#FF8A80" opacity="0.6" />

          {/* Mouth */}
          <path
            d={getMouthExpression()}
            fill={mood === 'talking' && isSpeaking ? '#FF5252' : 'none'}
            stroke="#1A1A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Teeth */}
          {(mood === 'happy' || mood === 'celebrating' || mood === 'encouraging') && (
            <g>
              <rect x="50" y="58" width="6" height="6" rx="1" fill="white" />
              <rect x="58" y="60" width="6" height="6" rx="1" fill="white" />
              <rect x="66" y="58" width="6" height="6" rx="1" fill="white" />
            </g>
          )}

          {/* Nostrils */}
          <circle cx="55" cy="48" r="1.5" fill="#388E3C" />
          <circle cx="65" cy="48" r="1.5" fill="#388E3C" />
        </g>

        {/* Arms */}
        <path
          d="M25 65 Q15 75 25 85"
          fill="none"
          stroke="#4CAF50"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M95 65 Q105 75 95 85"
          fill="none"
          stroke="#4CAF50"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Toothbrush in hand */}
        <g transform="rotate(-20 95 75)">
          {/* Brush handle */}
          <rect x="92" y="60" width="8" height="35" rx="4" fill="#2196F3" />
          {/* Brush head */}
          <rect x="90" y="45" width="12" height="18" rx="3" fill="#64B5F6" />
          {/* Bristles */}
          <line x1="93" y1="48" x2="93" y2="58" stroke="white" strokeWidth="2" />
          <line x1="96" y1="48" x2="96" y2="58" stroke="white" strokeWidth="2" />
          <line x1="99" y1="48" x2="99" y2="58" stroke="white" strokeWidth="2" />
          {/* Sparkles on brush */}
          <circle cx="100" cy="50" r="2" fill="#FFD700" className="animate-pulse" />
        </g>

        {/* Legs */}
        <path d="M40 100 L40 115" stroke="#4CAF50" strokeWidth="10" strokeLinecap="round" />
        <path d="M80 100 L80 115" stroke="#4CAF50" strokeWidth="10" strokeLinecap="round" />

        {/* Spots on body */}
        <circle cx="45" cy="70" r="4" fill="#388E3C" opacity="0.3" />
        <circle cx="75" cy="75" r="3" fill="#388E3C" opacity="0.3" />
        <circle cx="60" cy="82" r="2.5" fill="#388E3C" opacity="0.3" />
      </svg>

      {/* Speech bubble when talking */}
      {(mood === 'talking' || mood === 'encouraging') && isSpeaking && (
        <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-3 py-2 shadow-lg border-2 border-green-200 animate-float">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}

      {/* Stars around when celebrating */}
      {mood === 'celebrating' && (
        <>
          <div className="absolute top-0 left-0 text-yellow-400 text-2xl animate-twinkle">⭐</div>
          <div className="absolute top-2 right-4 text-yellow-400 text-xl animate-twinkle" style={{ animationDelay: '0.3s' }}>✨</div>
          <div className="absolute -bottom-2 left-4 text-yellow-400 text-lg animate-twinkle" style={{ animationDelay: '0.6s' }}>⭐</div>
        </>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes tail {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes spikes {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes head-bob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-2deg); }
          75% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes bounce-slight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
        }
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        .animate-tail {
          transform-origin: 15px 70px;
          animation: tail 2s ease-in-out infinite;
        }
        .animate-spikes {
          animation: spikes 3s ease-in-out infinite;
        }
        .animate-head-bob {
          animation: head-bob 0.5s ease-in-out infinite;
        }
        .animate-bounce-slight {
          animation: bounce-slight 0.6s ease-in-out infinite;
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 1s ease-in-out infinite;
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
