// ============================================
// AI Dental Symptom Checker - Sistem de Scoring Ponderat
// ============================================

const express = require('express');
const router = express.Router();

// ============================================
// SISTEM DE SCORING CU REGULI PONDERATE
// ============================================

const SCORING_RULES = {
  // Durere - Tip și intensitate
  pain: {
    type: {
      pulsating: { score: 12, diagnosis: 'pulpita', urgency: 'high' },
      constant: { score: 8, diagnosis: 'infectie', urgency: 'medium' },
      bite_only: { score: 5, diagnosis: 'caries', urgency: 'low' },
      spontaneous: { score: 10, diagnosis: 'pulpita', urgency: 'high' }
    },
    level: [
      { min: 1, max: 3, score: 3, label: 'mild' },
      { min: 4, max: 6, score: 6, label: 'moderate' },
      { min: 7, max: 8, score: 12, label: 'severe' },
      { min: 9, max: 10, score: 18, label: 'extreme', urgency: 'immediate' }
    ]
  },
  
  // Umflătură
  swelling: {
    face: { score: 20, diagnosis: 'abces', urgency: 'immediate' },
    gum_with_pus: { score: 18, diagnosis: 'abces_gingival', urgency: 'immediate' },
    gum: { score: 8, diagnosis: 'gingivita', urgency: 'medium' },
    inside_mouth: { score: 6, diagnosis: 'infectie', urgency: 'medium' }
  },
  
  // Sângerare
  bleeding: {
    heavy: { score: 15, diagnosis: 'traumatism', urgency: 'high' },
    gum_when_brushing: { score: 4, diagnosis: 'gingivita', urgency: 'low' },
    spontaneous: { score: 12, diagnosis: 'afectiune_general', urgency: 'high' }
  },
  
  // Sensibilitate
  sensitivity: {
    thermal_mild: { score: 3, diagnosis: 'sensibilitate_dentinara', urgency: 'low' },
    thermal_severe: { score: 10, diagnosis: 'caries_profunda', urgency: 'high' },
    sweet: { score: 5, diagnosis: 'caries', urgency: 'medium' },
    pressure: { score: 8, diagnosis: 'fisura', urgency: 'medium' }
  },
  
  // Dinte rupt/deteriorat
  broken_tooth: {
    crown_minor: { score: 6, diagnosis: 'fractura_coronara', urgency: 'medium' },
    crown_major: { score: 12, diagnosis: 'fractura_complicata', urgency: 'high' },
    root: { score: 18, diagnosis: 'fractura_radiculara', urgency: 'immediate' }
  },
  
  // Culoare
  discoloration: {
    dark_spot: { score: 5, diagnosis: 'caries', urgency: 'low' },
    gray: { score: 10, diagnosis: 'dinte_mort', urgency: 'medium' },
    yellow_brown: { score: 3, diagnosis: 'pigmentare', urgency: 'low' }
  },
  
  // Factori multiplicatori (modificatori)
  duration: {
    hours: 1.2,
    days: 1.5,
    weeks: 0.8,  // Cronic = mai puțin urgent
    months: 0.6
  },
  
  // Factori adiționali
  modifiers: {
    fever: { score: 15, urgency: 'immediate', diagnosis: 'infectie_spread' },
    difficulty_opening: { score: 12, urgency: 'immediate' },
    difficulty_swallowing: { score: 20, urgency: 'immediate' },
    ear_pain: { score: 8, diagnosis: 'mandibular_issue' },
    headache: { score: 5 }
  }
};

// Mapări pentru servicii recomandate
const SERVICE_RECOMMENDATIONS = {
  pulpita: 'Consultație + Tratament endodontic (canal)',
  abces: 'Urgență - Drenaj + Tratament antibiotic',
  abces_gingival: 'Urgență - Drenaj + Igienizare',
  gingivita: 'Consultație + Detartraj + Igienizare',
  caries: 'Obturație (plombă)',
  caries_profunda: 'Consultație + Radiografie + Obturație',
  fractura_coronara: 'Reconstrucție coroană',
  fractura_complicata: 'Urgență - Reconstrucție/Extracție',
  fractura_radiculara: 'Urgență - Extracție',
  dinte_mort: 'Tratament canal sau Extracție',
  sensibilitate_dentinara: 'Tratament desensibilizare + Igienizare',
  infectie: 'Consultație + Tratament antibiotic',
  infectie_spread: 'Urgență - Spitalizare + Tratament IV',
  pigmentare: 'Albire profesională sau Fațete',
  traumatism: 'Urgență - Hemostază și reparație',
  afectiune_general: 'Evaluare medicală completă',
  default: 'Consultație de evaluare'
};

