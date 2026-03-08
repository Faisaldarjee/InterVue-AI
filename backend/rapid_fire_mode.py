import json
import os
import re
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

    def generate_rapid_fire_questions(self, llm_service, job_role: str, num_questions: int = 10) -> List[Dict]:
        """
        Get N unique questions for the role from offline DB.
        'llm_service' arg is kept for compatibility but ignored.
        """
        num_questions = max(3, min(num_questions, 20))  # Clamp 3-20
        logger.info(f"🔥 Generating {num_questions} offline questions for: {job_role}")
        
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

        # Select N random unique questions
        if len(candidates) >= num_questions:
            selected = random.sample(candidates, num_questions)
        else:
            # If not enough specific questions, fill with General
            logger.info(f"⚠️ Not enough questions for '{job_role}' ({len(candidates)}/{num_questions}). Filling with General.")
            selected = list(candidates) # Copy all specific
            
            # Get General questions to fill the gap
            general_pool = self.questions_db.get("General", [])
            needed = num_questions - len(selected)
            
            if len(general_pool) >= needed:
                # Add unique general questions
                selected.extend(random.sample(general_pool, needed))
            else:
                # If still not enough (very rare), then duplicate
                selected.extend(general_pool)
                while len(selected) < num_questions:
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
        Smart offline evaluation — fuzzy keyword matching + structure detection.
        Used as fallback when AI batch evaluation fails.
        """
        if not answer_text or len(answer_text.strip()) == 0:
            return {
                "score": 1,
                "feedback": "No answer provided.",
                "confidence_indicator": "None"
            }
            
        answer_lower = answer_text.lower().strip()
        words = answer_lower.split()
        word_count = len(words)
        
        # ======= 1. LENGTH & DEPTH SCORE (max 2) =======
        depth_score = 0
        if word_count >= 80: depth_score = 2
        elif word_count >= 40: depth_score = 1.5
        elif word_count >= 20: depth_score = 1
        else: depth_score = 0.5
        
        # ======= 2. FUZZY KEYWORD MATCHING (max 4) =======
        matched = []
        for kw in keywords:
            kw_lower = kw.lower().strip()
            # Exact match
            if kw_lower in answer_lower:
                matched.append(kw)
                continue
            # Partial/fuzzy match (e.g. "optimize" matches "optimization")
            kw_root = kw_lower[:max(4, len(kw_lower) - 3)]  # stem: first N chars
            if kw_root in answer_lower:
                matched.append(kw)
                continue
            # Word-level partial match
            for word in words:
                if len(word) >= 4 and len(kw_lower) >= 4:
                    if word[:4] == kw_lower[:4]:  # same start
                        matched.append(kw)
                        break
        
        match_ratio = len(matched) / len(keywords) if keywords else 0
        keyword_score = 0
        if match_ratio >= 0.8: keyword_score = 4
        elif match_ratio >= 0.6: keyword_score = 3
        elif match_ratio >= 0.4: keyword_score = 2.5
        elif match_ratio >= 0.2: keyword_score = 2
        elif match_ratio > 0: keyword_score = 1
        
        # ======= 3. STRUCTURE & QUALITY BONUS (max 2) =======
        structure_score = 0
        
        # STAR method indicators
        star_words = ['situation', 'task', 'action', 'result', 'example', 'instance', 'scenario']
        if sum(1 for sw in star_words if sw in answer_lower) >= 2:
            structure_score += 0.5
        
        # Numbered/bulleted structure
        if any(marker in answer_text for marker in ['1.', '2.', '- ', '• ', 'first', 'second']):
            structure_score += 0.5
        
        # Metrics/numbers (shows specificity)
        if re.search(r'\d+%|\d+x|\$\d+|\d+ (users|requests|seconds|minutes|hours|days|teams|people)', answer_lower):
            structure_score += 0.5
        
        # Technical depth indicators
        tech_words = ['implemented', 'designed', 'architected', 'optimized', 'debugged', 'deployed',
                     'database', 'api', 'server', 'algorithm', 'complexity', 'scalab', 'system']
        tech_count = sum(1 for tw in tech_words if tw in answer_lower)
        if tech_count >= 3:
            structure_score += 0.5
        
        structure_score = min(2, structure_score)
        
        # ======= 4. TOTAL SCORE =======
        # Base 2 + Depth 2 + Keywords 4 + Structure 2 = 10
        total_score = 2 + depth_score + keyword_score + structure_score
        total_score = min(10, max(1, round(total_score)))
        
        # ======= 5. SMART FEEDBACK =======
        missing = [k for k in keywords if k not in matched]
        
        if total_score >= 8:
            emoji = "🌟"
            fb_text = "Excellent! You demonstrated strong understanding with specific details."
        elif total_score >= 6:
            emoji = "👍"
            if missing:
                fb_text = f"Good answer! Consider also mentioning: {', '.join(missing[:2])}"
            else:
                fb_text = "Good answer! Try adding more specific examples or metrics."
        elif total_score >= 4:
            emoji = "💡"
            fb_text = f"Decent start. Key areas to cover: {', '.join(missing[:3])}"
        else:
            emoji = "💪"
            fb_text = f"Brief answer. Elaborate on: {', '.join(keywords[:3])}"
            
        return {
            "score": total_score,
            "feedback": f"{emoji} {fb_text}",
            "strengths": matched[:5],
            "missing_points": missing[:5],
            "confidence_indicator": "High" if word_count > 100 else "Medium" if word_count > 40 else "Low",
            "how_to_improve": f"Focus on {missing[0] if missing else 'providing more detail'}.",
            "real_interview_tip": "Use the STAR method (Situation, Task, Action, Result) for behavioral questions.",
            "follow_up_topic": keywords[0] if keywords else "General"
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