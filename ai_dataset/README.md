# AI Dental Symptom Dataset Generator

A complete dataset generator for training and testing AI-powered dental symptom checkers.

## Features

- **100 Ready-to-Use Examples**: Diverse scenarios covering all dental specialties
- **Rule-Based Generation**: 70% of cases generated from templates
- **Ollama Integration**: 30% enhanced with local LLM for natural variation
- **Weighted Scoring System**: Complex decision logic with multipliers and modifiers
- **Bilingual Support**: English and Romanian
- **Edge Cases**: Pregnant patients, diabetics, children, elderly

## Dataset Structure

### Categories (100 examples total)
- Endodontic: 20 examples (pulpitis, abscess, necrosis)
- Periodontal: 20 examples (gingivitis, periodontitis)
- Restorative: 20 examples (caries, fractures)
- Oral Surgery: 15 examples (extractions, implants)
- Orthodontic: 10 examples (braces issues)
- Pediatric: 10 examples (children's dental issues)
- Emergency: 5 examples (trauma, severe infections)

### Complexity Distribution
- Simple: 40%
- Moderate: 40%
- Complex: 20%

## Files

| File | Description |
|------|-------------|
| `generate_dental_dataset.py` | Python script for generating datasets |
| `dental_dataset_100_examples.json` | 100 pre-generated examples |
| `requirements.txt` | Python dependencies |

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Generate 100 examples (default)
```bash
python generate_dental_dataset.py
```

### Generate 5000 examples with train/test split
```bash
python generate_dental_dataset.py --count 5000 --output dataset.json --split
```

### Enhance with Ollama (requires local LLM)
```bash
python generate_dental_dataset.py --count 500 --ollama-enhance true
```

### Export to CSV
```bash
python generate_dental_dataset.py --csv dataset.csv
```

### Reproducible generation
```bash
python generate_dental_dataset.py --seed 42
```

## Scoring System

The AI uses a weighted scoring algorithm:

```python
# Example calculation for acute pulpitis:
Pulsating pain:     +12 points
Pain level 8/10:    +12 points  
Duration 2 days:    ×1.5 multiplier
No visual signs:    +0 points
Total:              36 points

36 points = URGENCY: 24-48h (immediate if ≥25)
```

### Scoring Rules

| Symptom | Score | Urgency |
|---------|-------|---------|
| Severe pain (8-10) | 15-18 pts | Immediate |
| Pulsating pain | 12 pts | High |
| Facial swelling | 20 pts | Immediate |
| Gum swelling + pus | 18 pts | Immediate |
| Fever | 15 pts | Immediate |
| Duration multiplier | ×1.2-1.5 | Varies |

## Example Output

```json
{
  "scenario_id": "a1b2c3d4-e5f6...",
  "input_description": "I have a throbbing pain in my upper right molar for 3 days...",
  "extracted_symptoms": {
    "pain_location": ["upper right molar"],
    "pain_type": "pulsating",
    "pain_level": 8,
    "duration": "for 3 days",
    "triggers": ["hot", "cold"],
    "visual_signs": ["none"],
    "additional_symptoms": []
  },
  "diagnosis": {
    "primary": "Acute Irreversible Pulpitis",
    "differential": ["Symptomatic Apical Periodontitis"],
    "confidence": 85
  },
  "recommended_action": {
    "urgency": "24-48h",
    "service_type": "Root Canal Treatment",
    "estimated_duration_minutes": 90
  },
  "category": "endodontic",
  "complexity": "moderate",
  "patient_profile": {
    "age": 35,
    "gender": "F",
    "conditions": ["pregnant"]
  }
}
```

## Integration with React App

### API Endpoint
```javascript
POST /api/ai/symptom-check
{
  "answers": {
    "mainSymptom": "pain",
    "painType": "pulsating",
    "painLevel": 8,
    "duration": "days",
    "toothNumber": 16
  },
  "language": "ro"
}
```

### Response
```javascript
{
  "urgency": "24-48h",
  "urgencyLabel": "Programare în 24-48h",
  "possibleCause": "Posibilă pulpita (inflamație pulpară)",
  "recommendedService": "Consultație + Tratament endodontic",
  "confidence": 85,
  "score": 36,
  "color": "orange"
}
```

## Validation Rules

The dataset ensures:
- Pain level 8-10 → urgency "immediate" or "24-48h"
- Fever + swelling → urgency "immediate"
- Visual signs present → higher urgency
- Duration > 1 month + low pain → routine
- No contradictions in symptoms

## Ollama Setup (Optional)

For enhanced descriptions:

1. Install Ollama: https://ollama.ai
2. Pull model: `ollama pull llama3.2`
3. Run server: `ollama serve`
4. Generate with: `--ollama-enhance true`

## Statistics

The script generates statistics after creation:
```
By Category:
  endodontic: 20
  periodontal: 20
  restorative: 20
  oral_surgery: 15
  orthodontic: 10
  pediatric: 10
  emergency: 5

By Complexity:
  simple: 40
  moderate: 40
  complex: 20

By Urgency:
  immediate: 12
  24-48h: 28
  routine: 60
```

## License

MIT License - Free to use for training AI models.