// Sinonime și fuzzy matching pentru română
const FUZZY_MAPPINGS = {
  pain_type: {
    pulsating: ['pulsează', 'bate', 'throbbing', 'pulseaza', 'batai', 'ritmic'],
    constant: ['continuă', 'continua', 'permanentă', 'permanenta', 'mereu', 'constant'],
    bite_only: ['la mușcătură', 'la muscatura', 'când mușc', 'cand musc', 'la presiune'],
    spontaneous: ['spontană', 'spontana', 'fără motiv', 'fara motiv', 'apare singură']
  },
  symptom: {
    durere: ['doare', 'dor', 'dureros', 'dureri', 'doar', 'dureaza'],
    măsea: ['dinte', 'molar', 'canin', 'incisiv', 'molari'],
    umflătură: ['umflat', 'umflătură', 'umflatura', 'gonfiat', 'bubă'],
    gingie: ['gingii', 'gingi', 'gusi', 'gușă'],
    sângerare: ['sângerează', 'sange', 'sânge', 'sangerare']
  }
};

// ============================================
// FUNCTII DE CALCUL
// ============================================

function calculateScore(answers) {
  let totalScore = 0;
  let maxPossibleScore = 0;
  const diagnoses = [];
  const matchedRules = [];
  
  // Procesează durerea
  if (answers.painType) {
    const painRule = SCORING_RULES.pain.type[answers.painType];
    if (painRule) {
      totalScore += painRule.score;
      maxPossibleScore += 15;
      if (painRule.diagnosis) diagnoses.push(painRule.diagnosis);
      matchedRules.push({ type: 'pain_type', value: answers.painType, score: painRule.score });
    }
  }
  
  if (answers.painLevel) {
    const levelRule = SCORING_RULES.pain.level.find(
      r => answers.painLevel >= r.min && answers.painLevel <= r.max
    );
    if (levelRule) {
      totalScore += levelRule.score;
      maxPossibleScore += 20;
      matchedRules.push({ type: 'pain_level', value: answers.painLevel, score: levelRule.score });
    }
  }
  
  // Procesează umflătura
  if (answers.swellingLocation) {
    let swellingKey = answers.swellingLocation;
    if (answers.swellingLocation === 'gum' && answers.hasPus) {
      swellingKey = 'gum_with_pus';
    }
    const swellingRule = SCORING_RULES.swelling[swellingKey];
    if (swellingRule) {
      totalScore += swellingRule.score;
      maxPossibleScore += 25;
      if (swellingRule.diagnosis) diagnoses.push(swellingRule.diagnosis);
      matchedRules.push({ type: 'swelling', value: swellingKey, score: swellingRule.score });
    }
  }
  
  // Procesează sângerarea
  if (answers.bleedingType) {
    const bleedingRule = SCORING_RULES.bleeding[answers.bleedingType];
    if (bleedingRule) {
      totalScore += bleedingRule.score;
      maxPossibleScore += 18;
      if (bleedingRule.diagnosis) diagnoses.push(bleedingRule.diagnosis);
      matchedRules.push({ type: 'bleeding', value: answers.bleedingType, score: bleedingRule.score });
    }
  }
  
  // Procesează sensibilitatea
  if (answers.sensitivityType) {
    const sensKey = answers.sensitivityType + (answers.painLevel <= 3 ? '_mild' : '_severe');
    const sensRule = SCORING_RULES.sensitivity[sensKey] || SCORING_RULES.sensitivity[answers.sensitivityType];
    if (sensRule) {
      totalScore += sensRule.score;
      maxPossibleScore += 12;
      if (sensRule.diagnosis) diagnoses.push(sensRule.diagnosis);
      matchedRules.push({ type: 'sensitivity', value: answers.sensitivityType, score: sensRule.score });
    }
  }
  
  // Procesează dintele rupt
  if (answers.brokenType) {
    const brokenRule = SCORING_RULES.broken_tooth[answers.brokenType];
    if (brokenRule) {
      totalScore += brokenRule.score;
      maxPossibleScore += 22;
      if (brokenRule.diagnosis) diagnoses.push(brokenRule.diagnosis);
      matchedRules.push({ type: 'broken', value: answers.brokenType, score: brokenRule.score });
    }
  }
  
  // Procesează decolorarea
  if (answers.discolorationType) {
    const discRule = SCORING_RULES.discoloration[answers.discolorationType];
    if (discRule) {
      totalScore += discRule.score;
      maxPossibleScore += 12;
      if (discRule.diagnosis) diagnoses.push(discRule.diagnosis);
      matchedRules.push({ type: 'discoloration', value: answers.discolorationType, score: discRule.score });
    }
  }
  
  // Aplică multiplicator de durată
  let durationMultiplier = 1;
  if (answers.duration) {
    durationMultiplier = SCORING_RULES.duration[answers.duration] || 1;
    totalScore *= durationMultiplier;
  }
  
  // Procesează modificatori adiționali
  if (answers.modifiers) {
    answers.modifiers.forEach(mod => {
      const modRule = SCORING_RULES.modifiers[mod];
      if (modRule) {
        totalScore += modRule.score;
        if (modRule.diagnosis) diagnoses.push(modRule.diagnosis);
        matchedRules.push({ type: 'modifier', value: mod, score: modRule.score });
      }
    });
  }
  
  // Determină urgența
  let urgency = 'routine';
  let urgencyLabel = 'Programare rutină';
  let urgencyLabelEn = 'Routine appointment';
  
  // Verifică dacă există reguli cu urgență immediată
  const hasImmediate = matchedRules.some(r => {
    const rule = findRuleUrgency(r.type, r.value);
    return rule === 'immediate';
  });
  
  const hasHigh = matchedRules.some(r => {
    const rule = findRuleUrgency(r.type, r.value);
    return rule === 'high';
  });
  
  if (hasImmediate || totalScore >= 25) {
    urgency = 'immediate';
    urgencyLabel = 'Urgență imediată';
    urgencyLabelEn = 'Immediate emergency';
  } else if (hasHigh || totalScore >= 12) {
    urgency = '24-48h';
    urgencyLabel = 'Programare în 24-48h';
    urgencyLabelEn = 'Schedule within 24-48h';
  }
  
  // Calculează încrederea
  const confidence = Math.min(95, Math.max(40, 
    Math.round((totalScore / Math.max(maxPossibleScore, 30)) * 100)
  ));
  
  // Elimină diagnostice duplicate
  const uniqueDiagnoses = [...new Set(diagnoses)];
  
  return {
    score: Math.round(totalScore),
    urgency,
    urgencyLabel,
    urgencyLabelEn,
    confidence,
    diagnoses: uniqueDiagnoses,
    matchedRules: matchedRules.slice(0, 5), // Primele 5 reguli pentru debugging
    durationMultiplier
  };
}

