import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Heart, Star, BookOpen, Gift, Clock, ChevronRight, Volume2, VolumeX, Home, Smile, Play, RotateCcw } from 'lucide-react';
import { ToothFairyAvatar } from './ToothFairyAvatar';
import { StoryViewer } from './StoryViewer';
import { StickerBook } from './StickerBook';
import { BreathingExercise } from './BreathingExercise';
import { FoodGame } from './FoodGame';
import { DinoMascot } from './DinoMascot';
import stories from '@/data/kidsStories.json';
import { playRomanianTTS, stopTTS } from '@/utils/tts';
import confetti from 'canvas-confetti';

interface ToothFairyProps {
  childName?: string;
  appointmentDate?: string;
  onComplete?: () => void;
}

interface Sticker {
  id: string;
  name: string;
  emoji: string;
  unlockedAt?: string;
}

interface ChildProgress {
  stickers: Sticker[];
  storiesCompleted: string[];
  dailyMissions: { date: string; completed: boolean }[];
  currentStory?: string;
  storyProgress: number;
}

const STICKERS: Sticker[] = [
  { id: 'brave', name: 'Curajosul', emoji: '🦁' },
  { id: 'gold-brush', name: 'Periuța de Aur', emoji: '🪥' },
  { id: 'healthy-smile', name: 'Zâmbetul Sănătos', emoji: '😁' },
  { id: 'dino-friend', name: 'Prietenul Dinozaurului', emoji: '🦕' },
  { id: 'captain', name: 'Căpitanul Fluor', emoji: '⚡' },
  { id: 'star', name: 'Steaua Zânei', emoji: '⭐' },
  { id: 'shield', name: 'Scutul împotriva Cariilor', emoji: '🛡️' },
  { id: 'magic', name: 'Magicianul Dentar', emoji: '🪄' },
  { id: 'explorer', name: 'Exploratorul Guri', emoji: '🔍' },
  { id: 'helper', name: 'Micul Ajutor', emoji: '🤝' },
  { id: 'champion', name: 'Campionul Periajului', emoji: '🏆' },
  { id: 'detective', name: 'Detectivul Bacteriilor', emoji: '🕵️' },
  { id: 'guardian', name: 'Gardianul Dinților', emoji: '👼' },
  { id: 'warrior', name: 'Războinicul Sănătății', emoji: '⚔️' },
  { id: 'graduate', name: 'Absolventul Zânei', emoji: '🎓' },
];

const DAILY_MISSIONS = [
  'Periază dinții de 2 ori azi!',
  'Bea apă în loc de suc!',
  'Spune "Aaaa" în oglindă și verifică-ți dinții!',
  'Folosește ața dentară!',
  'Mănâncă un măr pentru dinți sănătoși!',
];

