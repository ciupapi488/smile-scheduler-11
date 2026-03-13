import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Star, ChevronRight, ChevronLeft, Heart, Shield, Timer, Globe } from 'lucide-react';
import { ToothFairyAvatar } from './ToothFairyAvatar';
import kidsStoriesData from '@/data/kidsStories.json';
import { earnSticker, hasSticker, getEarnedStickers, getTotalStickers, type Sticker } from '@/lib/stickersStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Define the story types
interface StoryChoiceOption {
  text: string;
  correct?: boolean;
  feedback?: string;
  color?: string;
  response?: string;
  funFact?: string;
  region?: string;
  strength?: string;
  damage?: string;
  warning?: string;
  explanation?: string;
  partial?: boolean;
}

interface StoryChoice {
  question: string;
  options: StoryChoiceOption[];
}

interface StoryActivity {
  type: string;
  instruction: string;
}

interface StoryPage {
  text: string;
  illustration: string;
  choice?: StoryChoice;
  activity?: StoryActivity;
  ending?: boolean;
  sticker?: string;
  moral?: string;
}

interface Story {
  id: string;
  title: string;
  emoji: string;
  description: string;
  intro: string;
  pages: StoryPage[];
}

const kidsStories: Story[] = kidsStoriesData as unknown as Story[];

type View = 'menu' | 'story' | 'sticker-book' | 'prep-mode' | 'brushing';

