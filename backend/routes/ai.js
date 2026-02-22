// ============================================
// AI Dental Symptom Checker - Rule Based
// ============================================

const express = require('express');
const router = express.Router();

// Keyword mappings for symptom analysis
const SYMPTOM_KEYWORDS = {
  // Emergency (Urgență) - Score: 3
  emergency: {
    keywords: [
      'durere severă', 'durere severa', 'durere puternică', 'durere puternica',
      'umflătură', 'umflatura', 'umflat', 'umflare',
      'sângerare abundentă', 'sangerare abundenta', 'sângerează', 'sangereaza',
      'fractură', 'fractura', 'dinte rupt', 'dinți rupți', 'dinti rupti',
      'extracție urgentă', 'extractie urgenta', 'scos urgent',
      'abces', 'abces dentar', 'puroi', 'fisură', 'fisura',
      'traumatism', 'accident', 'lovit', 'căzut', 'cazut',
      'febră', 'febra', 'frisoane', 'nu pot deschide gura',
      'infecție severă', 'infectie severa', 'gangrenă', 'gangrena'
    ],
    score: 3,
    urgency: 'Urgență',
    urgencyEn: 'Emergency',
    color: 'red'
  },
  
  // 24-48h priority - Score: 2
  priority: {
    keywords: [
      'durere pulsativă', 'durere pulsativa', 'bate', 'pulsează', 'pulseaza',
      'sensibilitate intensă', 'sensibilitate intensa', 'durere la cald',
      'umflătură gingie', 'umflatura gingie', 'gingie umflată', 'gingie inflamată',
      'măsea spartă', 'masea sparta', 'dinte crăpat', 'dinte crapat',
      'plombă căzută', 'plomba cazuta', 'coroană căzută', 'coroana cazuta',
      'durere noaptea', 'nu pot dormi', 'durere persistentă', 'durere persistenta',
      'carii profunde', 'cavitate mare', 'dinte mort', 'neroz'
    ],
    score: 2,
    urgency: 'Programare în 24-48h',
    urgencyEn: 'Schedule within 24-48h',
    color: 'orange'
  },
  
  // Routine - Score: 1
  routine: {
    keywords: [
      'control', 'control periodic', 'verificare', 'consultație', 'consultatie',
      'albire', 'albit', 'albire dentară', 'albire dentara',
      'detartraj', 'curățare', 'curatare', 'igienizare',
      'durere ușoară', 'durere usoara', 'disconfort minor',
      'sensibilitate', 'sensibil', 'durere la rece',
      'plombă', 'plomba', 'umplere',
      'coroană', 'coroana', 'pivot',
      'proteză', 'proteza', 'aparat dentar', 'aparat ortodontic',
      'fațete', 'fațete dentare', 'fatete', 'fatete dentare',
      'îngălbenire', 'ingalbenire', 'pete', 'pete albe',
      'miros urât', 'miros urat', 'respirație urât mirositoare'
    ],
    score: 1,
    urgency: 'Rutină',
    urgencyEn: 'Routine',
    color: 'blue'
  }
};

