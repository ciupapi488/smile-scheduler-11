#!/usr/bin/env python3
"""
DIALOGUE Evaluation Framework for Dental AI
Implements evaluation metrics from DIALOGUE-21 medical track
"""

import json
import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass
from collections import defaultdict
import re
from difflib import SequenceMatcher

# DIALOGUE-style metrics
try:
    from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    print("Warning: NLTK not available. BLEU scores disabled.")


@dataclass
class EvaluationMetrics:
    """DIALOGUE evaluation metrics"""
    accuracy: float
    f1_macro: float
    f1_weighted: float
    precision_per_class: Dict[str, float]
    recall_per_class: Dict[str, float]
    bleu_score: float
    exact_match_rate: float
    confusion_matrix: Dict
    clinical_safety_score: float  # Critical: no missed emergencies


class DialogueEvaluator:
    """
    Evaluator following DIALOGUE-21 medical dialogue evaluation methodology
    """
    
    def __init__(self):
        self.urgency_classes = ['immediate', 'urgent_24h', 'routine']
        self.smoothing = SmoothingFunction().method1 if NLTK_AVAILABLE else None
        
    def calculate_bleu(self, reference: str, hypothesis: str) -> float:
        """
        Calculate BLEU score for generated vs reference response
        DIALOGUE uses BLEU for evaluating generated answers
        """
        if not NLTK_AVAILABLE:
            # Fallback: simple token overlap
            ref_tokens = set(reference.lower().split())
            hyp_tokens = set(hypothesis.lower().split())
            if not ref_tokens:
                return 0.0
            overlap = len(ref_tokens & hyp_tokens)
            return overlap / len(ref_tokens)
        
        ref_tokens = reference.lower().split()
        hyp_tokens = hypothesis.lower().split()
        
        return sentence_bleu(
            [ref_tokens],
            hyp_tokens,
            smoothing_function=self.smoothing
        )
    
    def calculate_exact_match(self, predictions: List[str], references: List[str]) -> float:
        """Exact match rate for diagnosis/urgency classification"""
        matches = sum(1 for p, r in zip(predictions, references) if p == r)
        return matches / len(predictions) if predictions else 0.0
    
    def calculate_f1_per_class(self, y_true: List[str], y_pred: List[str]) -> Dict[str, float]:
        """Calculate F1 score per urgency class"""
        f1_scores = {}
        
        for cls in self.urgency_classes:
            tp = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p == cls)
            fp = sum(1 for t, p in zip(y_true, y_pred) if t != cls and p == cls)
            fn = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p != cls)
            
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
            f1_scores[cls] = f1
        
        return f1_scores
    
    def calculate_confusion_matrix(self, y_true: List[str], y_pred: List[str]) -> Dict:
        """Generate confusion matrix"""
        matrix = defaultdict(lambda: defaultdict(int))
        
        for true, pred in zip(y_true, y_pred):
            matrix[true][pred] += 1
        
        # Convert to regular dict for JSON serialization
        return {k: dict(v) for k, v in matrix.items()}
    
    def calculate_clinical_safety_score(self, y_true: List[str], y_pred: List[str]) -> float:
        """
        CRITICAL METRIC: Clinical safety score
        Measures if the system missed any 'immediate' cases (false negatives)
        A single missed emergency is unacceptable
        """
        immediate_cases = [(t, p) for t, p in zip(y_true, y_pred) if t == 'immediate']
        
        if not immediate_cases:
            return 1.0  # No immediate cases in test set
        
        missed = sum(1 for t, p in immediate_cases if p != 'immediate')
        
        # Score penalizes heavily for missed emergencies
        # 0 missed = 100%, 1 missed = 50%, 2+ missed = 0%
        if missed == 0:
            return 1.0
        elif missed == 1:
            return 0.5
        else:
            return 0.0
    
    def evaluate(self, test_cases: List[Dict], predictions: List[Dict]) -> EvaluationMetrics:
        """
        Full DIALOGUE-style evaluation
        
        Args:
            test_cases: List of test cases with 'urgency' and 'diagnosis' fields
            predictions: List of predictions from AI system
        """
        y_true = [case['urgency'] for case in test_cases]
        y_pred = [pred['urgency_level'] for pred in predictions]
        
        # Calculate accuracy
        accuracy = sum(1 for t, p in zip(y_true, y_pred) if t == p) / len(y_true)
        
        # Calculate F1 scores
        f1_per_class = self.calculate_f1_per_class(y_true, y_pred)
        f1_macro = np.mean(list(f1_per_class.values()))
        
        # Weighted F1 (accounts for class imbalance)
        class_counts = defaultdict(int)
        for y in y_true:
            class_counts[y] += 1
        total = len(y_true)
        f1_weighted = sum(f1_per_class[cls] * (class_counts[cls] / total) 
                         for cls in self.urgency_classes)
        
        # Calculate precision/recall per class
        precision = {}
        recall = {}
        for cls in self.urgency_classes:
            tp = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p == cls)
            fp = sum(1 for t, p in zip(y_true, y_pred) if t != cls and p == cls)
            fn = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p != cls)
            
            precision[cls] = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall[cls] = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        
        # BLEU score for generated text (if available)
        bleu_scores = []
        for case, pred in zip(test_cases, predictions):
            if 'expected_response' in case and 'generated_response' in pred:
                bleu = self.calculate_bleu(case['expected_response'], pred['generated_response'])
                bleu_scores.append(bleu)
        
        avg_bleu = np.mean(bleu_scores) if bleu_scores else 0.0
        
        # Exact match for diagnosis
        exact_match = self.calculate_exact_match(
            [case.get('diagnosis', '') for case in test_cases],
            [pred.get('diagnosis', '') for pred in predictions]
        )
        
        # Confusion matrix
        conf_matrix = self.calculate_confusion_matrix(y_true, y_pred)
        
        # Clinical safety (critical)
        safety_score = self.calculate_clinical_safety_score(y_true, y_pred)
        
        return EvaluationMetrics(
            accuracy=accuracy,
            f1_macro=f1_macro,
            f1_weighted=f1_weighted,
            precision_per_class=precision,
            recall_per_class=recall,
            bleu_score=avg_bleu,
            exact_match_rate=exact_match,
            confusion_matrix=conf_matrix,
            clinical_safety_score=safety_score
        )
    
    def generate_report(self, metrics: EvaluationMetrics, output_path: str = None) -> str:
        """Generate human-readable evaluation report"""
        report = []
        report.append("=" * 60)
        report.append("DIALOGUE EVALUATION REPORT - Dental AI Symptom Checker")
        report.append("=" * 60)
        report.append("")
        
        report.append("OVERALL METRICS:")
        report.append(f"  Accuracy:              {metrics.accuracy:.3f}")
        report.append(f"  F1 Macro:              {metrics.f1_macro:.3f}")
        report.append(f"  F1 Weighted:           {metrics.f1_weighted:.3f}")
        report.append(f"  BLEU Score:            {metrics.bleu_score:.3f}")
        report.append(f"  Exact Match (Diag):    {metrics.exact_match_rate:.3f}")
        report.append("")
        
        report.append("PER-CLASS PERFORMANCE:")
        for cls in self.urgency_classes:
            report.append(f"  {cls.upper()}:")
            report.append(f"    Precision: {metrics.precision_per_class.get(cls, 0):.3f}")
            report.append(f"    Recall:    {metrics.recall_per_class.get(cls, 0):.3f}")
        report.append("")
        
        report.append("CLINICAL SAFETY (CRITICAL):")
        report.append(f"  Safety Score: {metrics.clinical_safety_score:.3f}")
        if metrics.clinical_safety_score < 1.0:
            report.append("  ⚠️  WARNING: System missed emergency cases!")
        else:
            report.append("  ✅ All emergency cases correctly identified")
        report.append("")
        
        report.append("CONFUSION MATRIX:")
        for true_class in self.urgency_classes:
            row = metrics.confusion_matrix.get(true_class, {})
            report.append(f"  {true_class:12} -> " + "  ".join(
                f"{pred_class}:{row.get(pred_class, 0)}" 
                for pred_class in self.urgency_classes
            ))
        report.append("")
        
        # Interpretation
        report.append("INTERPRETATION:")
        if metrics.accuracy >= 0.85:
            report.append("  ✅ Accuracy target met (>85%)")
        else:
            report.append("  ❌ Accuracy below target (<85%)")
        
        if metrics.precision_per_class.get('immediate', 0) >= 0.90:
            report.append("  ✅ Emergency precision target met (>90%)")
        else:
            report.append("  ❌ Emergency precision below target (<90%)")
        
        if metrics.clinical_safety_score == 1.0:
            report.append("  ✅ No missed emergencies (CRITICAL)")
        else:
            report.append("  🚨 MISSED EMERGENCIES - System unsafe for deployment")
        
        report.append("")
        report.append("=" * 60)
        
        report_text = "\n".join(report)
        
        if output_path:
            with open(output_path, 'w') as f:
                f.write(report_text)
        
        return report_text


