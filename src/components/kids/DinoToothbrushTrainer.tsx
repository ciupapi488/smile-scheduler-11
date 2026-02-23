import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Volume2, VolumeX, Camera, Hand, RotateCcw, Trophy, Download, Sparkles } from 'lucide-react';
import { DinoMascot } from './DinoMascot';
import { ToothBrushTimer, ZONES } from './ToothBrushTimer';
import { BacteriaGame } from './BacteriaGame';
import { BrushingCertificate } from './BrushingCertificate';
import { useBrushingProgress } from '@/hooks/useBrushingProgress';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { toPng } from 'html-to-image';

type Stage = 'intro' | 'lesson' | 'brushing' | 'game' | 'complete';

const INTRO_MESSAGES = [
  { text: 'Salut! Sunt Dino și îmi place să am dinți curați!', mood: 'happy' as const },
  { text: 'Hai să învățăm împreună cum să ne periem corect!', mood: 'encouraging' as const },
  { text: 'Bacteriile sunt ca niște monstruleți mici care strică dinții...', mood: 'focused' as const },
  { text: 'Dar noi suntem mai tari decât ele! Să începem?', mood: 'happy' as const },
];

const LESSON_STEPS = [
  { zone: 1, text: 'Zona 1 - Dreapta sus: Periază circular, ca un elicopter! 🚁', icon: '↗️' },
  { zone: 2, text: 'Zona 2 - Stânga sus: Nu uita și dinții din spate! 👈', icon: '↖️' },
  { zone: 3, text: 'Zona 3 - Dreapta jos: Periază ușor gingiile! 🦷', icon: '↘️' },
  { zone: 4, text: 'Zona 4 - Stânga jos: Ești aproape gata! Termină tare! 💪', icon: '↙️' },
];