export function ToothFairy({ childName = 'Prietene', appointmentDate, onComplete }: ToothFairyProps) {
  const { language } = useLanguage();
  const [mode, setMode] = useState<'home' | 'calm' | 'learn' | 'reward' | 'story' | 'brushing'>('home');
  const [progress, setProgress] = useState<ChildProgress>({
    stickers: [],
    storiesCompleted: [],
    dailyMissions: [],
    storyProgress: 0,
  });
  const [currentStory, setCurrentStory] = useState<typeof stories[0] | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fairyMessage, setFairyMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('toothFairyProgress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('toothFairyProgress', JSON.stringify(progress));
  }, [progress]);

  // Countdown timer
  useEffect(() => {
    if (!appointmentDate) return;
    
    const calculateCountdown = () => {
      const now = new Date();
      const appointment = new Date(appointmentDate);
      const diff = appointment.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('Este azi! 🎉');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        setCountdown(`Mai sunt ${days} zile${hours > 0 ? ` și ${hours} ore` : ''}!`);
      } else {
        setCountdown(`Mai sunt ${hours} ore!`);
      }
    };
    
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 3600000); // Update hourly
    return () => clearInterval(interval);
  }, [appointmentDate]);

  // TTS helper
  const speak = useCallback((text: string) => {
    if (soundEnabled) {
      setIsSpeaking(true);
      playRomanianTTS(text, () => setIsSpeaking(false));
    }
  }, [soundEnabled]);

  const stopSpeaking = () => {
    stopTTS();
    setIsSpeaking(false);
  };

  // Award sticker
  const awardSticker = (stickerId: string, source: 'appointment' | 'story' | 'mission') => {
    const sticker = STICKERS.find(s => s.id === stickerId);
    if (!sticker || progress.stickers.find(s => s.id === stickerId)) return;

    const newSticker = { ...sticker, unlockedAt: new Date().toISOString() };
    setProgress(prev => ({
      ...prev,
      stickers: [...prev.stickers, newSticker],
    }));

    // Confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFB6C1', '#87CEEB', '#FFD700', '#FF69B4'],
    });

    setSelectedSticker(newSticker);
    speak(`Felicitări! Ai câștigat autocolantul ${sticker.name}!`);

    // If all stickers collected, show certificate
    if (progress.stickers.length + 1 === STICKERS.length) {
      setTimeout(() => setShowCertificate(true), 1500);
    }
  };

  // Complete story
  const completeStory = (storyId: string) => {
    if (!progress.storiesCompleted.includes(storyId)) {
      setProgress(prev => ({
        ...prev,
        storiesCompleted: [...prev.storiesCompleted, storyId],
      }));
      
      // Award random sticker for story completion
      const available = STICKERS.filter(s => !progress.stickers.find(ps => ps.id === s.id));
      if (available.length > 0) {
        const random = available[Math.floor(Math.random() * available.length)];
        setTimeout(() => awardSticker(random.id, 'story'), 500);
      }
    }
  };

  // Start a story
  const startStory = (story: typeof stories[0]) => {
    setCurrentStory(story);
    setMode('story');
    speak(story.intro);
  };

  // Get today's mission
  const getTodayMission = () => {
    const today = new Date().toDateString();
    const todayMission = progress.dailyMissions.find(m => m.date === today);
    
    if (!todayMission) {
      const mission = DAILY_MISSIONS[Math.floor(Math.random() * DAILY_MISSIONS.length)];
      setProgress(prev => ({
        ...prev,
        dailyMissions: [...prev.dailyMissions, { date: today, completed: false }],
      }));
      return mission;
    }
    
    return todayMission.completed ? 'Misiunea de azi e gata! Ești super!' : DAILY_MISSIONS[0];
  };

  // Home screen messages
  const homeMessages = [
    `Bună, ${childName}! Sunt Zâna Măseluță! Îmi place să merg la dentist!`,
    `Hei, ${childName}! Periuța Magică și cu mine te așteptăm!`,
    `Salut, ${childName}! Ai grijă de dinții tăi azi?`,
  ];

  useEffect(() => {
    setFairyMessage(homeMessages[Math.floor(Math.random() * homeMessages.length)]);
  }, [childName]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-blue-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ToothFairyAvatar size="sm" isSpeaking={isSpeaking} />
            <span className="font-bold text-pink-600">Zâna Măseluță</span>
          </div>
          
          <div className="flex items-center gap-2">
            {countdown && (
              <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                <Clock className="h-3 w-3 inline mr-1" />
                {countdown}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-pink-500"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* HOME MODE */}
        {mode === 'home' && (
          <div className="space-y-6">
            {/* Fairy Welcome */}
            <Card className="bg-gradient-to-br from-pink-50 to-blue-50 border-pink-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ToothFairyAvatar size="lg" isSpeaking={isSpeaking} />
                  <div className="text-center md:text-left flex-1">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      {fairyMessage}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speak(fairyMessage)}
                      className="mt-3 text-pink-600 border-pink-300"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
      Ascultă
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PROMINENT BRUSHING TIMER */}
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all border-green-300 hover:border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden"
              onClick={() => setMode('brushing')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <DinoMascot size="sm" mood="happy" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-700 text-xl mb-1 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Program de Periaj
                    </h3>
                    <p className="text-gray-600 mb-3">Învață să te periezi corect în 2 minute cu Dino!</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Clock className="h-4 w-4" />
                        <span>2 minute</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Star className="h-4 w-4" />
                        <span>4 zone</span>
                      </div>
                    </div>
                  </div>
                  <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Calm Mode */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-blue-200 hover:border-blue-400"
                onClick={() => setMode('calm')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-blue-700 mb-1">Modul Calm</h3>
                  <p className="text-sm text-gray-600">Povești și exerciții de respirație</p>
                </CardContent>
              </Card>

              {/* Learn Mode */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-green-200 hover:border-green-400"
                onClick={() => setMode('learn')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="font-bold text-green-700 mb-1">Învață</h3>
                  <p className="text-sm text-gray-600">Jocuri educative și periaj</p>
                </CardContent>
              </Card>

              {/* Reward Mode */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-yellow-200 hover:border-yellow-400"
                onClick={() => setMode('reward')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="font-bold text-yellow-700 mb-1">Recompense</h3>
                  <p className="text-sm text-gray-600">
                    {progress.stickers.length}/{STICKERS.length} autocolante
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Daily Mission */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-purple-700 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Misiunea Zilei
                    </h4>
                    <p className="text-gray-700 mt-1">{getTodayMission()}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600"
                    onClick={() => {
                      const today = new Date().toDateString();
                      setProgress(prev => ({
                        ...prev,
                        dailyMissions: prev.dailyMissions.map(m =>
                          m.date === today ? { ...m, completed: true } : m
                        ),
                      }));
                      awardSticker('helper', 'mission');
                    }}
                  >
                    Am făcut!
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl p-4 border border-pink-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Drumul spre dentist</span>
                <span className="text-sm text-pink-600">
                  {Math.round((progress.stickers.length / STICKERS.length) * 100)}%
                </span>
              </div>
              <Progress 
                value={(progress.stickers.length / STICKERS.length) * 100}
                className="h-3"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>🏠 Acasă</span>
                <span>📖 Povești</span>
                <span>🎯 Misiuni</span>
                <span>🏥 Dentist</span>
              </div>
            </div>
          </div>
        )}

        {/* CALM MODE */}
        {mode === 'calm' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setMode('home')} className="mb-4">
              <Home className="h-4 w-4 mr-2" /> Înapoi
            </Button>
            
            <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">
              Modul Calm 💙
            </h2>

            {/* Breathing Exercise */}
            <BreathingExercise onComplete={() => awardSticker('brave', 'mission')} />

            {/* Story Selection */}
            <h3 className="font-bold text-lg text-gray-700 mt-8 mb-4">Alege o poveste:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map(story => (
                <Card
                  key={story.id}
                  className={`cursor-pointer transition-all ${
                    progress.storiesCompleted.includes(story.id)
                      ? 'border-green-400 bg-green-50'
                      : 'border-blue-200 hover:border-blue-400'
                  }`}
                  onClick={() => startStory(story)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{story.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-700">{story.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{story.description}</p>
                        {progress.storiesCompleted.includes(story.id) && (
                          <span className="text-xs text-green-600 font-medium">✓ Citită</span>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STORY MODE */}
        {mode === 'story' && currentStory && (
          <StoryViewer
            story={currentStory}
            onComplete={() => completeStory(currentStory.id)}
            onBack={() => setMode('calm')}
            speak={speak}
          />
        )}

        {/* LEARN MODE */}
        {mode === 'learn' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setMode('home')} className="mb-4">
              <Home className="h-4 w-4 mr-2" /> Înapoi
            </Button>
            
            <h2 className="text-2xl font-bold text-green-700 text-center mb-6">
              Învață cu Zâna Măseluță 📚
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <FoodGame onComplete={() => awardSticker('detective', 'mission')} />
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-green-200 hover:border-green-400"
                onClick={() => setMode('brushing')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="font-bold text-green-700 mb-1">Program de Periaj</h3>
                  <p className="text-sm text-gray-600">Timer de 2 minute cu Dino</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* BRUSHING MODE - Integrated Dino Trainer */}
        {mode === 'brushing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => setMode('home')}>
                <Home className="h-4 w-4 mr-2" /> Înapoi la Zână
              </Button>
              <h2 className="text-xl font-bold text-green-700">Program de Periaj</h2>
              <div className="w-24" />
            </div>
            
            {/* Simple Integrated Brushing Timer */}
            <BrushingTimerSimple 
              onComplete={() => {
                awardSticker('gold-brush', 'mission');
                setMode('home');
              }}
              onBack={() => setMode('home')}
            />
          </div>
        )}

        {/* REWARD MODE */}
        {mode === 'reward' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setMode('home')} className="mb-4">
              <Home className="h-4 w-4 mr-2" /> Înapoi
            </Button>
            
            <StickerBook
              stickers={STICKERS}
              unlocked={progress.stickers}
              onStickerClick={(sticker) => setSelectedSticker(sticker)}
            />
          </div>
        )}
      </main>

      {/* Sticker Award Modal */}
      {selectedSticker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full text-center p-6 animate-bounce">
            <div className="text-6xl mb-4">{selectedSticker.emoji}</div>
            <h3 className="text-xl font-bold text-pink-600 mb-2">
              Ai câștigat un autocolant nou!
            </h3>
            <p className="text-lg font-medium text-gray-700">{selectedSticker.name}</p>
            <Button 
              className="mt-4 w-full bg-pink-500 hover:bg-pink-600"
              onClick={() => setSelectedSticker(null)}
            >
              Super! 🎉
            </Button>
          </Card>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-gradient-to-br from-yellow-50 to-pink-50 border-4 border-yellow-300 p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-yellow-700 mb-2">
    Certificat de Curaj
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                Se acordă lui <strong>{childName}</strong>
              </p>
              <p className="text-gray-600 mb-6">
                pentru că a adunat toate cele 15 autocolante și este un campion al sănătății dentare!
              </p>
              <div className="flex justify-center gap-2 mb-6">
                {STICKERS.map(s => (
                  <span key={s.id} className="text-2xl">{s.emoji}</span>
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Data: {new Date().toLocaleDateString('ro-RO')}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowCertificate(false)}
                >
                  Închide
                </Button>
                <Button 
                  className="flex-1 bg-pink-500 hover:bg-pink-600"
                  onClick={() => {
                    // Print certificate
                    window.print();
                  }}
                >
                  Printează 🖨️
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Simple Brushing Timer Component
interface BrushingTimerSimpleProps {
  onComplete: () => void;
  onBack: () => void;
}

function BrushingTimerSimple({ onComplete, onBack }: BrushingTimerSimpleProps) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentZone, setCurrentZone] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const ZONES = [
    { name: 'Dreapta Sus', icon: '↗️', color: 'bg-blue-400' },
    { name: 'Stânga Sus', icon: '↖️', color: 'bg-green-400' },
    { name: 'Dreapta Jos', icon: '↘️', color: 'bg-yellow-400' },
    { name: 'Stânga Jos', icon: '↙️', color: 'bg-pink-400' },
  ];

  const TOTAL_TIME = 120; // 2 minutes
  const ZONE_TIME = 30; // 30 seconds per zone

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused && seconds < TOTAL_TIME) {
      interval = setInterval(() => {
        setSeconds(s => {
          const newSeconds = s + 1;
          const newZone = Math.min(Math.floor(newSeconds / ZONE_TIME), 3);
          setCurrentZone(newZone);
          
          if (newSeconds >= TOTAL_TIME) {
            setIsActive(false);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            onComplete();
          }
          return newSeconds;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, seconds, onComplete]);

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const resetTimer = () => {
    setSeconds(0);
    setIsActive(false);
    setIsPaused(false);
    setCurrentZone(0);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (seconds / TOTAL_TIME) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Dino Mascot */}
      <div className="flex justify-center mb-6">
        <DinoMascot 
          size="lg" 
          mood={isActive ? 'encouraging' : 'happy'} 
          isSpeaking={isActive && seconds % 5 === 0}
        />
      </div>

      {/* Timer Display */}
      <Card className="mb-6 border-green-200">
        <CardContent className="p-8 text-center">
          <div className="text-7xl font-black text-green-600 mb-4">
            {formatTime(seconds)}
          </div>
          <Progress value={progress} className="h-4 mb-4" />
          <p className="text-gray-600">
            {isActive 
              ? (isPaused ? 'Pauză...' : 'Periază cu Dino! 🪥')
              : 'Gata să începem?'
            }
          </p>
        </CardContent>
      </Card>

      {/* Current Zone */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {ZONES.map((zone, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl text-center transition-all ${
              currentZone === idx && isActive
                ? `${zone.color} text-white scale-110 shadow-lg`
                : currentZone > idx
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <div className="text-3xl mb-1">{zone.icon}</div>
            <div className="text-xs font-bold">{zone.name}</div>
            {currentZone === idx && isActive && (
              <div className="text-xs mt-1 animate-pulse">Acum!</div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      {isActive && currentZone < 4 && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-blue-700">
              {ZONES[currentZone].icon} {ZONES[currentZone].name}
            </p>
            <p className="text-blue-600">
              {currentZone === 0 && 'Periază circular, ca un elicopter! 🚁'}
              {currentZone === 1 && 'Nu uita dinții din spate! 👈'}
              {currentZone === 2 && 'Periază ușor gingiile! 🦷'}
              {currentZone === 3 && 'Termină tare! Ești aproape gata! 💪'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          size="lg"
          className={`rounded-full px-12 py-6 text-xl font-bold ${
            isActive && !isPaused
              ? 'bg-yellow-500 hover:bg-yellow-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
          onClick={toggleTimer}
        >
          {isActive ? (isPaused ? '▶️ Continuă' : '⏸️ Pauză') : '▶️ Start'}
        </Button>
        
        {seconds > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-6"
            onClick={resetTimer}
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>💡 Sfaturi: Periază timp de 2 minute, de 2 ori pe zi!</p>
        <p>🪥 Folosește o periuță moale și paste cu fluor!</p>
      </div>
    </div>
  );
}
