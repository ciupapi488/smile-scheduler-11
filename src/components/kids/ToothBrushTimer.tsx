import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface ToothBrushTimerProps {
  isActive: boolean;
  onComplete: () => void;
  onZoneChange?: (zone: number) => void;
  currentZone: number;
  totalTime?: number; // seconds, default 120 (2 minutes)
  zoneTime?: number; // seconds per zone, default 30
}

const ZONES = [
  { id: 1, name: 'Dreapta Sus', nameEn: 'Right Top', description: 'Ca un elicopter!', icon: '↗️' },
  { id: 2, name: 'Stânga Sus', nameEn: 'Left Top', description: 'Nu uita și la spate!', icon: '↖️' },
  { id: 3, name: 'Dreapta Jos', nameEn: 'Right Bottom', description: 'Periază ușor gingiile!', icon: '↘️' },
  { id: 4, name: 'Stânga Jos', nameEn: 'Left Bottom', description: 'Ești aproape gata!', icon: '↙️' },
];

export function ToothBrushTimer({
  isActive,
  onComplete,
  onZoneChange,
  currentZone,
  totalTime = 120,
  zoneTime = 30,
}: ToothBrushTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(totalTime);
  const [progress, setProgress] = useState(0);

  const calculateZone = useCallback((remaining: number) => {
    const elapsed = totalTime - remaining;
    const newZone = Math.min(4, Math.floor(elapsed / zoneTime) + 1);
    return newZone;
  }, [totalTime, zoneTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          const newProgress = ((totalTime - newTime) / totalTime) * 100;
          setProgress(newProgress);

          // Check if zone changed
          const newZone = calculateZone(newTime);
          if (newZone !== currentZone && onZoneChange) {
            onZoneChange(newZone);
          }

          if (newTime <= 0) {
            onComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, totalTime, currentZone, onZoneChange, onComplete, calculateZone]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const currentZoneData = ZONES[currentZone - 1];

  return (
    <div className="flex flex-col items-center">
      {/* Circular Timer */}
      <div className="relative w-64 h-64">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r={radius}
            fill="none"
            stroke="#E8F5E9"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            fill="none"
            stroke="#4CAF50"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          {/* Zone indicators */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * 90 - 90) * (Math.PI / 180);
            const x = 128 + (radius + 20) * Math.cos(angle);
            const y = 128 + (radius + 20) * Math.sin(angle);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={currentZone > i ? '#4CAF50' : '#E0E0E0'}
                  className="transition-colors duration-300"
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-gray-800">{formatTime(timeRemaining)}</span>
          <span className="text-sm text-gray-500 mt-1">din 2:00</span>
        </div>
      </div>

      {/* Current Zone Info */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-3">
          <span className="text-2xl">{currentZoneData?.icon}</span>
          <span className="font-bold">Zona {currentZone}/4: {currentZoneData?.name}</span>
        </div>
        <p className="text-gray-600 text-lg">{currentZoneData?.description}</p>
      </div>

      {/* Zone Progress Bar */}
      <div className="w-full max-w-md mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          {ZONES.map((z) => (
            <span key={z.id} className={currentZone >= z.id ? 'text-green-600 font-semibold' : ''}>
              {z.name.split(' ')[0]}
            </span>
          ))}
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
            style={{ width: `${(currentZone / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-6">
        {!isActive ? (
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-lg shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Play className="w-6 h-6" />
            Să începem!
          </button>
        ) : (
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-bold shadow-lg"
          >
            <Pause className="w-5 h-5" />
            Pauză
          </button>
        )}
      </div>
    </div>
  );
}

export { ZONES };