export function DinoToothbrushTrainer() {
  const { language } = useLanguage();
  const [stage, setStage] = useState<Stage>('intro');
  const [introStep, setIntroStep] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentZone, setCurrentZone] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [useCamera, setUseCamera] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [score, setScore] = useState(0);
  const [bacteriaKilled, setBacteriaKilled] = useState(0);
  const [childName, setChildName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [dinoMood, setDinoMood] = useState<'happy' | 'talking' | 'encouraging' | 'celebrating'>('happy');
  const [dinoSpeaking, setDinoSpeaking] = useState(false);
  
  const certificateRef = useRef<HTMLDivElement>(null);
  const { progress, newBadges, saveSession, clearNewBadges, canBrushToday, getTodayBrushingCount } = useBrushingProgress();

  // Auto-advance intro
  useEffect(() => {
    if (stage === 'intro' && introStep < INTRO_MESSAGES.length) {
      const timer = setTimeout(() => {
        setDinoSpeaking(true);
        setDinoMood(INTRO_MESSAGES[introStep].mood);
        
        const speakTimer = setTimeout(() => {
          setDinoSpeaking(false);
          if (introStep < INTRO_MESSAGES.length - 1) {
            setIntroStep(prev => prev + 1);
          }
        }, 3000);

        return () => clearTimeout(speakTimer);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [stage, introStep]);

  // Brushing button press effect
  useEffect(() => {
    if (stage === 'brushing' && isPressing) {
      const vibrateInterval = setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 500);
      return () => clearInterval(vibrateInterval);
    }
  }, [stage, isPressing]);

  const handleStartLesson = () => {
    setStage('lesson');
    setCurrentZone(1);
  };

  const handleStartBrushing = () => {
    setStage('brushing');
    setIsTimerActive(true);
    setDinoMood('encouraging');
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    setStage('complete');
    setDinoMood('celebrating');
    
    // Save session
    saveSession({
      duration: 120,
      score,
      bacteriaKilled,
      completed: true,
    });
  };

  const handleZoneChange = (zone: number) => {
    setCurrentZone(zone);
    setDinoSpeaking(true);
    setTimeout(() => setDinoSpeaking(false), 2000);
  };

  const handleBacteriaKilled = () => {
    setBacteriaKilled(prev => prev + 1);
  };

  const handleDownloadCertificate = async () => {
    if (certificateRef.current) {
      try {
        const dataUrl = await toPng(certificateRef.current, { quality: 0.95 });
        const link = document.createElement('a');
        link.download = `certificat-periaj-${childName || 'dino'}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error generating certificate:', error);
      }
    }
  };

  const handleRestart = () => {
    setStage('intro');
    setIntroStep(0);
    setCurrentZone(1);
    setScore(0);
    setBacteriaKilled(0);
    setIsTimerActive(false);
    setDinoMood('happy');
    clearNewBadges();
  };

  // INTRO STAGE
  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-green-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
              🦖 Dino Periuța
            </h1>
            <p className="text-lg text-gray-600">Învață să te periezi corect!</p>
          </div>

          {/* Dino */}
          <div className="flex justify-center mb-8">
            <DinoMascot 
              size="lg" 
              mood={dinoMood} 
              isSpeaking={dinoSpeaking}
            />
          </div>

          {/* Speech Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={introStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-6 shadow-lg border-4 border-green-200 mb-6"
            >
              <p className="text-xl text-center text-gray-800 font-medium">
                {INTRO_MESSAGES[introStep]?.text}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {INTRO_MESSAGES.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-colors ${
                  idx === introStep ? 'bg-green-500' : idx < introStep ? 'bg-green-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Start Button */}
          {introStep === INTRO_MESSAGES.length - 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center"
            >
              <Button
                onClick={handleStartLesson}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full px-12 py-6 text-xl font-bold shadow-lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Hai să începem!
              </Button>
            </motion.div>
          )}

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-2xl p-4 shadow">
              <p className="text-3xl font-bold text-green-600">{progress.totalSessions}</p>
              <p className="text-sm text-gray-500">Lecții complete</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow">
              <p className="text-3xl font-bold text-orange-600">{progress.currentStreak}</p>
              <p className="text-sm text-gray-500">Zile consecutive</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow">
              <p className="text-3xl font-bold text-purple-600">{progress.badges.length}</p>
              <p className="text-sm text-gray-500">Insigne</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LESSON STAGE
  if (stage === 'lesson') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
            📚 Cum ne periem corect?
          </h2>

          {/* Zone explanation */}
          <div className="space-y-4 mb-8">
            {LESSON_STEPS.map((step, idx) => (
              <motion.div
                key={step.zone}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.2 }}
                className={`p-4 rounded-2xl border-4 transition-all ${
                  currentZone === step.zone 
                    ? 'bg-green-100 border-green-400 scale-105' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{step.icon}</span>
                  <div>
                    <p className="font-bold text-lg">Zona {step.zone}</p>
                    <p className="text-gray-600">{step.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mouth visual */}
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <p className="text-center text-gray-500 mb-4">Așa arată gura ta - 4 zone de periat:</p>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              {[1, 2, 3, 4].map((zone) => (
                <motion.div
                  key={zone}
                  animate={currentZone === zone ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-bold ${
                    currentZone === zone 
                      ? 'bg-green-400 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {zone}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStage('intro')}>
              ← Înapoi
            </Button>
            <div className="flex gap-2">
              {currentZone > 1 && (
                <Button variant="outline" onClick={() => setCurrentZone(z => z - 1)}>
                  ← Zona anterioară
                </Button>
              )}
              {currentZone < 4 ? (
                <Button onClick={() => setCurrentZone(z => z + 1)}>
                  Zona următoare →
                </Button>
              ) : (
                <Button onClick={handleStartBrushing} className="bg-green-500 hover:bg-green-600">
                  <Play className="w-4 h-4 mr-2" />
                  Începe Periajul!
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BRUSHING STAGE
  if (stage === 'brushing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <h2 className="text-xl font-bold text-green-600">Periază cu Dino!</h2>
            <div className="w-10" />
          </div>

          {/* Dino encouragement */}
          <div className="flex justify-center mb-4">
            <DinoMascot 
              size="md" 
              mood={dinoMood} 
              isSpeaking={currentZone % 2 === 0}
            />
          </div>

          {/* Zone instruction */}
          <div className="bg-white rounded-2xl p-4 text-center mb-4 shadow">
            <p className="text-lg font-bold text-green-600">
              {ZONES[currentZone - 1]?.icon} {ZONES[currentZone - 1]?.name}
            </p>
            <p className="text-gray-600">{ZONES[currentZone - 1]?.description}</p>
          </div>

          {/* Timer */}
          <ToothBrushTimer
            isActive={isTimerActive}
            onComplete={handleTimerComplete}
            onZoneChange={handleZoneChange}
            currentZone={currentZone}
          />

          {/* Practice area */}
          <div className="mt-6">
            <p className="text-center text-gray-600 mb-3">
              {useCamera 
                ? 'Arată-mi periuța la cameră!' 
                : 'Apasă și ține apăsat pe buton să periezi!'}
            </p>

            {/* Toggle mode */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => setUseCamera(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  !useCamera ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}
              >
                <Hand className="w-5 h-5" />
                Cu degetul
              </button>
              <button
                onClick={() => setUseCamera(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  useCamera ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}
              >
                <Camera className="w-5 h-5" />
                Cu camera
              </button>
            </div>

            {/* Brushing button */}
            {!useCamera && (
              <button
                onMouseDown={() => setIsPressing(true)}
                onMouseUp={() => setIsPressing(false)}
                onMouseLeave={() => setIsPressing(false)}
                onTouchStart={() => setIsPressing(true)}
                onTouchEnd={() => setIsPressing(false)}
                className={`w-full py-8 rounded-3xl font-bold text-xl transition-all transform ${
                  isPressing 
                    ? 'bg-green-600 scale-95 shadow-inner' 
                    : 'bg-green-500 hover:bg-green-600 scale-100 shadow-lg'
                } text-white`}
              >
                {isPressing ? '🪥 Periez...' : 'Apasă și ține apăsat!'}
              </button>
            )}
          </div>

          {/* Bacteria game */}
          <div className="mt-6">
            <h3 className="text-center font-bold text-gray-700 mb-2">
              🎯 Vânătoarea de Bacterii
            </h3>
            <BacteriaGame
              isActive={isTimerActive}
              onScoreUpdate={setScore}
              onBacteriaKilled={handleBacteriaKilled}
            />
          </div>
        </div>
      </div>
    );
  }

  // COMPLETE STAGE
  if (stage === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-orange-50 to-yellow-100 p-4">
        <div className="max-w-3xl mx-auto pt-8">
          {/* Celebration header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-4">
              🎉 Bravo! 🎉
            </h1>
            <p className="text-xl text-gray-600">Ai terminat periajul ca un campion!</p>
          </motion.div>

          {/* Dino celebrating */}
          <div className="flex justify-center mb-8">
            <DinoMascot size="lg" mood="celebrating" />
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map((star) => (
              <motion.div
                key={star}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: star * 0.2 }}
                className="text-6xl"
              >
                ⭐
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 text-center shadow">
              <p className="text-3xl">⏱️</p>
              <p className="font-bold text-lg">2:00</p>
              <p className="text-sm text-gray-500">Timp periaj</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow">
              <p className="text-3xl">🎯</p>
              <p className="font-bold text-lg">{score}</p>
              <p className="text-sm text-gray-500">Puncte</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow">
              <p className="text-3xl">🦠</p>
              <p className="font-bold text-lg">{bacteriaKilled}</p>
              <p className="text-sm text-gray-500">Bacterii eliminate</p>
            </div>
          </div>

          {/* New badges */}
          {newBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 mb-8 text-center border-4 border-yellow-300"
            >
              <h3 className="text-xl font-bold text-yellow-700 mb-3">
                <Trophy className="w-6 h-6 inline mr-2" />
                Insigne Noi!
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {newBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-white text-yellow-800 rounded-full font-bold shadow"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Certificate */}
          {showNameInput ? (
            <div className="bg-white rounded-3xl p-6 mb-6">
              <div ref={certificateRef}>
                <BrushingCertificate
                  childName={childName}
                  date={new Date().toLocaleDateString('ro-RO')}
                  score={score}
                  bacteriaKilled={bacteriaKilled}
                  badges={progress.badges}
                />
              </div>
              <Button
                onClick={handleDownloadCertificate}
                className="w-full mt-4 bg-green-500 hover:bg-green-600"
              >
                <Download className="w-5 h-5 mr-2" />
                Descarcă Certificatul
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 mb-6 text-center">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Vrei un certificat?</h3>
              <input
                type="text"
                placeholder="Cum te cheamă?"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full max-w-xs px-4 py-3 rounded-full border-2 border-green-200 text-center text-lg mb-4 focus:outline-none focus:border-green-500"
                maxLength={20}
              />
              <Button
                onClick={() => setShowNameInput(true)}
                disabled={!childName.trim()}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Generează Certificatul!
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="w-5 h-5 mr-2" />
              Începe din nou
            </Button>
            <Button asChild className="bg-green-500 hover:bg-green-600">
              <a href="/zana-maseluta">
                🧚‍♀️ Mergi la Zâna Măseluță
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
