#!/usr/bin/env python3
"""
AI Dental Symptom Dataset Generator
Generates synthetic but realistic dental scenarios for training/testing AI symptom checkers.
"""

import json
import uuid
import random
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from tqdm import tqdm

# Constants for generation
CATEGORIES = {
    "endodontic": {"count": 20, "examples": []},
    "periodontal": {"count": 20, "examples": []},
    "restorative": {"count": 20, "examples": []},
    "oral_surgery": {"count": 15, "examples": []},
    "orthodontic": {"count": 10, "examples": []},
    "pediatric": {"count": 10, "examples": []},
    "emergency": {"count": 5, "examples": []}
}

# Template variables
PAIN_DESCRIPTORS = ["throbbing", "sharp", "dull ache", "shooting", "tender", "sensitive", "burning", "stabbing"]
LOCATIONS = [
    "upper right molar", "upper left molar", "lower right molar", "lower left molar",
    "upper right premolar", "upper left premolar", "lower right premolar", "lower left premolar",
    "upper right canine", "upper left canine", "lower right canine", "lower left canine",
    "upper right incisor", "upper left incisor", "lower right incisor", "lower left incisor",
    "wisdom tooth", "gums around", "jaw", "whole mouth"
]
DURATIONS = ["since yesterday", "for 3 days", "about a week", "a few hours", "over a month", "for 2 weeks", "since this morning"]
MODIFIERS = [
    "worse at night", "when eating", "with cold water", "with hot drinks", "constantly",
    "comes and goes", "when biting down", "when lying down", "with sweet foods"
]

TRIGGERS = ["cold", "hot", "sweet", "biting", "none"]
VISUAL_SIGNS = ["swelling", "redness", "pus", "cavity", "fracture", "dark_spot", "none"]
ADDITIONAL_SYMPTOMS = ["fever", "bad_taste", "bleeding", "sensitivity", "bad_breath", "difficulty_opening"]

@dataclass
class DentalScenario:
    scenario_id: str
    input_description: str
    extracted_symptoms: Dict[str, Any]
    diagnosis: Dict[str, Any]
    recommended_action: Dict[str, Any]
    category: str
    complexity: str  # simple, moderate, complex
    patient_profile: Dict[str, Any]