function findRuleUrgency(type, value) {
  // Helper pentru a găsi urgența unei reguli
  if (type === 'pain_type') return SCORING_RULES.pain.type[value]?.urgency;
  if (type === 'swelling') return SCORING_RULES.swelling[value]?.urgency;
  if (type === 'bleeding') return SCORING_RULES.bleeding[value]?.urgency;
  if (type === 'modifier') return SCORING_RULES.modifiers[value]?.urgency;
  return null;
}

function getPrimaryDiagnosis(diagnoses, answers) {
  if (diagnoses.length === 0) return 'necesita_evaluare';
  
  // Prioritizează diagnosticul
  const priority = ['infectie_spread', 'abces', 'abces_gingival', 'pulpita', 
                    'fractura_radiculara', 'fractura_complicata', 'caries_profunda'];
  
  for (const p of priority) {
    if (diagnoses.includes(p)) return p;
  }
  
  return diagnoses[0];
}

function generatePossibleCauses(diagnoses, answers, language) {
  const causes = {
    ro: {
      pulpita: 'Posibilă pulpită (inflamație pulpară)',
      abces: 'Posibil abces dentar cu răspândire',
      abces_gingival: 'Posibil abces gingival sau parodontal',
      gingivita: 'Gingivită sau parodontoză incipientă',
      caries: 'Carie dentară',
      caries_profunda: 'Carie profundă aproape de pulpă',
      fractura_coronara: 'Fractură coronară',
      fractura_complicata: 'Fractură complicată cu afectare pulpară',
      fractura_radiculara: 'Fractură radiculară',
      dinte_mort: 'Dinte necrozat (necroză pulpară)',
      sensibilitate_dentinara: 'Sensibilitate dentinară',
      infectie: 'Infecție dentară localizată',
      infectie_spread: 'Infecție dentară cu răspândire regională',
      pigmentare: 'Pigmentare dentară extrinsecă',
      traumatism: 'Traumatism dento-alveolar',
      afectiune_general: 'Afecțiune care necesită evaluare generală',
      necesita_evaluare: 'Necesită evaluare clinică pentru diagnostic precis'
    },
    en: {
      pulpita: 'Possible pulpitis (pulpal inflammation)',
      abces: 'Possible dental abscess with spread',
      abces_gingival: 'Possible gingival or periodontal abscess',
      gingivita: 'Gingivitis or early periodontitis',
      caries: 'Dental cavity',
      caries_profunda: 'Deep cavity near pulp',
      fractura_coronara: 'Crown fracture',
      fractura_complicata: 'Complicated fracture with pulpal involvement',
      fractura_radiculara: 'Root fracture',
      dinte_mort: 'Necrotic tooth (pulpal necrosis)',
      sensibilitate_dentinara: 'Dentin hypersensitivity',
      infectie: 'Localized dental infection',
      infectie_spread: 'Dental infection with regional spread',
      pigmentare: 'Extrinsic dental staining',
      traumatism: 'Dento-alveolar trauma',
      afectiune_general: 'Condition requiring general evaluation',
      necesita_evaluare: 'Requires clinical evaluation for accurate diagnosis'
    }
  };
  
  const lang = language === 'en' ? 'en' : 'ro';
  
  if (diagnoses.length === 0) {
    return causes[lang].necesita_evaluare;
  }
  
  // Returnează primele 2 diagnostice
  return diagnoses.slice(0, 2).map(d => causes[lang][d] || d).join(' / ');
}

