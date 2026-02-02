import json
import os
import random
import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class RapidFireMode:
    """
    Offline Rapid Fire Mode
    - Loads questions from local JSON
    - Evaluates answers using keyword matching
    - Zero API usage
    """
    
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), "data", "questions.json")
        self.questions_db = self._load_questions()
        self.config = {
            "num_questions": 10,
            "time_per_question": 60,
            "total_time": 600
        }
    
    def _load_questions(self) -> Dict[str, List[Dict]]:
        """Load massive question bank from JSON"""
        try:
            if not os.path.exists(self.data_path):
                logger.error(f"❌ Question bank not found at {self.data_path}")
                return {}
                
            with open(self.data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Count total questions
            total = sum(len(v) for v in data.values())
            logger.info(f"✅ Loaded {total} offline questions for {len(data)} roles")
            return data
            
        except Exception as e:
            logger.error(f"❌ Failed to load question bank: {e}")
            return {}

    def get_config(self) -> Dict:
        return self.config

    def generate_rapid_fire_questions(self, llm_service, job_role: str) -> List[Dict]:
        """
        Get 10 unique questions for the role from offline DB.
        'llm_service' arg is kept for compatibility but ignored.
        """
        logger.info(f"🔥 Generating offline questions for: {job_role}")
        
        # 1. Exact Match
        if job_role in self.questions_db:
            candidates = self.questions_db[job_role]
        
        # 2. Fuzzy / Partial Match (e.g. "Senior Python Dev" -> "Python Developer")
        else:
            candidates = []
            for role_key, qs in self.questions_db.items():
                if role_key.lower() in job_role.lower() or job_role.lower() in role_key.lower():
                    # Prioritize exact word matches
                    candidates = qs
                    logger.info(f"✨ Mapped '{job_role}' to '{role_key}'")
                    break
            
            # 3. Fallback to General
            if not candidates:
                logger.warning(f"⚠️ No specific questions for '{job_role}'. Using General mix.")
                candidates = self.questions_db.get("General", [])

        # Select 10 random unique questions
        if len(candidates) >= 10:
            selected = random.sample(candidates, 10)
        else:
            # If not enough specific questions, fill with General
            logger.info(f"⚠️ Not enough questions for '{job_role}' ({len(candidates)}/10). Filling with General.")
            selected = list(candidates) # Copy all specific
            
            # Get General questions to fill the gap
            general_pool = self.questions_db.get("General", [])
            needed = 10 - len(selected)
            
            if len(general_pool) >= needed:
                # Add unique general questions
                selected.extend(random.sample(general_pool, needed))
            else:
                # If still not enough (very rare), then duplicate
                selected.extend(general_pool)
                while len(selected) < 10:
                     selected.append(random.choice(selected)) # Fallback to duplicates
            
            random.shuffle(selected)
            
        # Add metadata expected by frontend
        final_questions = []
        for i, q in enumerate(selected):
            final_questions.append({
                "question": q["question"],
                "type": q["type"],
                "difficulty": q["difficulty"],
                "keywords": q.get("keywords", []), # Store for evaluation
                "question_number": i + 1,
                "time_limit": 60
            })
            
        return final_questions

    def evaluate_offline(self, answer_text: str, keywords: List[str]) -> Dict:
        """
        Evaluate answer LOCALLY without API calls.
        """
        if not answer_text:
            return {
                "score": 0,
                "feedback": "No answer provided.",
                "confidence_indicator": "None"
            }
            
        answer_lower = answer_text.lower()
        
        # 1. Length Check
        length_score = 0
        if len(answer_text) > 100: length_score = 3
        elif len(answer_text) > 50: length_score = 2
        else: length_score = 1
        
        # 2. Keyword Matching
        matched = [k for k in keywords if k.lower() in answer_lower]
        match_ratio = len(matched) / len(keywords) if keywords else 0
        
        keyword_score = 0
        if match_ratio > 0.7: keyword_score = 5
        elif match_ratio > 0.4: keyword_score = 4
        elif match_ratio > 0.2: keyword_score = 3
        elif match_ratio > 0: keyword_score = 2
        
        # 3. Total Score (Max 10)
        # Base=2, Length=3, Keywords=5
        total_score = 2 + length_score + keyword_score
        total_score = min(10, max(1, total_score))
        
        # 4. Feedback Generation
        if total_score >= 8:
            emoji = "🌟"
            fb_text = "Excellent! You covered key concepts clearly."
        elif total_score >= 6:
            emoji = "👍"
            fb_text = f"Good answer. Try to mention: {', '.join(keywords[:2])}"
        else:
            emoji = "💪"
            fb_text = f"A bit short. Key terms missing: {', '.join(keywords[:3])}"
            
        return {
            "score": total_score,
            "feedback": fb_text,
            "strengths": matched,
            "missing_points": [k for k in keywords if k not in matched],
            "confidence_indicator": "High" if len(answer_text) > 200 else "Medium",
            "how_to_improve": f"Elaborate more on {keywords[0] if keywords else 'the topic'}.",
            "real_interview_tip": "Use the STAR method (Situation, Task, Action, Result).",
            "follow_up_topic": "General" 
        }

    def calculate_results(self, interview: Dict) -> Dict:
        """Calculate final results"""
        
        scores = []
        for a in interview["answers"]:
            if "evaluation" in a and isinstance(a["evaluation"], dict):
                scores.append(a["evaluation"].get("score", 0))
            else:
                scores.append(a.get("score", 0))
                
        if not scores:
            return {
                "average_score": 0,
                "rating": "N/A",
                "message": "No answers recorded."
            }

        avg_score = sum(scores) / len(scores)
        
        if avg_score >= 8:
            rating = "HIRE"
            message = "Outstanding! You are ready for this role."
        elif avg_score >= 6:
            rating = "CONSIDER"
            message = "Strong potential. Review weak areas."
        else:
            rating = "TRAIN"
            message = "Keep practicing. Focus on technical depth."

        return {
            "total_questions": len(scores),
            "average_score": round(avg_score, 1),
            "best_score": max(scores),
            "worst_score": min(scores),
            "scores": scores,
            "rating": rating,
            "message": message,
            "total_time_seconds": int((interview["completed_at"] - interview["started_at"]).total_seconds())
        }