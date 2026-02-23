import { useEffect, useState } from 'react';

interface ToothFairyAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  isSpeaking?: boolean;
  className?: string;
}

export function ToothFairyAvatar({ size = 'md', isSpeaking = false, className = '' }: ToothFairyAvatarProps) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Generate sparkles
  useEffect(() => {
    const newSparkles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setSparkles(newSparkles);
  }, []);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-pulse"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}s`,
            boxShadow: '0 0 10px #FFD700',
          }}
        />
      ))}

      {/* Fairy SVG */}
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full drop-shadow-lg ${isSpeaking ? 'animate-bounce' : 'animate-float'}`}
        style={{
          animation: isSpeaking 
            ? 'bounce 0.5s ease-in-out infinite' 
            : 'float 3s ease-in-out infinite',
        }}
      >
        {/* Wings */}
        <g className="animate-pulse" style={{ transformOrigin: 'center', animation: 'flutter 0.5s ease-in-out infinite' }}>
          {/* Left Wing */}
          <ellipse
            cx="60"
            cy="100"
            rx="35"
            ry="50"
            fill="#E0F2FE"
            stroke="#BAE6FD"
            strokeWidth="2"
            opacity="0.8"
          />
          {/* Right Wing */}
          <ellipse
            cx="140"
            cy="100"
            rx="35"
            ry="50"
            fill="#E0F2FE"
            stroke="#BAE6FD"
            strokeWidth="2"
            opacity="0.8"
          />
        </g>

        {/* Dress */}
        <path
          d="M80 120 Q100 180 120 120 L130 160 Q100 170 70 160 Z"
          fill="#F472B6"
          stroke="#EC4899"
          strokeWidth="2"
        />
        <ellipse cx="100" cy="120" rx="25" ry="30" fill="#FBCFE8" />

        {/* Head */}
        <circle cx="100" cy="70" r="35" fill="#FDE68A" />
        
        {/* Hair */}
        <path
          d="M65 70 Q60 50 80 40 Q100 30 120 40 Q140 50 135 70"
          fill="#FDE047"
          stroke="#FACC15"
          strokeWidth="2"
        />
        <circle cx="65" cy="70" r="12" fill="#FDE047" />
        <circle cx="135" cy="70" r="12" fill="#FDE047" />

        {/* Face */}
        {/* Eyes */}
        <circle cx="88" cy="65" r="5" fill="#1F2937" />
        <circle cx="112" cy="65" r="5" fill="#1F2937" />
        <circle cx="90" cy="63" r="2" fill="white" />
        <circle cx="114" cy="63" r="2" fill="white" />
        
        {/* Smile */}
        <path
          d="M90 80 Q100 88 110 80"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Blush */}
        <circle cx="80" cy="75" r="5" fill="#FDA4AF" opacity="0.6" />
        <circle cx="120" cy="75" r="5" fill="#FDA4AF" opacity="0.6" />

        {/* Crown */}
        <path
          d="M75 40 L85 20 L95 35 L105 15 L115 35 L125 20 L125 40 Z"
          fill="#FCD34D"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        <circle cx="85" cy="25" r="3" fill="#FDE68A" />
        <circle cx="105" cy="20" r="3" fill="#FDE68A" />
        <circle cx="115" cy="28" r="3" fill="#FDE68A" />

        {/* Wand */}
        <line x1="140" y1="100" x2="160" y2="60" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
        <polygon
          points="160,60 165,50 170,60 165,70"
          fill="#FDE047"
          stroke="#F59E0B"
          strokeWidth="1"
        />
        
        {/* Magic sparkles at wand tip */}
        <g style={{ animation: 'sparkle 1s ease-in-out infinite' }}>
          <circle cx="165" cy="55" r="3" fill="#FEF08A" />
          <circle cx="170" cy="60" r="2" fill="#FDE047" />
          <circle cx="160" cy="58" r="2" fill="#FEF9C3" />
        </g>

        {/* Speaking indicator */}
        {isSpeaking && (
          <>
            <ellipse cx="70" cy="45" rx="15" ry="10" fill="white" stroke="#E5E7EB" strokeWidth="1" />
            <text x="70" y="48" textAnchor="middle" fontSize="8" fill="#374151">...</text>
          </>
        )}
      </svg>

      {/* Magic Toothbrush Companion */}
      <div 
        className="absolute -bottom-2 -right-2 w-8 h-8 animate-bounce"
        style={{ animationDelay: '0.5s' }}
      >
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* Toothbrush handle */}
          <rect x="18" y="10" width="4" height="25" rx="2" fill="#3B82F6" />
          {/* Brush head */}
          <rect x="15" y="2" width="10" height="10" rx="2" fill="#60A5FA" />
          {/* Bristles */}
          <line x1="17" y1="4" x2="17" y2="8" stroke="white" strokeWidth="1" />
          <line x1="20" y1="4" x2="20" y2="8" stroke="white" strokeWidth="1" />
          <line x1="23" y1="4" x2="23" y2="8" stroke="white" strokeWidth="1" />
          {/* Eyes */}
          <circle cx="18" cy="20" r="1" fill="white" />
          <circle cx="22" cy="20" r="1" fill="white" />
          {/* Smile */}
          <path d="M18 24 Q20 26 22 24" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes flutter {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.9); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
