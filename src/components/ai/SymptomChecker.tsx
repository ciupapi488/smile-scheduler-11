import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Calendar,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { API_URL } from '@/api';

interface SymptomResult {
  urgency: string;
  possibleCause: string;
  recommendedService: string;
  confidence: number;
  color: 'red' | 'orange' | 'blue';
}

export default function SymptomChecker() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError(language === 'en' 
        ? 'Please describe your symptoms' 
        : 'Vă rugăm să descrieți simptomele');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/symptom-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symptoms,
          language 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || data.errorEn || 'Error analyzing symptoms');
      }
    } catch (err) {
      setError(language === 'en' 
        ? 'Connection error. Please try again.' 
        : 'Eroare de conexiune. Încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    // Store recommended service in sessionStorage to pre-fill booking form
    if (result?.recommendedService) {
      sessionStorage.setItem('recommendedService', result.recommendedService);
    }
    navigate('/rezervare');
  };

  const getUrgencyColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyIcon = (color: string) => {
    switch (color) {
      case 'red':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'orange':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const exampleSymptoms = language === 'en' 
    ? [
        "I have severe toothache on the left side, throbbing pain",
        "My gum is swollen and bleeding",
        "I need a routine checkup and cleaning",
        "I broke a tooth while eating"
      ]
    : [
        "Mă doare măseaua din stânga, durere pulsativă",
        "Am gingia umflată și sângerează",
        "Vreau un control de rutină și detartraj",
        "Mi-am spart un dinte la masă"
      ];

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
              {language === 'en' 
                ? 'Describe your symptoms and get instant guidance' 
                : 'Descrieți simptomele și primiți îndrumare instant'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-700">
            {language === 'en' 
              ? 'This tool provides general guidance only. For accurate diagnosis, please consult our dentists.' 
              : 'Acest instrument oferă doar îndrumare generală. Pentru diagnostic precis, consultați medicii noștri.'}
          </AlertDescription>
        </Alert>

        {/* Input Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            {language === 'en' ? 'Describe your symptoms' : 'Descrieți simptomele'}
          </label>
          <Textarea
            placeholder={language === 'en' 
              ? "Example: I have severe toothache on the left side for 2 days..." 
              : "Exemplu: Mă doare măseaua din stânga de 2 zile, durere pulsativă..."}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={loading}
          />
          
          {/* Example Symptoms */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">
              {language === 'en' ? 'Examples:' : 'Exemple:'}
            </span>
            {exampleSymptoms.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setSymptoms(example)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                disabled={loading}
              >
                {example.length > 30 ? example.substring(0, 30) + '...' : example}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analyze Button */}
        <Button 
          onClick={handleAnalyze}
          disabled={loading || !symptoms.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {language === 'en' ? 'Analyzing...' : 'Se analizează...'}
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              {language === 'en' ? 'Analyze Symptoms' : 'Analizează Simptomele'}
            </>
          )}
        </Button>

        {/* Results Section */}
        {result && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {language === 'en' ? 'Analysis Result' : 'Rezultat Analiză'}
              </h4>

              {/* Urgency Level */}
              <div className={`p-4 rounded-lg border ${getUrgencyColor(result.color)} mb-4`}>
                <div className="flex items-center gap-3">
                  {getUrgencyIcon(result.color)}
                  <div>
                    <p className="text-sm font-medium opacity-80">
                      {language === 'en' ? 'Urgency Level' : 'Nivel Urgență'}
                    </p>
                    <p className="text-lg font-bold">{result.urgency}</p>
                  </div>
                </div>
              </div>

              {/* Possible Cause */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {language === 'en' ? 'Possible Cause' : 'Posibilă Cauză'}
                </p>
                <p className="text-gray-900">{result.possibleCause}</p>
              </div>

              {/* Recommended Service */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-blue-600 mb-1">
                  {language === 'en' ? 'Recommended Service' : 'Serviciu Recomandat'}
                </p>
                <p className="text-blue-900 font-medium">{result.recommendedService}</p>
              </div>

              {/* Confidence Score */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>
                  {language === 'en' ? 'Analysis confidence' : 'Încredere analiză'}
                </span>
                <Badge variant="outline" className="font-mono">
                  {result.confidence}%
                </Badge>
              </div>

              {/* Book Appointment Button */}
              <Button 
                onClick={handleBooking}
                className="w-full"
                size="lg"
                variant={result.color === 'red' ? 'destructive' : 'default'}
              >
                <Calendar className="h-5 w-5 mr-2" />
                {language === 'en' ? 'Book Appointment Now' : 'Programează-te Acum'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              {/* Disclaimer */}
              <p className="text-xs text-gray-400 text-center mt-3">
                {language === 'en' 
                  ? '* This is not a medical diagnosis. Please consult a dentist for professional evaluation.' 
                  : '* Acesta nu este un diagnostic medical. Consultați un dentist pentru evaluare profesională.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