// Service recommendations based on symptoms
const SERVICE_RECOMMENDATIONS = {
  // Emergency services
  emergency: [
    { condition: ['abces', 'puroi', 'umflătură', 'umflatura', 'febră', 'febra'], service: 'Urgență - Tratament endodontic/Extracție' },
    { condition: ['fractură', 'fractura', 'rupt', 'traumatism', 'accident'], service: 'Urgență - Reconstrucție/Extracție' },
    { condition: ['sângerare', 'sangerare'], service: 'Urgență - Hemostază și tratament' },
    { condition: ['durere severă', 'durere severa', 'nu pot deschide'], service: 'Urgență - Consultație și tratament imediat' }
  ],
  
  // Priority services
  priority: [
    { condition: ['pulsativă', 'pulsativa', 'noaptea', 'dormi'], service: 'Consultație + Tratament canal' },
    { condition: ['plombă căzută', 'plomba cazuta', 'coroană căzută', 'coroana cazuta'], service: 'Refacere lucrare dentară' },
    { condition: ['gingie', 'umflătură gingie', 'sangerare gingie'], service: 'Consultație + Tratament gingival' },
    { condition: ['spart', 'crapat'], service: 'Reconstrucție coronară' }
  ],
  
  // Routine services
  routine: [
    { condition: ['control', 'verificare'], service: 'Consultație de rutină' },
    { condition: ['albire', 'albit'], service: 'Albire dentară profesională' },
    { condition: ['detartraj', 'curățare', 'curatare'], service: 'Detartraj și igienizare' },
    { condition: ['plombă', 'plomba', 'carii'], service: 'Obturație carie' },
    { condition: ['coroană', 'coroana', 'pivot'], service: 'Coroană dentară' },
    { condition: ['fațete', 'fațete', 'fatete'], service: 'Fațete dentare estetice' },
    { condition: ['aparat', 'ortodontic'], service: 'Consultație ortodontică' },
    { condition: ['proteză', 'proteza'], service: 'Proteză dentară' }
  ]
};

// Analyze symptoms and return results
function analyzeSymptoms(symptoms) {
  if (!symptoms || symptoms.trim().length < 3) {
    return {
      urgency: 'Rutină',
      urgencyEn: 'Routine',
      possibleCause: 'Descriere insuficientă pentru analiză',
      possibleCauseEn: 'Insufficient description for analysis',
      recommendedService: 'Consultație generală',
      recommendedServiceEn: 'General consultation',
      confidence: 30,
      color: 'blue'
    };
  }

  const lowerSymptoms = symptoms.toLowerCase();
  let totalScore = 0;
  let matchedKeywords = [];
  let highestUrgency = 'routine';
  let maxScore = 0;

  // Check each category
  Object.entries(SYMPTOM_KEYWORDS).forEach(([category, data]) => {
    let categoryMatches = 0;
    
    data.keywords.forEach(keyword => {
      if (lowerSymptoms.includes(keyword.toLowerCase())) {
        categoryMatches += data.score;
        matchedKeywords.push(keyword);
      }
    });

    if (categoryMatches > maxScore) {
      maxScore = categoryMatches;
      highestUrgency = category;
    }
    
    totalScore += categoryMatches;
  });

  // Determine urgency level
  const urgencyData = SYMPTOM_KEYWORDS[highestUrgency];
  
  // Find recommended service
  const recommendedService = findRecommendedService(lowerSymptoms, highestUrgency);
  
  // Determine possible cause
  const possibleCause = determinePossibleCause(lowerSymptoms, matchedKeywords);
  
  // Calculate confidence based on number of matched keywords and description length
  const confidence = Math.min(95, Math.max(40, 
    matchedKeywords.length * 15 + 
    (lowerSymptoms.length > 50 ? 20 : 10)
  ));

  return {
    urgency: urgencyData.urgency,
    urgencyEn: urgencyData.urgencyEn,
    possibleCause,
    possibleCauseEn: translateToEnglish(possibleCause),
    recommendedService,
    recommendedServiceEn: recommendedService, // Already contains service name
    confidence,
    color: urgencyData.color,
    matchedKeywords: [...new Set(matchedKeywords)] // Remove duplicates
  };
}

function findRecommendedService(symptoms, urgency) {
  const services = SERVICE_RECOMMENDATIONS[urgency] || SERVICE_RECOMMENDATIONS.routine;
  
  for (const service of services) {
    for (const keyword of service.condition) {
      if (symptoms.includes(keyword.toLowerCase())) {
        return service.service;
      }
    }
  }
  
  // Default services based on urgency
  const defaults = {
    emergency: 'Urgență - Consultație imediată',
    priority: 'Consultație în 24-48h',
    routine: 'Consultație de rutină'
  };
  
  return defaults[urgency] || defaults.routine;
}