class DentalDatasetGenerator:
    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            random.seed(seed)
        self.scenarios = []
        
    def generate_uuid(self) -> str:
        return str(uuid.uuid4())
    
    def validate_scenario(self, scenario: DentalScenario) -> bool:
        """Validate scenario for logical consistency."""
        symptoms = scenario.extracted_symptoms
        action = scenario.recommended_action
        
        # Pain level 8-10 should be immediate or 24-48h
        if symptoms.get("pain_level", 0) >= 8:
            if action["urgency"] not in ["immediate", "24-48h"]:
                return False
        
        # Fever + swelling = immediate
        if "fever" in symptoms.get("additional_symptoms", []) and \
           "swelling" in symptoms.get("visual_signs", []):
            if action["urgency"] != "immediate":
                return False
        
        # No contradictions
        if symptoms.get("pain_level", 0) == 0 and "pain" in scenario.input_description.lower():
            # Check if pain is mentioned but level is 0
            pass  # Allow if described as "no pain"
        
        # Duration > 1 month + low pain = routine
        if symptoms.get("duration") in ["over a month"] and \
           symptoms.get("pain_level", 0) <= 3:
            # Can be routine or 24-48h depending on other factors
            pass
        
        return True
    
    def enhance_with_ollama(self, description: str) -> str:
        """Enhance description using local Ollama if available."""
        try:
            import requests
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": f"Rewrite this dental symptom description to sound more natural and varied, as if a real patient is speaking. Keep the same medical meaning: '{description}'",
                    "stream": False
                },
                timeout=30
            )
            if response.status_code == 200:
                return response.json().get("response", description).strip()
        except Exception:
            pass
        return description

    # ==================== ENDODONTIC SCENARIOS ====================
    def generate_endodontic_scenarios(self) -> List[DentalScenario]:
        """Generate endodontic scenarios (pulpitis, abscess, necrosis)."""
        scenarios = []
        
        templates = [
            # Acute Pulpitis
            {
                "complexity": "moderate",
                "description": "I have a {pain} pain in my {location} {duration}. It's {modifier} and the pain is {pain_level}/10.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "pulsating",
                    "pain_level": 8,
                    "duration": "{duration}",
                    "triggers": ["hot", "cold"],
                    "visual_signs": ["none"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Acute Irreversible Pulpitis",
                    "differential": ["Symptomatic Apical Periodontitis", "Cracked Tooth"],
                    "confidence": 85
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Root Canal Treatment",
                    "estimated_duration_minutes": 90
                }
            },
            # Periapical Abscess
            {
                "complexity": "complex",
                "description": "My {location} has been hurting {duration}, and now there's swelling and I can taste something bad. Pain is {pain_level}/10.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "throbbing",
                    "pain_level": 9,
                    "duration": "{duration}",
                    "triggers": ["biting"],
                    "visual_signs": ["swelling"],
                    "additional_symptoms": ["bad_taste"]
                },
                "diagnosis": {
                    "primary": "Acute Periapical Abscess",
                    "differential": ["Periodontal Abscess", "Cellulitis"],
                    "confidence": 90
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Root Canal or Extraction",
                    "estimated_duration_minutes": 120
                }
            },
            # Necrotic Tooth
            {
                "complexity": "moderate",
                "description": "My {location} has turned gray and there's a pimple on the gum. Sometimes it drains. No pain currently.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "none",
                    "pain_level": 1,
                    "duration": "over a month",
                    "triggers": ["none"],
                    "visual_signs": ["dark_spot"],
                    "additional_symptoms": ["bad_taste"]
                },
                "diagnosis": {
                    "primary": "Pulp Necrosis with Chronic Apical Abscess",
                    "differential": ["Internal Resorption", "Calcific Metamorphosis"],
                    "confidence": 88
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Root Canal Treatment",
                    "estimated_duration_minutes": 90
                }
            },
            # Symptomatic Apical Periodontitis
            {
                "complexity": "simple",
                "description": "When I bite down on my {location}, it hurts. The pain is sharp and {modifier}.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "sharp",
                    "pain_level": 6,
                    "duration": "a few hours",
                    "triggers": ["biting"],
                    "visual_signs": ["none"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Symptomatic Apical Periodontitis",
                    "differential": ["Cracked Tooth", "High Filling"],
                    "confidence": 75
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Endodontic Evaluation",
                    "estimated_duration_minutes": 45
                }
            },
            # Reversible Pulpitis
            {
                "complexity": "simple",
                "description": "My {location} is sensitive to cold but the pain goes away quickly. It's been {duration}.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "sensitive",
                    "pain_level": 4,
                    "duration": "{duration}",
                    "triggers": ["cold"],
                    "visual_signs": ["none"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Reversible Pulpitis",
                    "differential": ["Dentin Hypersensitivity", "Incipient Caries"],
                    "confidence": 80
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Restorative Treatment",
                    "estimated_duration_minutes": 60
                }
            }
        ]
        
        patient_profiles = [
            {"age": 35, "gender": "F", "conditions": ["pregnant"]},
            {"age": 45, "gender": "M", "conditions": ["diabetic"]},
            {"age": 28, "gender": "F", "conditions": []},
            {"age": 62, "gender": "M", "conditions": ["hypertension"]},
        ]
        
        for i in range(20):
            template = random.choice(templates)
            profile = random.choice(patient_profiles)
            
            # Fill template
            desc = template["description"].format(
                pain=random.choice(PAIN_DESCRIPTORS),
                location=random.choice(LOCATIONS),
                duration=random.choice(DURATIONS),
                modifier=random.choice(MODIFIERS),
                pain_level=template["symptoms"]["pain_level"]
            )
            
            symptoms = template["symptoms"].copy()
            symptoms["duration"] = symptoms["duration"].format(duration=random.choice(DURATIONS))
            if "{location}" in symptoms["pain_location"][0]:
                symptoms["pain_location"] = [random.choice(LOCATIONS)]
            
            scenario = DentalScenario(
                scenario_id=self.generate_uuid(),
                input_description=desc,
                extracted_symptoms=symptoms,
                diagnosis=template["diagnosis"],
                recommended_action=template["action"],
                category="endodontic",
                complexity=template["complexity"],
                patient_profile=profile
            )
            
            if self.validate_scenario(scenario):
                scenarios.append(scenario)
        
        return scenarios

    # ==================== PERIODONTAL SCENARIOS ====================
    def generate_periodontal_scenarios(self) -> List[DentalScenario]:
        """Generate periodontal scenarios."""
        scenarios = []
        
        templates = [
            # Gingivitis
            {
                "complexity": "simple",
                "description": "My gums bleed when I brush and they look red. It's been {duration}.",
                "symptoms": {
                    "pain_location": ["gums"],
                    "pain_type": "tender",
                    "pain_level": 2,
                    "duration": "{duration}",
                    "triggers": ["none"],
                    "visual_signs": ["redness", "bleeding"],
                    "additional_symptoms": ["bleeding"]
                },
                "diagnosis": {
                    "primary": "Generalized Gingivitis",
                    "differential": ["Early Periodontitis", "Pregnancy Gingivitis"],
                    "confidence": 90
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Professional Cleaning",
                    "estimated_duration_minutes": 45
                }
            },
            # Periodontal Abscess
            {
                "complexity": "complex",
                "description": "There's a swollen bump on my gum near the {location}. It hurts to touch and I have fever {duration}.",
                "symptoms": {
                    "pain_location": ["gums"],
                    "pain_type": "throbbing",
                    "pain_level": 8,
                    "duration": "{duration}",
                    "triggers": ["none"],
                    "visual_signs": ["swelling", "pus"],
                    "additional_symptoms": ["fever"]
                },
                "diagnosis": {
                    "primary": "Periodontal Abscess",
                    "differential": ["Periapical Abscess", "Gingival Abscess"],
                    "confidence": 85
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Periodontal Treatment",
                    "estimated_duration_minutes": 60
                }
            },
            # Periodontitis
            {
                "complexity": "moderate",
                "description": "My teeth feel loose and my gums have receded. I've noticed bad breath {duration}.",
                "symptoms": {
                    "pain_location": ["whole mouth"],
                    "pain_type": "dull ache",
                    "pain_level": 3,
                    "duration": "over a month",
                    "triggers": ["none"],
                    "visual_signs": ["redness"],
                    "additional_symptoms": ["bad_breath"]
                },
                "diagnosis": {
                    "primary": "Chronic Periodontitis",
                    "differential": ["Aggressive Periodontitis"],
                    "confidence": 88
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Periodontal Evaluation",
                    "estimated_duration_minutes": 60
                }
            },
            # Acute Necrotizing Ulcerative Gingivitis
            {
                "complexity": "complex",
                "description": "My gums are very painful, bleeding, and there's gray stuff between my teeth. I also have fever and bad taste.",
                "symptoms": {
                    "pain_location": ["gums"],
                    "pain_type": "sharp",
                    "pain_level": 9,
                    "duration": "a few hours",
                    "triggers": ["none"],
                    "visual_signs": ["swelling", "redness", "pus"],
                    "additional_symptoms": ["fever", "bad_taste", "bleeding"]
                },
                "diagnosis": {
                    "primary": "Acute Necrotizing Ulcerative Gingivitis",
                    "differential": ["Primary Herpetic Gingivostomatitis"],
                    "confidence": 92
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Periodontal Care",
                    "estimated_duration_minutes": 90
                }
            }
        ]
        
        for i in range(20):
            template = random.choice(templates)
            desc = template["description"].format(
                location=random.choice(LOCATIONS),
                duration=random.choice(DURATIONS)
            )
            
            symptoms = template["symptoms"].copy()
            symptoms["duration"] = random.choice(DURATIONS)
            
            scenario = DentalScenario(
                scenario_id=self.generate_uuid(),
                input_description=desc,
                extracted_symptoms=symptoms,
                diagnosis=template["diagnosis"],
                recommended_action=template["action"],
                category="periodontal",
                complexity=template["complexity"],
                patient_profile={"age": random.randint(25, 65), "gender": random.choice(["M", "F"]), "conditions": []}
            )
            
            if self.validate_scenario(scenario):
                scenarios.append(scenario)
        
        return scenarios

    # ==================== RESTORATIVE SCENARIOS ====================
    def generate_restorative_scenarios(self) -> List[DentalScenario]:
        """Generate restorative scenarios."""
        scenarios = []
        
        templates = [
            # Dental Caries
            {
                "complexity": "simple",
                "description": "I have a brown spot on my {location} and it's sensitive to sweet things {duration}.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "sensitive",
                    "pain_level": 3,
                    "duration": "{duration}",
                    "triggers": ["sweet"],
                    "visual_signs": ["cavity"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Dental Caries (Cavity)",
                    "differential": ["Staining", "Initial Demineralization"],
                    "confidence": 85
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Restorative Filling",
                    "estimated_duration_minutes": 45
                }
            },
            # Lost Filling
            {
                "complexity": "moderate",
                "description": "My filling fell out of my {location} and now there's a hole. It's sensitive {modifier}.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "sensitive",
                    "pain_level": 5,
                    "duration": "since this morning",
                    "triggers": ["cold", "hot"],
                    "visual_signs": ["cavity"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Lost Restoration with Possible Secondary Caries",
                    "differential": ["Fractured Cusp"],
                    "confidence": 90
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Replacement Filling",
                    "estimated_duration_minutes": 60
                }
            },
            # Cracked Tooth
            {
                "complexity": "complex",
                "description": "My {location} cracked when I bit down on something hard. Now it hurts when I chew {pain_level}/10.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "sharp",
                    "pain_level": 7,
                    "duration": "a few hours",
                    "triggers": ["biting"],
                    "visual_signs": ["fracture"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Cracked Tooth Syndrome",
                    "differential": ["Split Tooth", "Cusp Fracture"],
                    "confidence": 82
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Crown or Onlay",
                    "estimated_duration_minutes": 90
                }
            },
            # Wear/Erosion
            {
                "complexity": "moderate",
                "description": "My teeth look shorter and are very sensitive, especially to cold. It's been {duration}.",
                "symptoms": {
                    "pain_location": ["whole mouth"],
                    "pain_type": "sensitive",
                    "pain_level": 4,
                    "duration": "over a month",
                    "triggers": ["cold"],
                    "visual_signs": ["none"],
                    "additional_symptoms": ["sensitivity"]
                },
                "diagnosis": {
                    "primary": "Dental Erosion",
                    "differential": ["Abrasion", "Attrition"],
                    "confidence": 78
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Restorative Consultation",
                    "estimated_duration_minutes": 45
                }
            }
        ]
        
        for i in range(20):
            template = random.choice(templates)
            desc = template["description"].format(
                location=random.choice(LOCATIONS),
                duration=random.choice(DURATIONS),
                modifier=random.choice(MODIFIERS),
                pain_level=template["symptoms"]["pain_level"]
            )
            
            symptoms = template["symptoms"].copy()
            if "{location}" in symptoms["pain_location"][0]:
                symptoms["pain_location"] = [random.choice(LOCATIONS)]
            
            scenario = DentalScenario(
                scenario_id=self.generate_uuid(),
                input_description=desc,
                extracted_symptoms=symptoms,
                diagnosis=template["diagnosis"],
                recommended_action=template["action"],
                category="restorative",
                complexity=template["complexity"],
                patient_profile={"age": random.randint(18, 70), "gender": random.choice(["M", "F"]), "conditions": []}
            )
            
            if self.validate_scenario(scenario):
                scenarios.append(scenario)
        
        return scenarios

    # ==================== ORAL SURGERY SCENARIOS ====================
    def generate_oral_surgery_scenarios(self) -> List[DentalScenario]:
        """Generate oral surgery scenarios."""
        scenarios = []
        
        templates = [
            # Impacted Wisdom Tooth
            {
                "complexity": "moderate",
                "description": "My wisdom tooth in the {location} is hurting and I can feel pressure. It's been {duration}.",
                "symptoms": {
                    "pain_location": ["{location}"],
                    "pain_type": "dull ache",
                    "pain_level": 6,
                    "duration": "{duration}",
                    "triggers": ["none"],
                    "visual_signs": ["swelling"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Impacted Third Molar",
                    "differential": ["Pericoronitis", "Root Resorption of Adjacent Tooth"],
                    "confidence": 85
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Surgical Extraction",
                    "estimated_duration_minutes": 90
                }
            },
            # Post-Extraction Complication
            {
                "complexity": "complex",
                "description": "I had a tooth pulled {duration} ago and now the pain is getting worse. I can see bone in the socket.",
                "symptoms": {
                    "pain_location": ["jaw"],
                    "pain_type": "throbbing",
                    "pain_level": 9,
                    "duration": "3 days",
                    "triggers": ["none"],
                    "visual_signs": ["none"],
                    "additional_symptoms": ["bad_taste"]
                },
                "diagnosis": {
                    "primary": "Alveolar Osteitis (Dry Socket)",
                    "differential": ["Infection", "Fractured Socket"],
                    "confidence": 92
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Socket Treatment",
                    "estimated_duration_minutes": 45
                }
            },
            # Jaw Pain/TMJ
            {
                "complexity": "moderate",
                "description": "My jaw clicks when I open wide and I have pain near my ear. It's worse in the morning.",
                "symptoms": {
                    "pain_location": ["jaw"],
                    "pain_type": "dull ache",
                    "pain_level": 5,
                    "duration": "about a week",
                    "triggers": ["none"],
                    "visual_signs": ["none"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Temporomandibular Disorder (TMD)",
                    "differential": ["Bruxism", "Internal Derangement"],
                    "confidence": 75
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "TMJ Evaluation",
                    "estimated_duration_minutes": 60
                }
            }
        ]
        
        for i in range(15):
            template = random.choice(templates)
            desc = template["description"].format(
                location=random.choice(LOCATIONS),
                duration=random.choice(DURATIONS)
            )
            
            symptoms = template["symptoms"].copy()
            symptoms["duration"] = random.choice(DURATIONS)
            if "{location}" in symptoms["pain_location"][0]:
                symptoms["pain_location"] = [random.choice(LOCATIONS)]
            
            scenario = DentalScenario(
                scenario_id=self.generate_uuid(),
                input_description=desc,
                extracted_symptoms=symptoms,
                diagnosis=template["diagnosis"],
                recommended_action=template["action"],
                category="oral_surgery",
                complexity=template["complexity"],
                patient_profile={"age": random.randint(18, 50), "gender": random.choice(["M", "F"]), "conditions": []}
            )
            
            if self.validate_scenario(scenario):
                scenarios.append(scenario)
        
        return scenarios

    # ==================== ORTHODONTIC SCENARIOS ====================
    def generate_orthodontic_scenarios(self) -> List[DentalScenario]:
        """Generate orthodontic scenarios."""
        scenarios = []
        
        templates = [
            # Braces Pain
            {
                "complexity": "simple",
                "description": "I got braces last week and my teeth are very sore. I can barely chew.",
                "symptoms": {
                    "pain_location": ["whole mouth"],
                    "pain_type": "tender",
                    "pain_level": 5,
                    "duration": "about a week",
                    "triggers": ["biting"],
                    "visual_signs": ["none"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Orthodontic Adjustment Pain",
                    "differential": [],
                    "confidence": 95
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Orthodontic Check",
                    "estimated_duration_minutes": 30
                }
            },
            # Wire Poking
            {
                "complexity": "simple",
                "description": "The wire from my braces is poking my cheek and it really hurts.",
                "symptoms": {
                    "pain_location": ["gums"],
                    "pain_type": "sharp",
                    "pain_level": 6,
                    "duration": "a few hours",
                    "triggers": ["none"],
                    "visual_signs": ["redness"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Orthodontic Wire Irritation",
                    "differential": [],
                    "confidence": 98
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Orthodontic Adjustment",
                    "estimated_duration_minutes": 20
                }
            },
            # Retainer Issues
            {
                "complexity": "simple",
                "description": "My retainer doesn't fit anymore and my teeth feel like they're shifting.",
                "symptoms": {
                    "pain_location": ["whole mouth"],
                    "pain_type": "tender",
                    "pain_level": 2,
                    "duration": "over a month",
                    "triggers": ["none"],
                    "visual_signs": ["none"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Relapse After Orthodontic Treatment",
                    "differential": ["Inadequate Retention"],
                    "confidence": 80
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Orthodontic Consultation",
                    "estimated_duration_minutes": 45
                }
            },
            # Crowding Pain
            {
                "complexity": "moderate",
                "description": "My wisdom teeth are coming in and pushing my other teeth. There's pressure pain.",
                "symptoms": {
                    "pain_location": ["jaw"],
                    "pain_type": "pressure",
                    "pain_level": 4,
                    "duration": "for 2 weeks",
                    "triggers": ["none"],
                    "visual_signs": ["swelling"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Dental Crowding from Erupting Third Molars",
                    "differential": ["Impaction", "Pericoronitis"],
                    "confidence": 78
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Orthodontic Evaluation",
                    "estimated_duration_minutes": 60
                }
            }
        ]
        
        for i in range(10):
            template = random.choice(templates)
            
            scenario = DentalScenario(
                scenario_id=self.generate_uuid(),
                input_description=template["description"],
                extracted_symptoms=template["symptoms"],
                diagnosis=template["diagnosis"],
                recommended_action=template["action"],
                category="orthodontic",
                complexity=template["complexity"],
                patient_profile={"age": random.randint(12, 35), "gender": random.choice(["M", "F"]), "conditions": []}
            )
            
            if self.validate_scenario(scenario):
                scenarios.append(scenario)
        
        return scenarios

    # ==================== PEDIATRIC SCENARIOS ====================
    def generate_pediatric_scenarios(self) -> List[DentalScenario]:
        """Generate pediatric scenarios."""
        scenarios = []
        
        templates = [
            # Teething
            {
                "complexity": "simple",
                "description": "My 8-month-old is drooling a lot, has red cheeks, and is very fussy. No fever.",
                "symptoms": {
                    "pain_location": ["gums"],
                    "pain_type": "tender",
                    "pain_level": 3,
                    "duration": "a few days",
                    "triggers": ["none"],
                    "visual_signs": ["redness", "swelling"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Primary Tooth Eruption (Teething)",
                    "differential": ["Viral Illness"],
                    "confidence": 90
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Pediatric Consultation",
                    "estimated_duration_minutes": 30
                }
            },
            # Early Childhood Caries
            {
                "complexity": "moderate",
                "description": "My 3-year-old has white spots on the front teeth and brown areas near the gums.",
                "symptoms": {
                    "pain_location": ["upper incisor"],
                    "pain_type": "none",
                    "pain_level": 0,
                    "duration": "over a month",
                    "triggers": ["none"],
                    "visual_signs": ["dark_spot"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Early Childhood Caries (ECC)",
                    "differential": ["Fluorosis", "Hypomineralization"],
                    "confidence": 88
                },
                "action": {
                    "urgency": "24-48h",
                    "service_type": "Pediatric Restorative",
                    "estimated_duration_minutes": 60
                }
            },
            # Dental Trauma (Child)
            {
                "complexity": "complex",
                "description": "My 7-year-old fell and hit his front tooth. It's loose and bleeding from the gum.",
                "symptoms": {
                    "pain_location": ["upper incisor"],
                    "pain_type": "sharp",
                    "pain_level": 7,
                    "duration": "a few hours",
                    "triggers": ["none"],
                    "visual_signs": ["fracture", "bleeding"],
                    "additional_symptoms": ["bleeding"]
                },
                "diagnosis": {
                    "primary": "Dental Trauma with Subluxation",
                    "differential": ["Root Fracture", "Luxation"],
                    "confidence": 82
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Pediatric Dentistry",
                    "estimated_duration_minutes": 60
                }
            },
            # Thumb Sucking Effect
            {
                "complexity": "simple",
                "description": "My 5-year-old's front teeth stick out and there's a gap. She still sucks her thumb.",
                "symptoms": {
                    "pain_location": ["whole mouth"],
                    "pain_type": "none",
                    "pain_level": 0,
                    "duration": "over a month",
                    "triggers": ["none"],
                    "visual_signs": ["none"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Habit-induced Malocclusion",
                    "differential": ["Skeletal Open Bite"],
                    "confidence": 85
                },
                "action": {
                    "urgency": "routine",
                    "service_type": "Pediatric Orthodontic Evaluation",
                    "estimated_duration_minutes": 45
                }
            }
        ]
        
        for i in range(10):
            template = random.choice(templates)
            
            scenario = DentalScenario(
                scenario_id=self.generate_uuid(),
                input_description=template["description"],
                extracted_symptoms=template["symptoms"],
                diagnosis=template["diagnosis"],
                recommended_action=template["action"],
                category="pediatric",
                complexity=template["complexity"],
                patient_profile={"age": random.choice([0.5, 3, 5, 7, 10]), "gender": random.choice(["M", "F"]), "conditions": ["child"]}
            )
            
            if self.validate_scenario(scenario):
                scenarios.append(scenario)
        
        return scenarios

    # ==================== EMERGENCY SCENARIOS ====================
    def generate_emergency_scenarios(self) -> List[DentalScenario]:
        """Generate emergency scenarios."""
        scenarios = []
        
        templates = [
            # Avulsed Tooth
            {
                "complexity": "complex",
                "description": "I fell and my front tooth came completely out. I have it in milk. This just happened 20 minutes ago.",
                "symptoms": {
                    "pain_location": ["upper incisor"],
                    "pain_type": "sharp",
                    "pain_level": 8,
                    "duration": "a few hours",
                    "triggers": ["none"],
                    "visual_signs": ["bleeding"],
                    "additional_symptoms": ["bleeding"]
                },
                "diagnosis": {
                    "primary": "Avulsed Permanent Tooth",
                    "differential": ["Alveolar Fracture"],
                    "confidence": 98
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Reimplantation",
                    "estimated_duration_minutes": 90
                }
            },
            # Severe Bleeding
            {
                "complexity": "complex",
                "description": "My extraction site won't stop bleeding. It's been 4 hours and I've changed the gauze 5 times.",
                "symptoms": {
                    "pain_location": ["jaw"],
                    "pain_type": "throbbing",
                    "pain_level": 6,
                    "duration": "4 hours",
                    "triggers": ["none"],
                    "visual_signs": ["bleeding"],
                    "additional_symptoms": ["bleeding"]
                },
                "diagnosis": {
                    "primary": "Post-extraction Hemorrhage",
                    "differential": ["Coagulopathy"],
                    "confidence": 95
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Hemostasis",
                    "estimated_duration_minutes": 45
                }
            },
            # Facial Swelling with Fever
            {
                "complexity": "complex",
                "description": "My face is swollen up to my eye and I have a fever of 39°C. I can barely open my mouth.",
                "symptoms": {
                    "pain_location": ["jaw", "face"],
                    "pain_type": "throbbing",
                    "pain_level": 10,
                    "duration": "2 days",
                    "triggers": ["none"],
                    "visual_signs": ["swelling", "redness"],
                    "additional_symptoms": ["fever", "difficulty_opening"]
                },
                "diagnosis": {
                    "primary": "Odontogenic Cellulitis with Trismus",
                    "differential": ["Abscess", "Parapharyngeal Infection"],
                    "confidence": 90
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Hospital Referral",
                    "estimated_duration_minutes": 120
                }
            },
            # Jaw Fracture
            {
                "complexity": "complex",
                "description": "I was in a car accident and my jaw is crooked. I can't bite down properly and there's numbness.",
                "symptoms": {
                    "pain_location": ["jaw"],
                    "pain_type": "sharp",
                    "pain_level": 9,
                    "duration": "a few hours",
                    "triggers": ["none"],
                    "visual_signs": ["fracture"],
                    "additional_symptoms": []
                },
                "diagnosis": {
                    "primary": "Mandibular Fracture",
                    "differential": ["TMJ Dislocation", "Alveolar Fracture"],
                    "confidence": 88
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Oral Surgery",
                    "estimated_duration_minutes": 180
                }
            },
            # Severe Trauma
            {
                "complexity": "complex",
                "description": "Multiple teeth are broken after a sports injury. There's blood and pieces of teeth in my mouth.",
                "symptoms": {
                    "pain_location": ["whole mouth"],
                    "pain_type": "sharp",
                    "pain_level": 10,
                    "duration": "a few hours",
                    "triggers": ["none"],
                    "visual_signs": ["fracture", "bleeding"],
                    "additional_symptoms": ["bleeding"]
                },
                "diagnosis": {
                    "primary": "Multiple Dental Traumas",
                    "differential": ["Jaw Fracture", "Soft Tissue Laceration"],
                    "confidence": 95
                },
                "action": {
                    "urgency": "immediate",
                    "service_type": "Emergency Trauma Management",
                    "estimated_duration_minutes": 150
                }
            }
        ]
        
        for i in range(5):
            template = templates[i] if i < len(templates) else random.choice(templates)
            
            scenario = DentalScenario(
                scenario_id=self.generate_uuid(),
                input_description=template["description"],
                extracted_symptoms=template["symptoms"],
                diagnosis=template["diagnosis"],
                recommended_action=template["action"],
                category="emergency",
                complexity=template["complexity"],
                patient_profile={"age": random.randint(18, 60), "gender": random.choice(["M", "F"]), "conditions": []}
            )
            
            if self.validate_scenario(scenario):
                scenarios.append(scenario)
        
        return scenarios

    def generate_dataset(self, count: int = 100, use_ollama: bool = False) -> List[DentalScenario]:
        """Generate complete dataset."""
        print(f"Generating {count} dental scenarios...")
        
        all_scenarios = []
        
        # Generate by category
        all_scenarios.extend(self.generate_endodontic_scenarios())
        all_scenarios.extend(self.generate_periodontal_scenarios())
        all_scenarios.extend(self.generate_restorative_scenarios())
        all_scenarios.extend(self.generate_oral_surgery_scenarios())
        all_scenarios.extend(self.generate_orthodontic_scenarios())
        all_scenarios.extend(self.generate_pediatric_scenarios())
        all_scenarios.extend(self.generate_emergency_scenarios())
        
        # Limit to requested count
        all_scenarios = all_scenarios[:count]
        
        # Enhance with Ollama if requested
        if use_ollama:
            print("Enhancing descriptions with Ollama...")
            for scenario in tqdm(all_scenarios[:int(len(all_scenarios) * 0.3)]):  # 30% with Ollama
                scenario.input_description = self.enhance_with_ollama(scenario.input_description)
        
        return all_scenarios

    def export_to_json(self, scenarios: List[DentalScenario], filename: str):
        """Export scenarios to JSON."""
        data = []
        for s in scenarios:
            d = asdict(s)
            d["generated_at"] = datetime.now().isoformat()
            data.append(d)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Exported {len(scenarios)} scenarios to {filename}")

    def export_to_csv(self, scenarios: List[DentalScenario], filename: str):
        """Export scenarios to CSV."""
        import csv
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'scenario_id', 'category', 'complexity', 'input_description',
                'pain_level', 'urgency', 'primary_diagnosis', 'confidence'
            ])
            
            for s in scenarios:
                writer.writerow([
                    s.scenario_id,
                    s.category,
                    s.complexity,
                    s.input_description[:100] + '...',
                    s.extracted_symptoms.get('pain_level', 0),
                    s.recommended_action['urgency'],
                    s.diagnosis['primary'],
                    s.diagnosis['confidence']
                ])
        
        print(f"Exported {len(scenarios)} scenarios to {filename}")

    def create_train_test_split(self, scenarios: List[DentalScenario], train_ratio: float = 0.8):
        """Split scenarios into train/test sets."""
        random.shuffle(scenarios)
        train_size = int(len(scenarios) * train_ratio)
        
        train_set = scenarios[:train_size]
        test_set = scenarios[train_size:]
        
        return train_set, test_set


def main():
    parser = argparse.ArgumentParser(description='Generate Dental Symptom Dataset')
    parser.add_argument('--count', type=int, default=100, help='Number of scenarios to generate')
    parser.add_argument('--output', type=str, default='dental_dataset.json', help='Output JSON file')
    parser.add_argument('--ollama-enhance', type=bool, default=False, help='Use Ollama to enhance descriptions')
    parser.add_argument('--csv', type=str, help='Also export to CSV')
    parser.add_argument('--seed', type=int, help='Random seed for reproducibility')
    parser.add_argument('--split', action='store_true', help='Create train/test split')
    
    args = parser.parse_args()
    
    # Generate dataset
    generator = DentalDatasetGenerator(seed=args.seed)
    scenarios = generator.generate_dataset(args.count, args.ollama_enhance)
    
    # Export main dataset
    generator.export_to_json(scenarios, args.output)
    
    # Export CSV if requested
    if args.csv:
        generator.export_to_csv(scenarios, args.csv)
    
    # Create train/test split if requested
    if args.split:
        train_set, test_set = generator.create_train_test_split(scenarios)
        generator.export_to_json(train_set, args.output.replace('.json', '_train.json'))
        generator.export_to_json(test_set, args.output.replace('.json', '_test.json'))
        print(f"Train set: {len(train_set)}, Test set: {len(test_set)}")
    
    # Statistics
    print("\n=== Dataset Statistics ===")
    categories = {}
    complexities = {}
    urgencies = {}
    
    for s in scenarios:
        categories[s.category] = categories.get(s.category, 0) + 1
        complexities[s.complexity] = complexities.get(s.complexity, 0) + 1
        urgencies[s.recommended_action['urgency']] = urgencies.get(s.recommended_action['urgency'], 0) + 1
    
    print("\nBy Category:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")
    
    print("\nBy Complexity:")
    for comp, count in sorted(complexities.items()):
        print(f"  {comp}: {count}")
    
    print("\nBy Urgency:")
    for urg, count in sorted(urgencies.items()):
        print(f"  {urg}: {count}")
    
    print(f"\n✅ Dataset generation complete!")


if __name__ == "__main__":
    main()