class EdgeCaseTester:
    """Test edge cases and challenging scenarios"""
    
    def __init__(self):
        self.edge_cases = self._load_edge_cases()
    
    def _load_edge_cases(self) -> List[Dict]:
        """Load edge case test scenarios"""
        return [
            {
                "id": "edge_001",
                "description": "Pregnant patient with severe pain (medication considerations)",
                "symptoms": "Severe throbbing pain in upper molar, 8/10, patient is 5 months pregnant",
                "expected_urgency": "urgent_24h",
                "expected_considerations": ["pregnancy", "safe_medications"]
            },
            {
                "id": "edge_002",
                "description": "Diabetic patient with infection (higher risk)",
                "symptoms": "Swelling in lower jaw with fever 38.5C, diabetic patient",
                "expected_urgency": "immediate",
                "expected_considerations": ["diabetes", "infection_spread"]
            },
            {
                "id": "edge_003",
                "description": "Child with avulsed tooth (time critical)",
                "symptoms": "7-year-old knocked out front tooth 30 minutes ago",
                "expected_urgency": "immediate",
                "expected_considerations": ["pediatric", "time_critical", "reimplantation"]
            },
            {
                "id": "edge_004",
                "description": "Elderly patient with multiple medications",
                "symptoms": "Pain in lower molar, patient on warfarin and has hypertension",
                "expected_urgency": "urgent_24h",
                "expected_considerations": ["anticoagulant", "blood_pressure"]
            },
            {
                "id": "edge_005",
                "description": "Vague symptoms requiring clarification",
                "symptoms": "My mouth feels weird and sometimes it hurts",
                "expected_urgency": "routine",
                "expected_considerations": ["needs_clarification", "vague_symptoms"]
            },
            {
                "id": "edge_006",
                "description": "Multiple conditions (complex case)",
                "symptoms": "Broken molar with exposed nerve, bleeding gum, and sensitivity to cold",
                "expected_urgency": "urgent_24h",
                "expected_considerations": ["complex", "multiple_issues"]
            },
            {
                "id": "edge_007",
                "description": "Language barrier indicators",
                "symptoms": "Tooth bad hurt many day swelling face",
                "expected_urgency": "urgent_24h",
                "expected_considerations": ["language_barrier", "still_clear_urgency"]
            },
            {
                "id": "edge_008",
                "description": "Psychosomatic vs real pain",
                "symptoms": "I've had pain in multiple teeth for years, dentists never find anything wrong",
                "expected_urgency": "routine",
                "expected_considerations": ["possible_psychosomatic", "specialist_referral"]
            }
        ]
    
    def test_edge_cases(self, classifier) -> Dict:
        """Run edge case tests"""
        results = []
        passed = 0
        
        for case in self.edge_cases:
            # This would call the actual classifier
            # For now, placeholder
            predicted_urgency = "urgent_24h"  # Would come from classifier
            
            result = {
                "case_id": case["id"],
                "description": case["description"],
                "expected": case["expected_urgency"],
                "predicted": predicted_urgency,
                "passed": predicted_urgency == case["expected_urgency"]
            }
            
            if result["passed"]:
                passed += 1
            
            results.append(result)
        
        return {
            "total": len(self.edge_cases),
            "passed": passed,
            "failed": len(self.edge_cases) - passed,
            "pass_rate": passed / len(self.edge_cases),
            "details": results
        }


