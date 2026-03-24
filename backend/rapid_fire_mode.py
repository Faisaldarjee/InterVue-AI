import json
import os
import re
import random
import logging
from typing import List, Dict
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
        """Load massive question bank from JSON."""
        try:
            if not os.path.exists(self.data_path):
                logger.error(f"Question bank not found at {self.data_path}")
                return {}

            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            total = sum(len(v) for v in data.values())
            logger.info(f"Loaded {total} offline questions for {len(data)} roles")
            return data
        except Exception as e:
            logger.error(f"Failed to load question bank: {e}")
            return {}

    def get_config(self) -> Dict:
        return self.config

    def _normalize_difficulty(self, difficulty: str) -> str:
        value = (difficulty or "medium").strip().lower()
        if value in ("easy", "beginner", "junior"):
            return "Easy"
        if value in ("hard", "advanced", "senior"):
            return "Hard"
        return "Medium"

    def _get_candidates_for_role(self, job_role: str) -> List[Dict]:
        if job_role in self.questions_db:
            return list(self.questions_db[job_role])

        requested = (job_role or "").strip().lower()
        for role_key, questions in self.questions_db.items():
            role_lower = role_key.lower()
            if role_lower in requested or requested in role_lower:
                logger.info(f"Mapped '{job_role}' to '{role_key}'")
                return list(questions)

        logger.warning(f"No specific questions for '{job_role}'. Using General mix.")
        return list(self.questions_db.get("General", []))

    def _build_varied_question_set(self, candidates: List[Dict], num_questions: int, difficulty: str) -> List[Dict]:
        if not candidates:
            return []

        target_difficulty = self._normalize_difficulty(difficulty)
        pools = {"Easy": [], "Medium": [], "Hard": [], "Other": []}
        for item in candidates:
            item_diff = self._normalize_difficulty(item.get("difficulty", "Medium"))
            pools.get(item_diff, pools["Other"]).append(item)

        for pool in pools.values():
            random.shuffle(pool)

        progression_map = {
            "Easy": ["Easy", "Easy", "Medium", "Medium", "Medium", "Hard"],
            "Medium": ["Easy", "Medium", "Medium", "Medium", "Hard", "Hard"],
            "Hard": ["Medium", "Medium", "Hard", "Hard", "Hard", "Hard"],
        }
        target_arc = progression_map.get(target_difficulty, progression_map["Medium"])

        selected = []
        used_questions = set()
        last_type = None

        def try_take(pool_name: str):
            nonlocal last_type
            pool = pools.get(pool_name, [])
            if not pool:
                return None

            for idx, question in enumerate(pool):
                question_id = question.get("question", "")
                question_type = question.get("type", "Technical")
                if question_id in used_questions:
                    continue
                if last_type and question_type == last_type:
                    continue
                used_questions.add(question_id)
                last_type = question_type
                return pool.pop(idx)

            for idx, question in enumerate(pool):
                question_id = question.get("question", "")
                if question_id in used_questions:
                    continue
                used_questions.add(question_id)
                last_type = question.get("type", "Technical")
                return pool.pop(idx)
            return None

        fallback_order = ["Medium", "Hard", "Easy", "Other"]
        while len(selected) < num_questions:
            phase = target_arc[min(len(selected), len(target_arc) - 1)]
            picked = try_take(phase)
            if picked is None:
                for fallback in fallback_order:
                    picked = try_take(fallback)
                    if picked is not None:
                        break
            if picked is None:
                break
            selected.append(picked)

        return selected

    def generate_rapid_fire_questions(self, llm_service, job_role: str, num_questions: int = 10, difficulty: str = "medium") -> List[Dict]:
        """
        Get a varied rapid-fire set for the role.
        'llm_service' arg is kept for compatibility but ignored.
        """
        num_questions = max(3, min(num_questions, 20))
        logger.info(f"Generating {num_questions} rapid-fire questions for {job_role} ({difficulty})")

        selected = self._build_varied_question_set(
            self._get_candidates_for_role(job_role),
            num_questions,
            difficulty
        )

        if len(selected) < num_questions:
            logger.info(f"Filling role pool with General questions ({len(selected)}/{num_questions})")
            general_pool = list(self.questions_db.get("General", []))
            combined = selected + [
                question for question in general_pool
                if question.get("question") not in {item.get("question") for item in selected}
            ]
            selected = self._build_varied_question_set(combined, num_questions, difficulty)

        while selected and len(selected) < num_questions:
            selected.append(random.choice(selected))

        final_questions = []
        for i, q in enumerate(selected):
            final_questions.append({
                "question": q["question"],
                "type": q.get("type", "Technical"),
                "difficulty": self._normalize_difficulty(q.get("difficulty", difficulty)),
                "keywords": q.get("keywords", []),
                "question_number": i + 1,
                "time_limit": 60,
                "interviewer_note": "Keep it crisp, structured, and specific.",
                "expected_style": "concise, direct, example-backed"
            })

        return final_questions

    def evaluate_offline(self, answer_text: str, keywords: List[str]) -> Dict:
        """
        Smart offline evaluation: fuzzy keyword matching + structure detection.
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

        depth_score = 0
        if word_count >= 80:
            depth_score = 2
        elif word_count >= 40:
            depth_score = 1.5
        elif word_count >= 20:
            depth_score = 1
        else:
            depth_score = 0.5

        matched = []
        for kw in keywords:
            kw_lower = kw.lower().strip()
            if kw_lower in answer_lower:
                matched.append(kw)
                continue

            kw_root = kw_lower[:max(4, len(kw_lower) - 3)]
            if kw_root in answer_lower:
                matched.append(kw)
                continue

            for word in words:
                if len(word) >= 4 and len(kw_lower) >= 4 and word[:4] == kw_lower[:4]:
                    matched.append(kw)
                    break

        match_ratio = len(matched) / len(keywords) if keywords else 0
        keyword_score = 0
        if match_ratio >= 0.8:
            keyword_score = 4
        elif match_ratio >= 0.6:
            keyword_score = 3
        elif match_ratio >= 0.4:
            keyword_score = 2.5
        elif match_ratio >= 0.2:
            keyword_score = 2
        elif match_ratio > 0:
            keyword_score = 1

        structure_score = 0
        star_words = ["situation", "task", "action", "result", "example", "instance", "scenario"]
        if sum(1 for sw in star_words if sw in answer_lower) >= 2:
            structure_score += 0.5

        if any(marker in answer_text for marker in ["1.", "2.", "- ", "first", "second"]):
            structure_score += 0.5

        if re.search(r"\d+%|\d+x|\$\d+|\d+ (users|requests|seconds|minutes|hours|days|teams|people)", answer_lower):
            structure_score += 0.5

        tech_words = ["implemented", "designed", "architected", "optimized", "debugged", "deployed",
                      "database", "api", "server", "algorithm", "complexity", "scalab", "system"]
        tech_count = sum(1 for tw in tech_words if tw in answer_lower)
        if tech_count >= 3:
            structure_score += 0.5

        structure_score = min(2, structure_score)
        total_score = min(10, max(1, round(2 + depth_score + keyword_score + structure_score)))
        missing = [k for k in keywords if k not in matched]

        if total_score >= 8:
            fb_text = "Excellent. You showed strong understanding with specific details."
        elif total_score >= 6:
            fb_text = f"Good answer. Consider also mentioning: {', '.join(missing[:2])}" if missing else "Good answer. Add even more specifics or metrics."
        elif total_score >= 4:
            fb_text = f"Decent start. Key areas to cover: {', '.join(missing[:3])}"
        else:
            fb_text = f"Brief answer. Elaborate on: {', '.join(keywords[:3])}"

        return {
            "score": total_score,
            "feedback": fb_text,
            "strengths": matched[:5],
            "missing_points": missing[:5],
            "confidence_indicator": "High" if word_count > 100 else "Medium" if word_count > 40 else "Low",
            "how_to_improve": f"Focus on {missing[0] if missing else 'providing more detail'}.",
            "real_interview_tip": "Use a short structure: context, action, result.",
            "follow_up_topic": keywords[0] if keywords else "General"
        }

    def calculate_results(self, interview: Dict) -> Dict:
        """Calculate final results."""
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
            message = "Outstanding. You are ready for this role."
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
