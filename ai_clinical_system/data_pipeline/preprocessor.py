#!/usr/bin/env python3
"""
DIALOGUE Medical Dataset Preprocessor
Processes DIALOGUE-21 medical corpora for dental symptom classification
"""

import json
import re
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path
import numpy as np
from tqdm import tqdm

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MedicalDialogue:
    """Structured medical dialogue from DIALOGUE format"""
    dialogue_id: str
    context: List[Dict[str, str]]  # List of {speaker, text} turns
    symptoms: List[str]
    diagnosis: Optional[str]
    urgency_level: int  # 1-10
    specialty: str
    language: str  # 'ru', 'en', 'ro'
    metadata: Dict

@dataclass
class ProcessedCase:
    """Processed case ready for model training"""
    case_id: str
    patient_description: str
    extracted_symptoms: Dict
    urgency_score: int
    diagnosis_category: str
    icd10_code: Optional[str]
    recommended_specialty: str
    similar_cases: List[str]
    confidence_factors: Dict


class DialoguePreprocessor:
    """Main preprocessor for DIALOGUE medical datasets"""
    
    # Dental/oral health keywords for filtering
    DENTAL_KEYWORDS = [
        'tooth', 'teeth', 'dental', 'oral', 'gum', 'gingiva', 'molar', 'premolar',
        'incisor', 'canine', 'wisdom', 'caries', 'cavity', 'pulpitis', 'abscess',
        'extraction', 'root canal', 'filling', 'crown', 'bridge', 'denture',
        'periodontitis', 'gingivitis', 'stomatitis', 'ulcer', 'pain', 'ache',
        'sensitivity', 'bleeding', 'swelling', 'fracture', 'trauma', 'bruxism',
        'malocclusion', 'orthodontic', 'implant', 'alveolitis', 'pericoronitis',
        'зуб', 'дентал', 'орал', 'десна', 'моляр', 'кариес', 'пульпит',
        'абсцесс', 'экстракция', 'пломба', 'коронка', 'пародонтит', 'стоматит'
    ]
    
    # Uncertainty markers for complexity scoring
    UNCERTAINTY_MARKERS = [
        'maybe', 'perhaps', 'i think', 'not sure', 'don\'t know', 'unclear',
        'possibly', 'might be', 'could be', 'seems like', 'probably',
        'может быть', 'не знаю', 'не уверен', 'возможно', 'кажется'
    ]
    
    # Temporal patterns for duration extraction
    TEMPORAL_PATTERNS = {
        'hours': r'\b(hour|hours|hr|hrs|ora|ore)\b',
        'days': r'\b(day|days|zi|zile)\b',
        'weeks': r'\b(week|weeks|saptamana|săptămână)\b',
        'months': r'\b(month|months|luna|lună)\b',
        'years': r'\b(year|years|an|ani)\b'
    }
    
    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_config(config_path)
        self.case_counter = 0
        
    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Load preprocessing configuration"""
        default_config = {
            'min_dialogue_length': 3,
            'max_dialogue_length': 50,
            'urgency_thresholds': {
                'immediate': (8, 10),
                'urgent_24h': (6, 7),
                'routine': (1, 5)
            },
            'languages': ['en', 'ru', 'ro'],
            'translation_model': 'facebook/nllb-200-distilled-600M'
        }
        
        if config_path and Path(config_path).exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def is_dental_related(self, text: str) -> bool:
        """Check if text is dental/oral health related"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.DENTAL_KEYWORDS)
    
    def extract_duration(self, text: str) -> Tuple[str, int]:
        """Extract duration mentioned in text"""
        text_lower = text.lower()
        
        for duration_type, pattern in self.TEMPORAL_PATTERNS.items():
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            if matches:
                # Try to extract number
                number_pattern = r'(\d+)\s*' + pattern
                num_matches = re.findall(number_pattern, text_lower, re.IGNORECASE)
                if num_matches:
                    return duration_type, int(num_matches[0])
                return duration_type, 1
        
        return 'unknown', 0
    
    def calculate_urgency_score(self, dialogue: MedicalDialogue) -> int:
        """
        Calculate urgency score 1-10 based on DIALOGUE methodology
        Higher score = more urgent
        """
        score = 5  # Base score
        full_text = ' '.join([turn['text'] for turn in dialogue.context])
        text_lower = full_text.lower()
        
        # Pain indicators
        pain_keywords = ['severe pain', 'intense pain', 'excruciating', 'unbearable',
                        'severe', 'intense', 'severe', 'intensă']
        if any(kw in text_lower for kw in pain_keywords):
            score += 2
        
        # Emergency indicators
        emergency_keywords = ['swelling', 'fever', 'bleeding', 'trauma', 'accident',
                             'knocked out', 'avulsed', 'umflătură', 'febră', 'sângerare']
        if any(kw in text_lower for kw in emergency_keywords):
            score += 2
        
        # Duration factor
        duration_type, duration_num = self.extract_duration(full_text)
        if duration_type == 'hours' and duration_num < 6:
            score += 1  # Acute onset
        elif duration_type == 'days' and duration_num > 7:
            score -= 1  # Chronic
        
        # Uncertainty penalty (complex cases)
        uncertainty_count = sum(1 for marker in self.UNCERTAINTY_MARKERS 
                               if marker in text_lower)
        if uncertainty_count > 2:
            score += 1  # Complex case needs attention
        
        # Dialogue length factor (longer = more complex)
        if len(dialogue.context) > 20:
            score += 1
        
        return max(1, min(10, score))
    
    def extract_symptoms(self, text: str) -> Dict:
        """Extract structured symptoms from text"""
        text_lower = text.lower()
        
        # Pain location extraction
        locations = []
        location_patterns = [
            (r'upper\s+(right|left)\s+(molar|incisor|canine|premolar)', 'upper'),
            (r'lower\s+(right|left)\s+(molar|incisor|canine|premolar)', 'lower'),
            (r'wisdom\s+tooth', 'wisdom'),
            (r'gum', 'gum'),
            (r'jaw', 'jaw')
        ]
        
        for pattern, loc_type in location_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                locations.extend([f"{loc_type}_{m[1] if isinstance(m, tuple) else m}" 
                                for m in matches])
        
        # Pain type extraction
        pain_types = []
        pain_patterns = {
            'throbbing': r'\b(throbbing|pulsating|pulsat|bate)\b',
            'sharp': r'\b(sharp|stabbing|shooting|intepatura)\b',
            'dull': r'\b(dull|ache|constant|continuu)\b',
            'sensitive': r'\b(sensitive|sensibil|reactiv)\b'
        }
        
        for pain_type, pattern in pain_patterns.items():
            if re.search(pattern, text_lower):
                pain_types.append(pain_type)
        
        # Pain level extraction
        pain_level = 0
        pain_level_patterns = [
            r'pain\s+(is\s+)?(\d+)/10',
            r'pain\s+level\s+(\d+)',
            r'(\d+)\s*out\s*of\s*10'
        ]
        for pattern in pain_level_patterns:
            match = re.search(pattern, text_lower)
            if match:
                pain_level = int(match.group(2) or match.group(1))
                break
        
        # Visual signs
        visual_signs = []
        visual_keywords = ['swelling', 'redness', 'pus', 'cavity', 'fracture', 
                          'dark spot', 'gray', 'bleeding']
        for keyword in visual_keywords:
            if keyword in text_lower:
                visual_signs.append(keyword)
        
        return {
            'locations': locations,
            'pain_types': pain_types,
            'pain_level': pain_level,
            'visual_signs': visual_signs,
            'duration': self.extract_duration(text)
        }
    
    def process_dialogue(self, raw_dialogue: Dict) -> Optional[ProcessedCase]:
        """Process a single DIALOGUE-format dialogue"""
        try:
            # Extract dialogue components
            context = raw_dialogue.get('context', [])
            full_text = ' '.join([turn.get('text', '') for turn in context])
            
            # Filter non-dental cases
            if not self.is_dental_related(full_text):
                return None
            
            # Create MedicalDialogue object
            dialogue = MedicalDialogue(
                dialogue_id=raw_dialogue.get('id', f'case_{self.case_counter}'),
                context=context,
                symptoms=raw_dialogue.get('symptoms', []),
                diagnosis=raw_dialogue.get('diagnosis'),
                urgency_level=0,  # Will be calculated
                specialty=raw_dialogue.get('specialty', 'general_dentistry'),
                language=raw_dialogue.get('language', 'en'),
                metadata=raw_dialogue.get('metadata', {})
            )
            
            # Calculate urgency
            dialogue.urgency_level = self.calculate_urgency_score(dialogue)
            
            # Extract symptoms
            extracted_symptoms = self.extract_symptoms(full_text)
            
            # Determine urgency category
            urgency_cat = 'routine'
            if dialogue.urgency_level >= 8:
                urgency_cat = 'immediate'
            elif dialogue.urgency_level >= 6:
                urgency_cat = 'urgent_24h'
            
            self.case_counter += 1
            
            return ProcessedCase(
                case_id=dialogue.dialogue_id,
                patient_description=full_text,
                extracted_symptoms=extracted_symptoms,
                urgency_score=dialogue.urgency_level,
                diagnosis_category=dialogue.diagnosis or 'unknown',
                icd10_code=self._map_to_icd10(dialogue.diagnosis),
                recommended_specialty=dialogue.specialty,
                similar_cases=[],  # Will be populated by similarity search
                confidence_factors={
                    'dialogue_length': len(context),
                    'uncertainty_markers': sum(1 for m in self.UNCERTAINTY_MARKERS 
                                              if m in full_text.lower()),
                    'symptoms_mentioned': len(extracted_symptoms.get('pain_types', [])),
                    'duration_clear': extracted_symptoms['duration'][0] != 'unknown'
                }
            )
            
        except Exception as e:
            logger.error(f"Error processing dialogue {raw_dialogue.get('id')}: {e}")
            return None
    
    def _map_to_icd10(self, diagnosis: Optional[str]) -> Optional[str]:
        """Map diagnosis to ICD-10 code (simplified mapping)"""
        if not diagnosis:
            return None
        
        diagnosis_lower = diagnosis.lower()
        
        icd_mapping = {
            'pulpitis': 'K04.0',
            'apical abscess': 'K04.7',
            'gingivitis': 'K05.0',
            'periodontitis': 'K05.3',
            'dental caries': 'K02.9',
            'tooth fracture': 'S02.5',
            'dry socket': 'K08.1',
            'pericoronitis': 'K05.2',
            'stomatitis': 'K12.1',
            'impacted tooth': 'K01.1'
        }
        
        for key, code in icd_mapping.items():
            if key in diagnosis_lower:
                return code
        
        return None
    
    def process_dataset(self, input_path: str, output_path: str, 
                       batch_size: int = 1000) -> Dict[str, int]:
        """
        Process entire DIALOGUE dataset
        
        Args:
            input_path: Path to raw DIALOGUE JSON file
            output_path: Path for processed output
            batch_size: Number of cases to process per batch
        
        Returns:
            Statistics dict with counts
        """
        logger.info(f"Processing dataset from {input_path}")
        
        # Load raw data
        with open(input_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
        
        # Handle both single dialogue and list formats
        if isinstance(raw_data, dict):
            raw_dialogues = raw_data.get('dialogues', [raw_data])
        else:
            raw_dialogues = raw_data
        
        processed_cases = []
        stats = {
            'total_input': len(raw_dialogues),
            'dental_related': 0,
            'processed_successfully': 0,
            'failed': 0,
            'by_urgency': {'immediate': 0, 'urgent_24h': 0, 'routine': 0},
            'by_language': {}
        }
        
        # Process in batches with progress bar
        for i in tqdm(range(0, len(raw_dialogues), batch_size), desc="Processing batches"):
            batch = raw_dialogues[i:i+batch_size]
            
            for raw_dialogue in batch:
                case = self.process_dialogue(raw_dialogue)
                
                if case:
                    processed_cases.append(case)
                    stats['dental_related'] += 1
                    stats['processed_successfully'] += 1
                    
                    # Update urgency counts
                    if case.urgency_score >= 8:
                        stats['by_urgency']['immediate'] += 1
                    elif case.urgency_score >= 6:
                        stats['by_urgency']['urgent_24h'] += 1
                    else:
                        stats['by_urgency']['routine'] += 1
                else:
                    if self.is_dental_related(str(raw_dialogue)):
                        stats['failed'] += 1
        
        # Save processed data
        output_data = {
            'metadata': {
                'total_cases': len(processed_cases),
                'processing_date': str(np.datetime64('now')),
                'config': self.config
            },
            'cases': [self._case_to_dict(c) for c in processed_cases]
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(processed_cases)} processed cases to {output_path}")
        logger.info(f"Statistics: {stats}")
        
        return stats
    
    def _case_to_dict(self, case: ProcessedCase) -> Dict:
        """Convert ProcessedCase to dictionary"""
        return {
            'case_id': case.case_id,
            'patient_description': case.patient_description,
            'extracted_symptoms': case.extracted_symptoms,
            'urgency_score': case.urgency_score,
            'diagnosis_category': case.diagnosis_category,
            'icd10_code': case.icd10_code,
            'recommended_specialty': case.recommended_specialty,
            'similar_cases': case.similar_cases,
            'confidence_factors': case.confidence_factors
        }


class TranslatorModule:
    """
    Translation module for converting Russian medical dialogues to Romanian
    Uses NLLB-200 or similar open-source models
    """
    
    def __init__(self, model_name: str = 'facebook/nllb-200-distilled-600M'):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        
    def load_model(self):
        """Lazy load translation model"""
        if self.model is None:
            try:
                from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
                
                logger.info(f"Loading translation model: {self.model_name}")
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
                
            except ImportError:
                logger.error("transformers library required for translation")
                raise
    
    def translate(self, text: str, source_lang: str = 'rus', 
                  target_lang: str = 'ron') -> str:
        """
        Translate text from source to target language
        
        Args:
            text: Text to translate
            source_lang: Source language code (ISO 639-3)
            target_lang: Target language code (ISO 639-3)
        
        Returns:
            Translated text
        """
        if not text or not text.strip():
            return text
        
        self.load_model()
        
        # NLLB language codes
        lang_codes = {
            'rus': 'rus_Cyrl',  # Russian
            'eng': 'eng_Latn',  # English
            'ron': 'ron_Latn'   # Romanian
        }
        
        src = lang_codes.get(source_lang, source_lang)
        tgt = lang_codes.get(target_lang, target_lang)
        
        # Translate
        inputs = self.tokenizer(text, return_tensors="pt")
        translated_tokens = self.model.generate(
            **inputs,
            forced_bos_token_id=self.tokenizer.lang_code_to_id[tgt],
            max_length=512
        )
        
        return self.tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]
    
    def translate_dialogue(self, dialogue: Dict, source_lang: str = 'rus') -> Dict:
        """Translate entire dialogue structure"""
        translated = dialogue.copy()
        
        if 'context' in translated:
            for turn in translated['context']:
                if 'text' in turn:
                    turn['text'] = self.translate(turn['text'], source_lang, 'ron')
        
        if 'diagnosis' in translated and translated['diagnosis']:
            translated['diagnosis'] = self.translate(translated['diagnosis'], source_lang, 'ron')
        
        translated['language'] = 'ro'
        return translated


if __name__ == '__main__':
    # Example usage
    preprocessor = DialoguePreprocessor()
    
    # Example: Process a sample dialogue
    sample = {
        'id': 'test_001',
        'context': [
            {'speaker': 'patient', 'text': 'I have severe throbbing pain in my upper right molar for 3 days'},
            {'speaker': 'doctor', 'text': 'Any swelling or sensitivity to hot/cold?'},
            {'speaker': 'patient', 'text': 'Yes, it hurts when I drink cold water'}
        ],
        'symptoms': ['toothache', 'cold sensitivity'],
        'diagnosis': 'Acute Pulpitis',
        'language': 'en'
    }
    
    result = preprocessor.process_dialogue(sample)
    if result:
        print(json.dumps(preprocessor._case_to_dict(result), indent=2))