export function ToothFairyKids() {
  const { t, language } = useLanguage();
  const [view, setView] = useState<View>('menu');
  const [selectedStory, setSelectedStory] = useState<typeof kidsStories[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [showNewSticker, setShowNewSticker] = useState<Sticker | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [brushingTime, setBrushingTime] = useState(0);
  const [isBrushing, setIsBrushing] = useState(false);
  const [brushingZone, setBrushingZone] = useState(0);

  // Load stickers on mount
  useEffect(() => {
    setStickers(getEarnedStickers());
  }, []);

  // Speak text when page changes (if enabled)
  useEffect(() => {
    if (selectedStory && view === 'story') {
      const page = selectedStory.pages[currentPage];
      if (page?.text) {
        setIsSpeaking(true);
        const timer = setTimeout(() => setIsSpeaking(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPage, selectedStory, view]);

  const handleStoryComplete = (storyId: string, stickerId: string) => {
    if (!hasSticker(stickerId)) {
      earnSticker(stickerId);
      const definition = { id: stickerId, ...getStickerDefinition(stickerId), earnedAt: new Date().toISOString() };
      setShowNewSticker(definition as Sticker);
      setStickers(getEarnedStickers());
    }
  };

  const getStickerDefinition = (id: string) => {
    const definitions: Record<string, { name: string; emoji: string; description: string }> = {
      brave: { name: 'Curajosul', emoji: '🦁', description: 'Ai fost curajos la dentist!' },
      captain: { name: 'Capitanul Fluor', emoji: '⚔️', description: 'Protector al dintilor!' },
      explorer: { name: 'Exploratorul', emoji: '🔍', description: 'Prima vizita la dentist!' },
      star: { name: 'Steluta', emoji: '⭐', description: 'Dintele tau a cazut!' },
      guardian: { name: 'Gardianul Noptii', emoji: '🌙', description: 'Te periezi seara!' },
      champion: { name: 'Campionul', emoji: '🏆', description: 'Maestru al periajului!' },
      detective: { name: 'Detectivul', emoji: '🕵️', description: 'Ai descoperit bacteriile!' },
      shield: { name: 'Scutul', emoji: '🛡️', description: 'Protejat cu fluor!' },
      smile: { name: 'Zambetul', emoji: '😁', description: 'Aparatul tau e cool!' },
      warrior: { name: 'Razboinicul', emoji: '💪', description: 'Controale regulate!' },
    };
    return definitions[id] || { name: id, emoji: '✨', description: '' };
  };

  const startStory = (story: typeof kidsStories[0]) => {
    setSelectedStory(story);
    setCurrentPage(0);
    setView('story');
  };

  const nextPage = () => {
    if (!selectedStory) return;
    
    if (currentPage < selectedStory.pages.length - 1) {
      setCurrentPage(p => p + 1);
    } else {
      // Story complete
      const endingPage = selectedStory.pages[selectedStory.pages.length - 1];
      if (endingPage.sticker) {
        handleStoryComplete(selectedStory.id, endingPage.sticker);
      }
      setView('menu');
      setSelectedStory(null);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  };

  // Brushing timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBrushing && brushingTime < 120) {
      interval = setInterval(() => {
        setBrushingTime(t => {
          const newTime = t + 1;
          // Change zone every 30 seconds
          setBrushingZone(Math.floor(newTime / 30));
          return newTime;
        });
      }, 1000);
    } else if (brushingTime >= 120) {
      setIsBrushing(false);
    }
    return () => clearInterval(interval);
  }, [isBrushing, brushingTime]);

  const formatBrushingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const BRUSHING_ZONES = [
    { name: { ro: 'Dreapta Sus', en: 'Upper Right' }, icon: '↗️' },
    { name: { ro: 'Stânga Sus', en: 'Upper Left' }, icon: '↖️' },
    { name: { ro: 'Dreapta Jos', en: 'Lower Right' }, icon: '↘️' },
    { name: { ro: 'Stânga Jos', en: 'Lower Left' }, icon: '↙️' },
  ];

  // Menu View
  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-blue-50 p-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center pt-8 pb-6">
          <div className="flex justify-center items-center gap-4 mb-4">
            <ToothFairyAvatar size="lg" />
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-pink-600 mb-2">
            ✨ {language === 'ro' ? 'Zâna Măseluță' : 'Tooth Fairy'} ✨
          </h1>
          <p className="text-lg text-gray-600">{language === 'ro' ? 'Prietena ta pentru dinți sănătoși!' : 'Your friend for healthy teeth!'}</p>
        </div>

        {/* Main Options */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('story')}
            className="bg-white rounded-3xl p-8 shadow-lg border-4 border-pink-200 hover:border-pink-400 transition-colors"
          >
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-pink-600 mb-2">{language === 'ro' ? 'Povești Interactive' : 'Interactive Stories'}</h2>
            <p className="text-gray-600">{language === 'ro' ? 'Aventuri educative despre dinți sănătoși' : 'Educational adventures about healthy teeth'}</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('brushing')}
            className="bg-white rounded-3xl p-8 shadow-lg border-4 border-green-200 hover:border-green-400 transition-colors"
          >
            <div className="text-6xl mb-4">🦖</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">{language === 'ro' ? 'Periază cu Dino' : 'Brush with Dino'}</h2>
            <p className="text-gray-600">{language === 'ro' ? 'Timer de 2 minute pentru periaj corect' : '2-minute timer for proper brushing'}</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('sticker-book')}
            className="bg-white rounded-3xl p-8 shadow-lg border-4 border-yellow-200 hover:border-yellow-400 transition-colors relative"
          >
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">{language === 'ro' ? 'Cartea de Stickere' : 'Sticker Book'}</h2>
            <p className="text-gray-600">{language === 'ro' ? 'Colectează toate autocolantele!' : 'Collect all stickers!'}</p>
            <div className="absolute top-4 right-4 bg-yellow-400 text-white px-3 py-1 rounded-full text-sm font-bold">
              {stickers.length}/{getTotalStickers()}
            </div>
          </motion.button>
        </div>

        {/* Stories Grid */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {language === 'ro' ? 'Alege o poveste:' : 'Choose a story:'}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kidsStories.map((story, index) => (
              <motion.button
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startStory(story)}
                className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all text-left"
              >
                <div className="text-4xl mb-2">{story.emoji}</div>
                <h4 className="font-bold text-gray-800 mb-1">{story.title}</h4>
                <p className="text-sm text-gray-500">{story.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* New Sticker Modal */}
        <AnimatePresence>
          {showNewSticker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowNewSticker(null)}
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-8xl mb-4 animate-bounce">{showNewSticker.emoji}</div>
                <h3 className="text-2xl font-bold text-pink-600 mb-2">
                  {language === 'ro' ? 'Autocolant Nou!' : 'New Sticker!'} 🎉
                </h3>
                <p className="text-xl font-semibold mb-2">{showNewSticker.name}</p>
                <p className="text-gray-600 mb-6">{showNewSticker.description}</p>
                <Button
                  onClick={() => setShowNewSticker(null)}
                  className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-8"
                >
                  {language === 'ro' ? 'Super!' : 'Awesome!'} 🌟
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safety Footer */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm">
            <Shield className="w-4 h-4" />
            <span>{language === 'ro' ? 'Sigur pentru copii • Fără text liber • Doar butoane' : 'Safe for kids • No free text • Buttons only'}</span>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            {language === 'ro' 
              ? 'Zâna Măseluță funcționează offline • Datele rămân pe acest dispozitiv'
              : 'Tooth Fairy works offline • Data stays on this device'}
          </p>
        </div>
      </div>
    );
  }

  // Story View
  if (view === 'story' && selectedStory) {
    const page = selectedStory.pages[currentPage];
    const isLastPage = currentPage === selectedStory.pages.length - 1;

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6 pt-4">
            {selectedStory.pages.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  idx <= currentPage ? 'bg-pink-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Story Card */}
          <Card className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-pink-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setView('menu')}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕ {language === 'ro' ? 'Închide' : 'Close'}
              </button>
              <ToothFairyAvatar size="sm" isSpeaking={isSpeaking} />
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Illustration Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl mb-6 flex items-center justify-center">
                  <span className="text-6xl">{selectedStory.emoji}</span>
                </div>

                {/* Text */}
                <p className="text-xl md:text-2xl leading-relaxed text-gray-800 mb-6 font-medium">
                  {page.text}
                </p>

                {/* Interactive Elements */}
                {page.choice && (
                  <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                    <p className="font-semibold text-blue-800 mb-3">{page.choice.question}</p>
                    <div className="grid gap-2">
                      {page.choice.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if ('feedback' in option && option.feedback) {
                              alert(option.feedback);
                            }
                            if ('color' in option) {
                              // Color selection - just visual feedback
                            }
                            setTimeout(nextPage, 500);
                          }}
                          className="p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={
                            'color' in option
                              ? { backgroundColor: option.color + '20', border: `2px solid ${option.color}` }
                              : { backgroundColor: 'white', border: '2px solid #E5E7EB' }
                          }
                        >
                          {option.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {page.activity && (
                  <div className="bg-yellow-50 rounded-2xl p-4 mb-4 border-2 border-yellow-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Activitate:</span>
                    </div>
                    <p className="text-yellow-700">{page.activity.instruction}</p>
                  </div>
                )}

                {page.ending && page.moral && (
                  <div className="bg-green-50 rounded-2xl p-4 mb-4 border-2 border-green-300">
                    <Heart className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-green-800 font-medium">{page.moral}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" /> {language === 'ro' ? 'Înapoi' : 'Back'}
              </button>
              
              <span className="text-gray-400 text-sm">
                {currentPage + 1} / {selectedStory.pages.length}
              </span>

              <button
                onClick={nextPage}
                className={`flex items-center gap-1 px-6 py-2 rounded-full font-semibold transition-colors ${
                  isLastPage
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                {isLastPage 
                  ? (language === 'ro' ? 'Terminat! 🎉' : 'Finished! 🎉')
                  : (language === 'ro' ? 'Continuă' : 'Continue')}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Sticker Book View
  if (view === 'sticker-book') {
    const allStickerIds = Object.keys({
      brave: {}, captain: {}, explorer: {}, star: {}, guardian: {},
      champion: {}, detective: {}, shield: {}, smile: {}, warrior: {}
    });

    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between py-6">
            <button
              onClick={() => setView('menu')}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <ChevronLeft className="w-5 h-5" /> {language === 'ro' ? 'Înapoi' : 'Back'}
            </button>
            <h1 className="text-3xl font-bold text-yellow-600">🎨 {language === 'ro' ? 'Cartea de Stickere' : 'Sticker Book'}</h1>
            <div className="text-sm font-semibold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
              {stickers.length}/{getTotalStickers()}
            </div>
          </div>

          {/* Sticker Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {allStickerIds.map((id) => {
              const earned = hasSticker(id);
              const def = getStickerDefinition(id);
              
              return (
                <motion.div
                  key={id}
                  whileHover={earned ? { scale: 1.05 } : {}}
                  className={`aspect-square rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                    earned
                      ? 'bg-white shadow-lg border-4 border-yellow-300'
                      : 'bg-gray-100 border-4 border-gray-200 opacity-50'
                  }`}
                >
                  <div className="text-5xl mb-2">{earned ? def.emoji : '❓'}</div>
                  <p className="font-semibold text-sm">{earned ? def.name : '???'}</p>
                  {earned && (
                    <p className="text-xs text-gray-500 mt-1">{def.description}</p>
                  )}
                  {earned && (
                    <Star className="w-4 h-4 text-yellow-400 mt-2 fill-yellow-400" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress Message */}
          <div className="mt-8 text-center">
            {stickers.length === 0 ? (
              <p className="text-gray-500">
                {language === 'ro' 
                  ? 'Citește povești pentru a câștiga autocolante! 📚'
                  : 'Read stories to earn stickers! 📚'}
              </p>
            ) : stickers.length === getTotalStickers() ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-yellow-400 text-white px-6 py-3 rounded-2xl inline-block"
              >
                🎉 {language === 'ro' ? 'Felicitări! Ai colecția completă!' : 'Congratulations! Complete collection!'} 🎉
              </motion.div>
            ) : (
              <p className="text-gray-500">
                {language === 'ro' 
                  ? `Mai ai ${getTotalStickers() - stickers.length} autocolante de descoperit!`
                  : `${getTotalStickers() - stickers.length} more stickers to discover!`}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Brushing Timer View with Dino
  if (view === 'brushing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-green-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between py-6">
            <button
              onClick={() => {
                setIsBrushing(false);
                setBrushingTime(0);
                setBrushingZone(0);
                setView('menu');
              }}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <ChevronLeft className="w-5 h-5" /> {language === 'ro' ? 'Înapoi' : 'Back'}
            </button>
            <h1 className="text-3xl font-bold text-green-600">
              🦖 {language === 'ro' ? 'Periază cu Dino' : 'Brush with Dino'}
            </h1>
            <div className="w-20" />
          </div>

          {/* Dino Mascot */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ 
                y: isBrushing ? [0, -10, 0] : 0,
                rotate: isBrushing ? [0, 5, -5, 0] : 0
              }}
              transition={{ duration: 0.5, repeat: isBrushing ? Infinity : 0 }}
              className="text-8xl"
            >
              🦖
            </motion.div>
          </div>

          {/* Timer Display */}
          <Card className="mb-6 border-green-200">
            <div className="p-8 text-center">
              <div className={`text-7xl font-black mb-4 ${brushingTime >= 120 ? 'text-green-600' : 'text-green-500'}`}>
                {formatBrushingTime(brushingTime)}
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(brushingTime / 120) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-gray-600">
                {isBrushing 
                  ? (language === 'ro' ? 'Periază împreună cu Dino! 🪥' : 'Brush together with Dino! 🪥')
                  : (brushingTime >= 120 
                    ? (language === 'ro' ? 'Bravo! Ai terminat!' : 'Great job! You finished!')
                    : (language === 'ro' ? 'Gata să începi?' : 'Ready to start?'))
                }
              </p>
            </div>
          </Card>

          {/* Current Zone */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {BRUSHING_ZONES.map((zone, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl text-center transition-all ${
                  brushingZone === idx && isBrushing
                    ? 'bg-green-400 text-white scale-110 shadow-lg'
                    : brushingZone > idx
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">{zone.icon}</div>
                <div className="text-xs font-bold">{zone.name[language]}</div>
                {brushingZone === idx && isBrushing && (
                  <div className="text-xs mt-1 animate-pulse">
                    {language === 'ro' ? 'Acum!' : 'Now!'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Zone Instructions */}
          {isBrushing && brushingZone < 4 && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <div className="p-4 text-center">
                <p className="text-lg font-bold text-blue-700">
                  {BRUSHING_ZONES[brushingZone].icon} {BRUSHING_ZONES[brushingZone].name[language]}
                </p>
                <p className="text-blue-600">
                  {brushingZone === 0 && (language === 'ro' ? 'Periază circular, ca un elicopter! 🚁' : 'Brush in circles, like a helicopter! 🚁')}
                  {brushingZone === 1 && (language === 'ro' ? 'Nu uita dinții din spate! 👈' : 'Don\'t forget the back teeth! 👈')}
                  {brushingZone === 2 && (language === 'ro' ? 'Periază ușor gingiile! 🦷' : 'Brush your gums gently! 🦷')}
                  {brushingZone === 3 && (language === 'ro' ? 'Termină tare! Ești aproape gata! 💪' : 'Finish strong! You\'re almost done! 💪')}
                </p>
              </div>
            </Card>
          )}

          {/* Control Button */}
          <div className="flex gap-4 justify-center">
            {!isBrushing && brushingTime < 120 && (
              <Button
                size="lg"
                className="rounded-full px-12 py-6 text-xl font-bold bg-green-500 hover:bg-green-600"
                onClick={() => setIsBrushing(true)}
              >
                ▶️ {language === 'ro' ? 'Start' : 'Start'}
              </Button>
            )}
            
            {isBrushing && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8"
                onClick={() => setIsBrushing(false)}
              >
                ⏸️ {language === 'ro' ? 'Pauză' : 'Pause'}
              </Button>
            )}
            
            {(brushingTime > 0 || isBrushing) && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8"
                onClick={() => {
                  setIsBrushing(false);
                  setBrushingTime(0);
                  setBrushingZone(0);
                }}
              >
                ↻ {language === 'ro' ? 'Reset' : 'Reset'}
              </Button>
            )}
          </div>

          {/* Tips */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>💡 {language === 'ro' ? 'Sfaturi: Periază timp de 2 minute, de 2 ori pe zi!' : 'Tips: Brush for 2 minutes, twice a day!'}</p>
            <p>🪥 {language === 'ro' ? 'Folosește o periuță moale și paste cu fluor!' : 'Use a soft brush and fluoride toothpaste!'}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