# Romanian-specific test cases
ROMANIAN_TEST_CASES = [
    {
        "id": "ro_001",
        "symptoms": "Mă doare măseaua din spate pulsativ, durerea e 8 din 10, am și umflătură",
        "urgency": "urgent_24h",
        "diagnosis": "Pulpita acută"
    },
    {
        "id": "ro_002",
        "symptoms": "Mi-am spart dintele frontal la sport, sângerează",
        "urgency": "urgent_24h",
        "diagnosis": "Fractură coronară"
    },
    {
        "id": "ro_003",
        "symptoms": "Doresc un control de rutină și detartraj",
        "urgency": "routine",
        "diagnosis": "Prevenție"
    },
    {
        "id": "ro_004",
        "symptoms": "Fața mi s-a umflat și am febră 39, nu pot deschide gura",
        "urgency": "immediate",
        "diagnosis": "Celulită odontogenă"
    },
    {
        "id": "ro_005",
        "symptoms": "Gingiile îmi sângerează când mă spăl pe dinți, am observat de o săptămână",
        "urgency": "routine",
        "diagnosis": "Gingivită"
    }
]


if __name__ == '__main__':
    # Example evaluation
    evaluator = DialogueEvaluator()
    
    # Mock test data
    test_cases = [
        {"urgency": "immediate", "diagnosis": "Abscess"},
        {"urgency": "urgent_24h", "diagnosis": "Pulpitis"},
        {"urgency": "routine", "diagnosis": "Cleaning"},
        {"urgency": "immediate", "diagnosis": "Trauma"},
        {"urgency": "urgent_24h", "diagnosis": "Fracture"}
    ]
    
    predictions = [
        {"urgency_level": "immediate", "diagnosis": "Abscess"},
        {"urgency_level": "urgent_24h", "diagnosis": "Pulpitis"},
        {"urgency_level": "routine", "diagnosis": "Cleaning"},
        {"urgency_level": "urgent_24h", "diagnosis": "Trauma"},  # Missed emergency!
        {"urgency_level": "urgent_24h", "diagnosis": "Fracture"}
    ]
    
    metrics = evaluator.evaluate(test_cases, predictions)
    report = evaluator.generate_report(metrics)
    print(report)
