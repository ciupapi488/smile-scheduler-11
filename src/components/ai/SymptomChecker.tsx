import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Calendar,
  ArrowRight,
  Sparkles,
  Info,
  Activity,
  MapPin,
  Thermometer,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/hooks/useLanguage';
import { API_URL } from '@/api';

interface SymptomResult {
  urgency: string;
  urgencyLabel: string;
  possibleCause: string;
  recommendedService: string;
  confidence: number;
  score: number;
  color: 'red' | 'orange' | 'blue';
  toothDescription: string | null;
}

interface Answers {
  mainSymptom?: string;
  painType?: string;
  painLevel?: number;
  duration?: string;
  swellingLocation?: string;
  hasPus?: boolean;
  bleedingType?: string;
  sensitivityType?: string;
  brokenType?: string;
  discolorationType?: string;
  toothNumber?: number;
  modifiers?: string[];
}

export default function SymptomChecker() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [error, setError] = useState('');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Încarcă istoric din localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('ai-check-history');
    if (savedHistory) {
      // Poate fi folosit pentru a afișa istoricul
      console.log('History loaded:', JSON.parse(savedHistory));
    }
  }, []);

  const handleAnswer = (key: keyof Answers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleModifierToggle = (modifier: string) => {
    setAnswers(prev => {
      const current = prev.modifiers || [];
      if (current.includes(modifier)) {
        return { ...prev, modifiers: current.filter(m => m !== modifier) };
      }
      return { ...prev, modifiers: [...current, modifier] };
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/ai/symptom-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: { ...answers, toothNumber: selectedTooth },
          language 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        // Salvează în istoric
        const history = JSON.parse(localStorage.getItem('ai-check-history') || '[]');
        history.push({ date: new Date().toISOString(), answers, result: data });
        localStorage.setItem('ai-check-history', JSON.stringify(history.slice(-10))); // Păstrează ultimele 10
      } else {
        setError(data.error || 'Error analyzing symptoms');
      }
    } catch (err) {
      setError(language === 'en' ? 'Connection error. Please try again.' : 'Eroare de conexiune. Încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (result?.recommendedService) {
      sessionStorage.setItem('recommendedService', result.recommendedService);
    }
    if (selectedTooth) {
      sessionStorage.setItem('selectedTooth', selectedTooth.toString());
    }
    navigate('/rezervare');
  };

  const getStepProgress = () => {
    const totalSteps = answers.mainSymptom === 'discoloration' ? 3 : 4;
    return (step / totalSteps) * 100;
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!answers.mainSymptom;
      case 2: 
        if (answers.mainSymptom === 'pain') return !!answers.painType && !!answers.painLevel;
        if (answers.mainSymptom === 'swelling') return !!answers.swellingLocation;
        if (answers.mainSymptom === 'bleeding') return !!answers.bleedingType;
        if (answers.mainSymptom === 'sensitivity') return !!answers.sensitivityType;
        if (answers.mainSymptom === 'broken') return !!answers.brokenType;
        if (answers.mainSymptom === 'discoloration') return !!answers.discolorationType;
        return false;
      case 3: return !!answers.duration;
      case 4: return !!selectedTooth;
      default: return false;
    }
  };

  // HARTĂ DENTARĂ SVG
  const ToothMap = () => {
    const upperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const lowerTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

    const getToothFill = (num: number) => {
      if (selectedTooth === num) return '#2563eb'; // blue-600
      // Colorare diferită pentru zone
      if ([1, 16, 17, 32].includes(num)) return '#e5e7eb'; // wisdom - gray
      if ([6, 11, 22, 27].includes(num)) return '#fef3c7'; // canines - amber
      if ([2, 3, 14, 15, 18, 19, 30, 31].includes(num)) return '#dbeafe'; // molars - blue
      return '#f3f4f6'; // default
    };

    return (
      <div className="bg-white p-4 rounded-xl border-2 border-blue-100">
        <p className="text-sm text-center text-gray-600 mb-4">
          {language === 'en' ? 'Click on the affected tooth' : 'Click pe dintele afectat'}
        </p>
        
        {/* Arcada superioară */}
        <div className="flex justify-center gap-1 mb-2 flex-wrap">
          {upperTeeth.map(num => (
            <button
              key={num}
              onClick={() => setSelectedTooth(num)}
              className={`w-8 h-10 rounded-t-lg border-2 transition-all hover:scale-110 ${
                selectedTooth === num ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300'
              }`}
              style={{ backgroundColor: getToothFill(num) }}
              title={language === 'en' ? `Tooth ${num}` : `Dinte ${num}`}
            >
              <span className="text-xs font-medium">{num}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="h-8 bg-pink-50 rounded-lg mb-2 flex items-center justify-center">
          <span className="text-xs text-pink-300">{language === 'en' ? 'Gums' : 'Gingii'}</span>
        </div>

        {/* Arcada inferioară */}
        <div className="flex justify-center gap-1 flex-wrap">
          {lowerTeeth.map(num => (
            <button
              key={num}
              onClick={() => setSelectedTooth(num)}
              className={`w-8 h-10 rounded-b-lg border-2 transition-all hover:scale-110 ${
                selectedTooth === num ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300'
              }`}
              style={{ backgroundColor: getToothFill(num) }}
              title={language === 'en' ? `Tooth ${num}` : `Dinte ${num}`}
            >
              <span className="text-xs font-medium">{num}</span>
            </button>
          ))}
        </div>

        {selectedTooth && (
          <div className="mt-4 text-center">
            <Badge variant="secondary" className="text-sm">
              {language === 'en' ? `Selected: Tooth ${selectedTooth}` : `Selectat: Dinte ${selectedTooth}`}
            </Badge>
          </div>
        )}

        {/* Legendă */}
        <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>{language === 'en' ? 'Molars' : 'Molari'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-100 rounded"></div>
            <span>{language === 'en' ? 'Canines' : 'Canini'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>{language === 'en' ? 'Wisdom' : 'Molușe'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Conținut pe pași
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'What symptom do you have?' : 'Ce simptom aveți?'}
            </h3>
            <RadioGroup 
              value={answers.mainSymptom} 
              onValueChange={(v) => handleAnswer('mainSymptom', v)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {[
                { value: 'pain', label: language === 'en' ? 'Pain' : 'Durere', icon: Activity },
                { value: 'swelling', label: language === 'en' ? 'Swelling' : 'Umflătură', icon: AlertCircle },
                { value: 'bleeding', label: language === 'en' ? 'Bleeding' : 'Sângerare', icon: AlertTriangle },
                { value: 'sensitivity', label: language === 'en' ? 'Sensitivity' : 'Sensibilitate', icon: Thermometer },
                { value: 'broken', label: language === 'en' ? 'Broken tooth' : 'Dinte rupt', icon: AlertCircle },
                { value: 'discoloration', label: language === 'en' ? 'Dark spot/discoloration' : 'Pete închise la culoare', icon: MapPin },
              ].map((option) => (
                <Label
                  key={option.value}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    answers.mainSymptom === option.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <option.icon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{option.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        );

      case 2:
        // Întrebări specifice în funcție de simptom
        if (answers.mainSymptom === 'pain') {
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'en' ? 'What type of pain?' : 'Ce tip de durere?'}
                </h3>
                <RadioGroup 
                  value={answers.painType} 
                  onValueChange={(v) => handleAnswer('painType', v)}
                  className="space-y-2"
                >
                  {[
                    { value: 'pulsating', label: language === 'en' ? 'Throbbing/Pulsating' : 'Pulsativă/Bate' },
                    { value: 'constant', label: language === 'en' ? 'Constant/Continuous' : 'Continuă/Permanentă' },
                    { value: 'bite_only', label: language === 'en' ? 'Only when biting' : 'Doar la mușcătură' },
                    { value: 'spontaneous', label: language === 'en' ? 'Spontaneous' : 'Spontană (fără motiv)' },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        answers.painType === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <RadioGroupItem value={option.value} />
                      <span>{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'en' ? 'Pain intensity (1-10)' : 'Intensitate durere (1-10)'}
                </h3>
                <div className="px-2">
                  <Slider
                    value={[answers.painLevel || 5]}
                    onValueChange={([v]) => handleAnswer('painLevel', v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>1 - {language === 'en' ? 'Mild' : 'Ușoară'}</span>
                    <span className="font-bold text-blue-600">{answers.painLevel || 5}</span>
                    <span>10 - {language === 'en' ? 'Extreme' : 'Extremă'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (answers.mainSymptom === 'swelling') {
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'en' ? 'Where is the swelling?' : 'Unde este umflătura?'}
                </h3>
                <RadioGroup 
                  value={answers.swellingLocation} 
                  onValueChange={(v) => handleAnswer('swellingLocation', v)}
                  className="space-y-2"
                >
                  {[
                    { value: 'face', label: language === 'en' ? 'Face/Cheek' : 'Față/Obraz' },
                    { value: 'gum', label: language === 'en' ? 'Gum' : 'Gingie' },
                    { value: 'inside_mouth', label: language === 'en' ? 'Inside mouth' : 'Interior gură' },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        answers.swellingLocation === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <RadioGroupItem value={option.value} />
                      <span>{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {answers.swellingLocation === 'gum' && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <Label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox 
                      checked={answers.hasPus}
                      onCheckedChange={(v) => handleAnswer('hasPus', v)}
                    />
                    <span className="text-amber-800 font-medium">
                      {language === 'en' ? 'There is pus/discharge' : 'Are puroi/secreție'}
                    </span>
                  </Label>
                </div>
              )}
            </div>
          );
        }

        // Alte simptome - formulare simplificate
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'Please describe the symptom details' : 'Vă rugăm să descrieți detaliile simptomului'}
            </h3>
            <RadioGroup 
              value={answers.bleedingType || answers.sensitivityType || answers.brokenType || answers.discolorationType} 
              onValueChange={(v) => {
                if (answers.mainSymptom === 'bleeding') handleAnswer('bleedingType', v);
                if (answers.mainSymptom === 'sensitivity') handleAnswer('sensitivityType', v);
                if (answers.mainSymptom === 'broken') handleAnswer('brokenType', v);
                if (answers.mainSymptom === 'discoloration') handleAnswer('discolorationType', v);
              }}
              className="space-y-2"
            >
              {answers.mainSymptom === 'bleeding' && [
                { value: 'heavy', label: language === 'en' ? 'Heavy bleeding' : 'Sângerare abundentă' },
                { value: 'gum_when_brushing', label: language === 'en' ? 'Gum bleeding when brushing' : 'Sângerare gingie la periaj' },
                { value: 'spontaneous', label: language === 'en' ? 'Spontaneous bleeding' : 'Sângerare spontană' },
              ].map((option) => (
                <Label key={option.value} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                  <RadioGroupItem value={option.value} />
                  <span>{option.label}</span>
                </Label>
              ))}

              {answers.mainSymptom === 'sensitivity' && [
                { value: 'thermal', label: language === 'en' ? 'To hot/cold' : 'La cald/rece' },
                { value: 'sweet', label: language === 'en' ? 'To sweet' : 'La dulce' },
                { value: 'pressure', label: language === 'en' ? 'To pressure' : 'La presiune' },
              ].map((option) => (
                <Label key={option.value} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                  <RadioGroupItem value={option.value} />
                  <span>{option.label}</span>
                </Label>
              ))}

              {answers.mainSymptom === 'broken' && [
                { value: 'crown_minor', label: language === 'en' ? 'Minor chip (small piece)' : 'Așchiere minoră' },
                { value: 'crown_major', label: language === 'en' ? 'Major crown fracture' : 'Fractură majoră coroană' },
                { value: 'root', label: language === 'en' ? 'Root/tooth knocked out' : 'Rădăcină/dinte scos' },
              ].map((option) => (
                <Label key={option.value} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                  <RadioGroupItem value={option.value} />
                  <span>{option.label}</span>
                </Label>
              ))}

              {answers.mainSymptom === 'discoloration' && [
                { value: 'dark_spot', label: language === 'en' ? 'Dark spot/brown' : 'Pete închise/maronii' },
                { value: 'gray', label: language === 'en' ? 'Gray tooth' : 'Dinte cenușiu' },
                { value: 'yellow_brown', label: language === 'en' ? 'Yellow-brown stains' : 'Pete galben-maronii' },
              ].map((option) => (
                <Label key={option.value} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                  <RadioGroupItem value={option.value} />
                  <span>{option.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'How long have you had these symptoms?' : 'De cât timp aveți aceste simptome?'}
            </h3>
            <RadioGroup 
              value={answers.duration} 
              onValueChange={(v) => handleAnswer('duration', v)}
              className="space-y-2"
            >
              {[
                { value: 'hours', label: language === 'en' ? 'Hours' : 'Ore' },
                { value: 'days', label: language === 'en' ? 'Days' : 'Zile' },
                { value: 'weeks', label: language === 'en' ? 'Weeks' : 'Săptămâni' },
                { value: 'months', label: language === 'en' ? 'Months' : 'Luni' },
              ].map((option) => (
                <Label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                    answers.duration === option.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <RadioGroupItem value={option.value} />
                  <span>{option.label}</span>
                </Label>
              ))}
            </RadioGroup>

            {/* Factori adiționali */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3">
                {language === 'en' ? 'Any of the following?' : 'Vreuna dintre următoarele?'}
              </p>
              <div className="space-y-2">
                {[
                  { value: 'fever', label: language === 'en' ? 'Fever' : 'Febră' },
                  { value: 'difficulty_opening', label: language === 'en' ? 'Difficulty opening mouth' : 'Dificultate în deschiderea gurii' },
                  { value: 'difficulty_swallowing', label: language === 'en' ? 'Difficulty swallowing' : 'Dificultate la înghițire' },
                  { value: 'ear_pain', label: language === 'en' ? 'Ear pain' : 'Durere de ureche' },
                  { value: 'headache', label: language === 'en' ? 'Headache' : 'Durere de cap' },
                ].map((modifier) => (
                  <Label key={modifier.value} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox 
                      checked={answers.modifiers?.includes(modifier.value)}
                      onCheckedChange={() => handleModifierToggle(modifier.value)}
                    />
                    <span className="text-sm">{modifier.label}</span>
                  </Label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'Select the affected tooth' : 'Selectați dintele afectat'}
            </h3>
            <ToothMap />
          </div>
        );

      default:
        return null;
    }
  };

  if (result) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg border-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            {language === 'en' ? 'Analysis Complete' : 'Analiză Completă'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Scor vizual */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              result.color === 'red' ? 'bg-red-100 text-red-800' :
              result.color === 'orange' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {result.color === 'red' ? <AlertCircle className="h-5 w-5" /> :
               result.color === 'orange' ? <Clock className="h-5 w-5" /> :
               <CheckCircle className="h-5 w-5" />}
              <span className="font-bold text-lg">{result.urgencyLabel}</span>
            </div>
          </div>

          <Progress value={result.confidence} className="h-2" />
          <p className="text-center text-sm text-gray-500">
            {language === 'en' ? 'Confidence' : 'Încredere'}: {result.confidence}%
          </p>

          {/* Rezultate */}
          <div className="space-y-3 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">{language === 'en' ? 'Possible cause' : 'Posibilă cauză'}</p>
              <p className="font-medium text-gray-900">{result.possibleCause}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">{language === 'en' ? 'Recommended service' : 'Serviciu recomandat'}</p>
              <p className="font-medium text-blue-900">{result.recommendedService}</p>
            </div>

            {result.toothDescription && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">{language === 'en' ? 'Affected tooth' : 'Dinte afectat'}</p>
                <p className="font-medium text-green-900">{result.toothDescription}</p>
              </div>
            )}
          </div>

          {/* Butoane */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setStep(1);
                setAnswers({});
                setSelectedTooth(null);
                setResult(null);
              }}
              className="flex-1"
            >
              {language === 'en' ? 'Start Over' : 'Reia'}
            </Button>
            <Button 
              onClick={handleBooking}
              className="flex-1"
              variant={result.color === 'red' ? 'destructive' : 'default'}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Book Now' : 'Programează-te'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-blue-900">
              {language === 'en' ? 'AI Dental Assistant' : 'Asistent AI Dentar'}
            </h3>
            <p className="text-sm font-normal text-blue-600">
              {language === 'en' ? 'Step-by-step symptom evaluation' : 'Evaluare pas cu pas a simptomelor'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{language === 'en' ? 'Step' : 'Pas'} {step} {language === 'en' ? 'of' : 'din'} {answers.mainSymptom === 'discoloration' ? 3 : 4}</span>
            <span>{Math.round(getStepProgress())}%</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Back' : 'Înapoi'}
          </Button>

          {step < (answers.mainSymptom === 'discoloration' ? 3 : 4) ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || loading}
            >
              {language === 'en' ? 'Next' : 'Continuă'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleAnalyze}
              disabled={!canProceed() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Analyzing...' : 'Se analizează...'}
                </>
              ) : (
                <>
                  {language === 'en' ? 'Get Results' : 'Vezi Rezultatul'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