function determinePossibleCause(symptoms, matchedKeywords) {
  const causes = [];
  
  if (symptoms.includes('abces') || symptoms.includes('puroi') || symptoms.includes('umflătură')) {
    causes.push('Posibil abces dentar');
  }
  if (symptoms.includes('durere pulsativă') || symptoms.includes('noaptea')) {
    causes.push('Posibilă pulpita (inflamație pulpară)');
  }
  if (symptoms.includes('gingie') && (symptoms.includes('sângerare') || symptoms.includes('umflată'))) {
    causes.push('Posibilă gingivită sau parodontoză');
  }
  if (symptoms.includes('sensibilitate') || symptoms.includes('durere la rece')) {
    causes.push('Posibilă eroziune dentinară sau carie');
  }
  if (symptoms.includes('fractură') || symptoms.includes('rupt') || symptoms.includes('spart')) {
    causes.push('Traumatism dentar');
  }
  if (symptoms.includes('carii') || symptoms.includes('cavitate')) {
    causes.push('Carie dentară avansată');
  }
  if (symptoms.includes('albire') || symptoms.includes('îngălbenire')) {
    causes.push('Pigmentare dentară');
  }
  if (symptoms.includes('miros') || symptoms.includes('respirație')) {
    causes.push('Posibilă halenă sau infecție');
  }
  
  if (causes.length === 0) {
    if (matchedKeywords.some(k => SYMPTOM_KEYWORDS.emergency.keywords.includes(k))) {
      return 'Problemă dentară care necesită evaluare urgentă';
    } else if (matchedKeywords.some(k => SYMPTOM_KEYWORDS.priority.keywords.includes(k))) {
      return 'Problemă dentară care necesită evaluare în termen scurt';
    }
    return 'Necesită evaluare clinică pentru diagnostic precis';
  }
  
  return causes.join(' / ');
}

function translateToEnglish(romanianText) {
  const translations = {
    'Posibil abces dentar': 'Possible dental abscess',
    'Posibilă pulpita (inflamație pulpară)': 'Possible pulpitis (pulpal inflammation)',
    'Posibilă gingivită sau parodontoză': 'Possible gingivitis or periodontitis',
    'Posibilă eroziune dentinară sau carie': 'Possible dentin erosion or cavity',
    'Traumatism dentar': 'Dental trauma',
    'Carie dentară avansată': 'Advanced dental cavity',
    'Pigmentare dentară': 'Dental staining',
    'Posibilă halenă sau infecție': 'Possible halitosis or infection',
    'Problemă dentară care necesită evaluare urgentă': 'Dental issue requiring urgent evaluation',
    'Problemă dentară care necesită evaluare în termen scurt': 'Dental issue requiring prompt evaluation',
    'Necesită evaluare clinică pentru diagnostic precis': 'Requires clinical evaluation for accurate diagnosis',
    'Descriere insuficientă pentru analiză': 'Insufficient description for analysis'
  };
  
  return translations[romanianText] || romanianText;
}

// POST /api/ai/symptom-check
router.post('/symptom-check', async (req, res) => {
  try {
    const { symptoms, language = 'ro' } = req.body;
    
    console.log('AI Symptom Check:', { symptoms: symptoms?.substring(0, 100), language });
    
    if (!symptoms || symptoms.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Vă rugăm să descrieți simptomele',
        errorEn: 'Please describe your symptoms'
      });
    }
    
    const result = analyzeSymptoms(symptoms);
    
    // Format response based on language
    const response = {
      urgency: language === 'en' ? result.urgencyEn : result.urgency,
      possibleCause: language === 'en' ? result.possibleCauseEn : result.possibleCause,
      recommendedService: language === 'en' ? result.recommendedServiceEn : result.recommendedService,
      confidence: result.confidence,
      color: result.color,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (err) {
    console.error('AI Symptom Check Error:', err);
    res.status(500).json({ 
      error: 'Eroare la analiza simptomelor. Încercați din nou.',
      errorEn: 'Error analyzing symptoms. Please try again.'
    });
  }
});

// GET /api/ai/health - Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AI Symptom Checker' });
});

module.exports = router;