function getRecommendedService(primaryDiagnosis) {
  return SERVICE_RECOMMENDATIONS[primaryDiagnosis] || SERVICE_RECOMMENDATIONS.default;
}

function getToothDescription(toothNumber, language) {
  const teeth = {
    1: { ro: 'Molar 3 dreapta sus', en: 'Upper right wisdom tooth' },
    2: { ro: 'Molar 2 dreapta sus', en: 'Upper right 2nd molar' },
    3: { ro: 'Molar 1 dreapta sus', en: 'Upper right 1st molar' },
    4: { ro: 'Premolar 2 dreapta sus', en: 'Upper right 2nd premolar' },
    5: { ro: 'Premolar 1 dreapta sus', en: 'Upper right 1st premolar' },
    6: { ro: 'Canin dreapta sus', en: 'Upper right canine' },
    7: { ro: 'Incisiv lateral dreapta sus', en: 'Upper right lateral incisor' },
    8: { ro: 'Incisiv central dreapta sus', en: 'Upper right central incisor' },
    9: { ro: 'Incisiv central stânga sus', en: 'Upper left central incisor' },
    10: { ro: 'Incisiv lateral stânga sus', en: 'Upper left lateral incisor' },
    11: { ro: 'Canin stânga sus', en: 'Upper left canine' },
    12: { ro: 'Premolar 1 stânga sus', en: 'Upper left 1st premolar' },
    13: { ro: 'Premolar 2 stânga sus', en: 'Upper left 2nd premolar' },
    14: { ro: 'Molar 1 stânga sus', en: 'Upper left 1st molar' },
    15: { ro: 'Molar 2 stânga sus', en: 'Upper left 2nd molar' },
    16: { ro: 'Molar 3 stânga sus', en: 'Upper left wisdom tooth' },
    17: { ro: 'Molar 3 stânga jos', en: 'Lower left wisdom tooth' },
    18: { ro: 'Molar 2 stânga jos', en: 'Lower left 2nd molar' },
    19: { ro: 'Molar 1 stânga jos', en: 'Lower left 1st molar' },
    20: { ro: 'Premolar 2 stânga jos', en: 'Lower left 2nd premolar' },
    21: { ro: 'Premolar 1 stânga jos', en: 'Lower left 1st premolar' },
    22: { ro: 'Canin stânga jos', en: 'Lower left canine' },
    23: { ro: 'Incisiv lateral stânga jos', en: 'Lower left lateral incisor' },
    24: { ro: 'Incisiv central stânga jos', en: 'Lower left central incisor' },
    25: { ro: 'Incisiv central dreapta jos', en: 'Lower right central incisor' },
    26: { ro: 'Incisiv lateral dreapta jos', en: 'Lower right lateral incisor' },
    27: { ro: 'Canin dreapta jos', en: 'Lower right canine' },
    28: { ro: 'Premolar 1 dreapta jos', en: 'Lower right 1st premolar' },
    29: { ro: 'Premolar 2 dreapta jos', en: 'Lower right 2nd premolar' },
    30: { ro: 'Molar 1 dreapta jos', en: 'Lower right 1st molar' },
    31: { ro: 'Molar 2 dreapta jos', en: 'Lower right 2nd molar' },
    32: { ro: 'Molar 3 dreapta jos', en: 'Lower right wisdom tooth' }
  };
  
  const lang = language === 'en' ? 'en' : 'ro';
  return teeth[toothNumber]?.[lang] || (language === 'en' ? `Tooth ${toothNumber}` : `Dinte ${toothNumber}`);
}

// ============================================
// ENDPOINTS
// ============================================

// POST /api/ai/symptom-check
router.post('/symptom-check', async (req, res) => {
  try {
    const { answers, language = 'ro' } = req.body;
    
    console.log('AI Symptom Check:', { answers, language });
    
    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ 
        error: language === 'en' ? 'Please answer the questions' : 'Vă rugăm să răspundeți la întrebări',
        errorEn: 'Please answer the questions'
      });
    }
    
    // Calculează scorul
    const calculation = calculateScore(answers);
    
    // Determină diagnosticul principal
    const primaryDiagnosis = getPrimaryDiagnosis(calculation.diagnoses, answers);
    
    // Generează descrierea
    const possibleCause = generatePossibleCauses(calculation.diagnoses, answers, language);
    
    // Obține serviciul recomandat
    const recommendedService = getRecommendedService(primaryDiagnosis);
    
    // Descriere dinte (dacă există)
    const toothDescription = answers.toothNumber ? 
      getToothDescription(answers.toothNumber, language) : null;
    
    // Construiește răspunsul
    const response = {
      urgency: calculation.urgency,
      urgencyLabel: calculation.urgencyLabel,
      urgencyLabelEn: calculation.urgencyLabelEn,
      possibleCause,
      recommendedService,
      confidence: calculation.confidence,
      score: calculation.score,
      primaryDiagnosis,
      possibleDiagnoses: calculation.diagnoses,
      toothDescription,
      color: calculation.urgency === 'immediate' ? 'red' : 
             calculation.urgency === '24-48h' ? 'orange' : 'blue',
      timestamp: new Date().toISOString()
    };
    
    // Salvează în istoric (opțional - pentru analiză)
    console.log('AI Result:', response);
    
    res.json(response);
    
  } catch (err) {
    console.error('AI Symptom Check Error:', err);
    res.status(500).json({ 
      error: language === 'en' ? 'Error analyzing symptoms. Please try again.' : 'Eroare la analiza simptomelor. Încercați din nou.',
      errorEn: 'Error analyzing symptoms. Please try again.'
    });
  }
});

// GET /api/ai/health - Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'AI Dental Symptom Checker',
    version: '2.0.0',
    features: ['wizard-interface', 'weighted-scoring', 'tooth-map']
  });
});

module.exports = router;
