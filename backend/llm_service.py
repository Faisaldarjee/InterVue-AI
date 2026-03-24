# -*- coding: utf-8 -*-
"""
Enhanced LLM Service
"""

import json
import logging
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env", override=False)
load_dotenv(Path(__file__).resolve().parent / ".env", override=False)

try:
    from advanced_smart_cache import advanced_cache
    CACHE_ENABLED = True
except ImportError as e:
    logger.warning(f"Cache system not available: {e}. Caching disabled.")
    CACHE_ENABLED = False
    advanced_cache = None


class EnhancedLLMService:
    def __init__(self):
        self.main_api_key = os.getenv("GEMINI_API_KEY")
        self.resume_api_key = os.getenv("GEMINI_RESUME_API_KEY")

        if not self.main_api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")

        self.preferred_model = self._normalize_model_name(
            os.getenv("GEMINI_MODEL", "models/gemini-2.0-flash")
        )
        self.default_model_candidates = self._dedupe_models([
            self.preferred_model,
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
            "models/gemini-1.5-flash",
            "models/gemini-1.5-flash-8b",
            "models/gemini-1.5-pro",
        ])
        self._configured_api_key = None
        self._discovered_models_by_key = {}
        self._active_model_by_key = {}

        initial_model = self._select_model_for_key(self.main_api_key)
        if initial_model is None:
            raise RuntimeError("Unable to initialize any Gemini model for GEMINI_API_KEY")

        self.model = genai.GenerativeModel(initial_model)
        logger.info(f"Using Gemini model: {initial_model}")

        self.cache_stats = {"total_requests": 0, "cache_hits": 0, "api_calls": 0}
        self._api_calls_log = []
        self._hourly_limit = int(os.getenv("GEMINI_HOURLY_LIMIT", "55"))

    def _normalize_model_name(self, model_name: str) -> str:
        model_name = str(model_name or "").strip()
        if not model_name:
            return ""
        return model_name if model_name.startswith("models/") else f"models/{model_name}"

    def _dedupe_models(self, model_names: list) -> list:
        seen = set()
        deduped = []
        for name in model_names:
            normalized = self._normalize_model_name(name)
            if normalized and normalized not in seen:
                seen.add(normalized)
                deduped.append(normalized)
        return deduped

    def _set_api_key(self, api_key: str):
        if api_key != self._configured_api_key:
            genai.configure(api_key=api_key)
            self._configured_api_key = api_key

    def _discover_models_for_key(self, api_key: str, force_refresh: bool = False) -> list:
        cache_key = api_key or ""
        if not force_refresh and cache_key in self._discovered_models_by_key:
            return self._discovered_models_by_key[cache_key]

        discovered = []
        try:
            self._set_api_key(api_key)
            for model in genai.list_models():
                methods = getattr(model, "supported_generation_methods", []) or []
                if "generateContent" in methods:
                    discovered.append(model.name)
        except Exception as e:
            logger.warning(f"Gemini model discovery failed: {e}")

        discovered = self._dedupe_models(discovered)
        self._discovered_models_by_key[cache_key] = discovered
        return discovered

    def _build_model_pool(self, api_key: str, force_refresh: bool = False) -> list:
        discovered = self._discover_models_for_key(api_key, force_refresh=force_refresh)
        return self._dedupe_models(discovered + self.default_model_candidates)

    def _select_model_for_key(self, api_key: str, force_refresh: bool = False, failed_model: str = None) -> str:
        active_model = self._active_model_by_key.get(api_key)
        if active_model and not force_refresh and active_model != failed_model:
            return active_model

        pool = self._build_model_pool(api_key, force_refresh=force_refresh)
        for model_name in pool:
            if model_name != failed_model:
                self._active_model_by_key[api_key] = model_name
                return model_name

        self._active_model_by_key.pop(api_key, None)
        return None

    def _is_model_error(self, error_text: str) -> bool:
        return any(token in error_text for token in [
            "not found",
            "is not found",
            "model not found",
            "unsupported model",
            "does not support",
            "not supported",
            "permission denied",
            "access denied",
            "api has not been used",
        ])

    def _check_budget(self) -> bool:
        cutoff = datetime.now() - timedelta(hours=1)
        self._api_calls_log = [t for t in self._api_calls_log if t > cutoff]
        remaining = self._hourly_limit - len(self._api_calls_log)
        if remaining <= int(self._hourly_limit * 0.2):
            logger.warning(f"API budget low: {remaining}/{self._hourly_limit} calls left this hour")
        return remaining > 0

    def _record_api_call(self):
        self._api_calls_log.append(datetime.now())
        self.cache_stats["api_calls"] += 1

    def get_budget_status(self) -> dict:
        cutoff = datetime.now() - timedelta(hours=1)
        self._api_calls_log = [t for t in self._api_calls_log if t > cutoff]
        used = len(self._api_calls_log)
        return {
            "active_model": self._active_model_by_key.get(self.main_api_key),
            "used_this_hour": used,
            "limit": self._hourly_limit,
            "remaining": self._hourly_limit - used,
            "percent_used": round(used / self._hourly_limit * 100, 1) if self._hourly_limit > 0 else 0,
        }

    def _call_with_retry(self, prompt: str, max_retries: int = 3, use_resume_key: bool = False) -> str:
        if not self._check_budget():
            logger.error("API budget exhausted for this hour. Using defaults.")
            return None

        active_key = self.resume_api_key if use_resume_key and self.resume_api_key else self.main_api_key
        self._set_api_key(active_key)
        active_model_name = self._select_model_for_key(active_key)
        if active_model_name is None:
            logger.error("No Gemini model available for the configured API key.")
            return None

        for attempt in range(max_retries):
            try:
                model = genai.GenerativeModel(active_model_name)
                if active_key == self.main_api_key:
                    self.model = model
                response = model.generate_content(prompt)
                self._record_api_call()
                return response.text
            except Exception as e:
                error_str = str(e).lower()
                if self._is_model_error(error_str):
                    logger.warning(f"Gemini model {active_model_name} failed: {e}. Trying another available model...")
                    active_model_name = self._select_model_for_key(
                        active_key,
                        force_refresh=True,
                        failed_model=active_model_name,
                    )
                    if active_model_name:
                        continue
                    logger.error("No fallback Gemini model remained after model failure.")
                    break

                is_retryable = any(k in error_str for k in [
                    "resource exhausted", "429", "503", "unavailable", "deadline", "timeout", "quota", "rate"
                ])
                if is_retryable and attempt < max_retries - 1:
                    wait = 2 ** attempt
                    logger.warning(f"API call failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {wait}s...")
                    time.sleep(wait)
                    continue

                logger.error(f"API call failed permanently: {e}")
                break

        if active_key != self.main_api_key:
            self._set_api_key(self.main_api_key)
        return None

    def _clean_json_text(self, text: str) -> str:
        text = text.strip()
        text = re.sub(r"^```\w*\n", "", text)
        text = re.sub(r"\n```$", "", text)
        text = re.sub(r"^```", "", text)
        text = re.sub(r"```$", "", text)
        text = "".join(char for char in text if ord(char) >= 32 or char in "\n\r\t")
        return text.strip()

    def _parse_json_response(self, text: str):
        try:
            return json.loads(self._clean_json_text(text))
        except Exception as e:
            logger.error(f"JSON parse error: {e}")
            return None

    def _normalize_question(self, question: dict, fallback_difficulty: str) -> dict:
        return {
            "question": question.get("question", "Tell me about a project you owned recently."),
            "type": question.get("type", "General"),
            "difficulty": question.get("difficulty", fallback_difficulty),
            "why_asked": question.get("why_asked", "To assess your experience and judgment."),
            "sample_answer_points": question.get("sample_answer_points", ["Context", "Action", "Impact"]),
            "key_topic": question.get("key_topic", "General"),
            "requires_code": bool(question.get("requires_code", False)),
            "interview_phase": question.get("interview_phase", "core"),
            "interviewer_goal": question.get("interviewer_goal", "Assess depth, clarity, and evidence."),
            "time_guidance": question.get("time_guidance", "60-90 seconds"),
        }

    def _shape_standard_flow(self, questions: list, difficulty: str, num_questions: int) -> list:
        phase_order = {
            "warmup": 0,
            "resume": 0,
            "core": 1,
            "technical": 1,
            "scenario": 2,
            "behavioral": 3,
            "closing": 4,
        }
        ordered = sorted(
            questions,
            key=lambda item: (
                phase_order.get(str(item.get("interview_phase", "core")).lower(), 2),
                {"Easy": 0, "Medium": 1, "Hard": 2}.get(str(item.get("difficulty", difficulty)).title(), 1),
            ),
        )
        if ordered:
            ordered[0]["interview_phase"] = "warmup"
            ordered[0]["time_guidance"] = ordered[0].get("time_guidance") or "45-60 seconds"
        return ordered[:num_questions]

    def analyze_resume_and_job(self, resume_text: str, job_description: str, job_role: str = "General") -> dict:
        self.cache_stats["total_requests"] += 1

        prompt = f"""You are a senior hiring manager preparing an interview plan for a {job_role} candidate.
Read every line of the resume carefully. Cross-reference it against the job description.
Your goal: figure out exactly where to probe this candidate so the interview feels real and specific.

RESUME (read every line):
{resume_text[:2000]}

JOB DESCRIPTION:
{job_description[:1000]}

Return ONLY valid JSON:
{{"compatibility_score": 75, "skill_match": 80, "experience_level": "Mid", "gaps": ["gap1", "gap2"], "strengths": ["strength1", "strength2"], "suggested_questions": 5, "question_difficulty": "Medium", "key_topics": ["topic1", "topic2"], "learning_focus": "what to study", "candidate_story": "one-line snapshot of who this candidate is", "interview_strategy": "how interviewer should probe this candidate", "summary": "brief summary", "challengeable_claims": ["specific resume claim that should be tested", "another claim"], "notable_projects": ["project name from resume"], "tech_stack": ["tech1", "tech2"]}}

Rules:
- suggested_questions must be 4-6
- key_topics should reflect overlap and likely gaps
- challengeable_claims: find 2-4 specific lines from the resume that an interviewer would want to verify (e.g. performance improvement claims, leadership claims, tool expertise)
- notable_projects: extract actual project names or descriptions from the resume
- tech_stack: list the specific technologies mentioned in the resume
- interview_strategy should describe HOW to interview THIS specific person, not generic advice
- infer which resume claims are most likely exaggerated or worth challenging"""

        try:
            response_text = self._call_with_retry(prompt)
            if response_text is None:
                return self._default_analysis()

            result = self._parse_json_response(response_text)
            if result is None:
                return self._default_analysis()

            result["compatibility_score"] = int(result.get("compatibility_score", 50))
            result["skill_match"] = int(result.get("skill_match", 50))
            result["suggested_questions"] = max(4, min(6, int(result.get("suggested_questions", 5))))
            result["experience_level"] = str(result.get("experience_level", "Mid"))
            result["question_difficulty"] = str(result.get("question_difficulty", "Medium"))
            result["gaps"] = result.get("gaps") if isinstance(result.get("gaps"), list) else ["General preparation"]
            result["strengths"] = result.get("strengths") if isinstance(result.get("strengths"), list) else ["Problem solving"]
            result["key_topics"] = result.get("key_topics") if isinstance(result.get("key_topics"), list) else ["general", "technical"]
            result["candidate_story"] = str(result.get("candidate_story", "Candidate shows a mix of delivery experience and growth potential."))
            result["interview_strategy"] = str(result.get("interview_strategy", "Start broad, then probe depth with concrete examples and tradeoffs."))
            result["learning_focus"] = str(result.get("learning_focus", "Focus on technical depth and real-world examples"))
            result["summary"] = str(result.get("summary", "Analysis completed."))
            return result
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return self._default_analysis()

    def _default_analysis(self) -> dict:
        return {
            "compatibility_score": 50,
            "skill_match": 50,
            "experience_level": "Mid",
            "gaps": ["Check manually"],
            "strengths": ["Experience"],
            "suggested_questions": 5,
            "question_difficulty": "Medium",
            "key_topics": ["general", "technical", "behavioral"],
            "learning_focus": "Focus on technical depth and real-world examples",
            "candidate_story": "Candidate needs a balanced interview across technical depth and communication.",
            "interview_strategy": "Start with resume validation, then move into role-specific scenarios and ownership questions.",
            "summary": "Analysis unavailable - using defaults",
        }

    def generate_smart_questions(self, resume_text: str, job_role: str, job_description: str, num_questions: int, difficulty: str, key_topics: list) -> list:
        self.cache_stats["total_requests"] += 1
        topics_str = ", ".join(key_topics[:5]) if isinstance(key_topics, list) else "general"

        prompt = f"""You are a senior {job_role} interviewer at a top company. You have read this candidate's resume line by line. Now you are sitting across from them in a real interview.

Your job: create exactly {num_questions} questions that a real interviewer would actually ask THIS specific candidate. Not generic questions — questions that come from reading THEIR resume.

CANDIDATE'S RESUME (read every single line carefully):
{resume_text[:2000]}

JOB THEY ARE APPLYING FOR:
{job_description[:800]}

KEY AREAS TO PROBE: {topics_str}
DIFFICULTY LEVEL: {difficulty}

Return ONLY a JSON array. Each question object:
[{{"question": "the question text", "type": "Technical", "difficulty": "{difficulty}", "why_asked": "why this matters for THIS candidate", "sample_answer_points": ["specific point 1", "specific point 2", "specific point 3"], "key_topic": "topic", "requires_code": false, "interview_phase": "warmup", "interviewer_goal": "what signal is being tested", "time_guidance": "60-90 seconds", "resume_anchor": "exact resume line or project that triggered this question"}}]

CRITICAL RULES — follow these exactly:
1. EVERY question MUST reference something specific from the resume — a project name, a technology, a metric, a company, or a specific claim. NO generic questions allowed.
2. Question 1 should be a warmup that asks them to walk through their most relevant project from the resume.
3. At least 2 questions must CHALLENGE specific claims on the resume. If they say "improved performance by 30%" — ask HOW they measured it, what the baseline was, what tradeoffs they made.
4. At least 1 question must be a realistic production scenario based on the tech stack in their resume (e.g. "Your resume mentions you used Redis and PostgreSQL — walk me through how you'd handle a cache invalidation bug in production").
5. Questions must sound conversational — like a real person asking in a live interview, NOT like a worksheet or exam.
6. Include a mix: 1-2 behavioral (STAR format), 2-3 technical depth, 1 scenario/architecture.
7. Each sample_answer_points must have 3-5 SPECIFIC points that reference the candidate's actual experience.
8. resume_anchor must quote the EXACT part of the resume that triggered this question.
9. Avoid textbook definitions. Never ask "What is X?" — instead ask "On your resume you used X in [project]. Walk me through a specific challenge you faced with X and how you solved it."
10. Questions should build on each other — as if the interviewer is naturally following up."""

        try:
            response_text = self._call_with_retry(prompt)
            if response_text is None:
                return self._default_questions(num_questions, job_role)

            result = self._parse_json_response(response_text)
            if not isinstance(result, list):
                result = [result] if result else []

            questions = [self._normalize_question(q, difficulty) for q in result if isinstance(q, dict) and q.get("question")]
            if not questions:
                return self._default_questions(num_questions, job_role)

            return self._shape_standard_flow(questions, difficulty, num_questions)
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            return self._default_questions(num_questions, job_role)

    def _default_questions(self, num_questions: int, job_role: str) -> list:
        base_questions = [
            {
                "question": f"Walk me through the project on your resume that best represents you as a {job_role}.",
                "type": "Behavioral",
                "difficulty": "Easy",
                "why_asked": "To validate your background and strongest ownership story.",
                "sample_answer_points": ["Context", "Ownership", "Impact"],
                "key_topic": "Experience",
                "requires_code": False,
                "interview_phase": "warmup",
                "interviewer_goal": "Understand strongest project ownership",
                "time_guidance": "45-60 seconds",
                "resume_anchor": "strongest project or most relevant experience",
            },
            {
                "question": "On your resume, where did you deal with the hardest technical problem, and how did you debug it or make tradeoffs under pressure?",
                "type": "Technical",
                "difficulty": "Medium",
                "why_asked": "To assess debugging depth and real-world judgment.",
                "sample_answer_points": ["Problem", "Root cause", "Tradeoff", "Impact"],
                "key_topic": "Problem Solving",
                "requires_code": False,
                "interview_phase": "scenario",
                "interviewer_goal": "Assess structured debugging and technical ownership",
                "time_guidance": "90 seconds",
                "resume_anchor": "most complex production problem on the resume",
            },
            {
                "question": f"Looking at your background, what part of your experience makes you most credible for this {job_role} role right now?",
                "type": "General",
                "difficulty": "Medium",
                "why_asked": "To measure evidence-backed strengths.",
                "sample_answer_points": ["Strength", "Example", "Result"],
                "key_topic": "Skills",
                "requires_code": False,
                "interview_phase": "core",
                "interviewer_goal": "Assess credibility and evidence",
                "time_guidance": "60-90 seconds",
                "resume_anchor": "role-fit evidence from resume and recent work",
            },
            {
                "question": "Tell me about a time from your past work where you had to align teammates or stakeholders under pressure. What changed because of your actions?",
                "type": "Behavioral",
                "difficulty": "Medium",
                "why_asked": "To assess communication and accountability.",
                "sample_answer_points": ["Situation", "Action", "Communication", "Outcome"],
                "key_topic": "Collaboration",
                "requires_code": False,
                "interview_phase": "behavioral",
                "interviewer_goal": "Assess leadership and stakeholder management",
                "time_guidance": "60-90 seconds",
                "resume_anchor": "cross-team ownership or collaboration example",
            },
        ]
        return base_questions[:num_questions]

    def evaluate_answer_with_feedback(self, question: str, answer: str, question_type: str, sample_points: list) -> dict:
        prompt = f"""You are a sharp but supportive interviewer evaluating a live interview answer.
Return ONLY valid JSON.

QUESTION: {question}
QUESTION TYPE: {question_type}
ANSWER: {answer}
EXPECTED: {", ".join(sample_points) if isinstance(sample_points, list) else "Good examples"}

Return this exact JSON:
{{"score": 7, "feedback": "Good answer", "strengths": ["strength1"], "improvements": ["improvement1"], "missing_points": ["missing1"], "how_to_improve": "how to improve", "example_improvement": "better answer", "confidence_indicator": "Good", "real_interview_tip": "real tip", "follow_up_topic": "topic", "score_breakdown": {{"clarity": 7, "depth": 6, "relevance": 8, "evidence": 5}}}}

Rules:
- reward specificity, ownership, tradeoff awareness, and examples
- penalize generic answers with no evidence
- feedback should sound like a real interviewer"""

        try:
            response_text = self._call_with_retry(prompt)
            if response_text is None:
                return self._default_evaluation()

            result = self._parse_json_response(response_text)
            if result is None:
                return self._default_evaluation()

            result["score"] = max(1, min(10, int(result.get("score", 5))))
            for field in ["strengths", "improvements", "missing_points"]:
                if not isinstance(result.get(field), list):
                    result[field] = [str(result.get(field, "Good"))]
            result["feedback"] = str(result.get("feedback", "Good attempt"))
            result["how_to_improve"] = str(result.get("how_to_improve", "Add more detail and stronger evidence."))
            result["example_improvement"] = str(result.get("example_improvement", "Mention the action you took and the measurable result."))
            result["confidence_indicator"] = str(result.get("confidence_indicator", "Average"))
            result["real_interview_tip"] = str(result.get("real_interview_tip", "Back up claims with specifics."))
            result["follow_up_topic"] = str(result.get("follow_up_topic", "General"))
            if not isinstance(result.get("score_breakdown"), dict):
                result["score_breakdown"] = {
                    "clarity": result["score"],
                    "depth": max(1, result["score"] - 1),
                    "relevance": result["score"],
                    "evidence": max(1, result["score"] - 1),
                }
            return result
        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
            return self._default_evaluation()

    def _default_evaluation(self) -> dict:
        return {
            "score": 6,
            "feedback": "Good attempt with room for improvement.",
            "strengths": ["Clear communication"],
            "improvements": ["Add more specific examples"],
            "missing_points": ["Quantifiable metrics"],
            "how_to_improve": "Include concrete decisions, actions, and measurable impact.",
            "example_improvement": "Instead of saying you improved performance, say what changed and by how much.",
            "confidence_indicator": "Average",
            "real_interview_tip": "Strong interview answers usually show context, action, and outcome.",
            "follow_up_topic": "Technical depth",
            "score_breakdown": {"clarity": 6, "depth": 5, "relevance": 6, "evidence": 4},
        }

    def generate_learning_report(self, answers: list, resume_analysis: dict, job_role: str) -> dict:
        answers_summary = "\n".join([f"Q: {a['question']}\nScore: {a['evaluation'].get('score', 5)}/10" for a in answers[:4]])

        prompt = f"""Generate a practical interview learning report. Return ONLY valid JSON.

Job: {job_role}
Compatibility: {resume_analysis.get('compatibility_score', 50)}%
Level: {resume_analysis.get('experience_level', 'Mid')}
Scores: {answers_summary}

Return this JSON:
{{"overall_assessment": "assessment", "recommendation": "Good Fit", "confidence_level": 7, "strengths_demonstrated": ["s1"], "areas_for_improvement": ["a1"], "preparation_plan": {{"immediate_focus": "focus", "daily_practice": ["p1"], "resources": ["r1"]}}, "interview_tips": ["t1"], "next_steps": ["n1"], "technical_topics_to_study": ["t1"], "behavioral_patterns_to_develop": ["b1"], "estimated_readiness": "2 weeks prep", "motivational_message": "You got this!"}}

Make it specific and actionable."""

        try:
            response_text = self._call_with_retry(prompt)
            if response_text is None:
                return self._default_learning_report()

            result = self._parse_json_response(response_text)
            if result is None:
                return self._default_learning_report()

            result["confidence_level"] = max(1, min(10, int(result.get("confidence_level", 5))))
            for field in [
                "strengths_demonstrated",
                "areas_for_improvement",
                "interview_tips",
                "next_steps",
                "technical_topics_to_study",
                "behavioral_patterns_to_develop",
            ]:
                if not isinstance(result.get(field), list):
                    result[field] = [str(result.get(field, "Item"))]

            if not isinstance(result.get("preparation_plan"), dict):
                result["preparation_plan"] = {}
            if not isinstance(result["preparation_plan"].get("daily_practice"), list):
                result["preparation_plan"]["daily_practice"] = ["Practice one structured answer daily"]
            if not isinstance(result["preparation_plan"].get("resources"), list):
                result["preparation_plan"]["resources"] = ["Mock interviews", "Interview notes"]

            return result
        except Exception as e:
            logger.error(f"Learning report generation failed: {e}")
            return self._default_learning_report()

    def _default_learning_report(self) -> dict:
        return {
            "overall_assessment": "Good performance overall with clear room to grow.",
            "recommendation": "Good Fit",
            "confidence_level": 7,
            "strengths_demonstrated": ["Communication", "Problem-solving"],
            "areas_for_improvement": ["Technical depth", "Specificity"],
            "preparation_plan": {
                "immediate_focus": "Practice stronger evidence-backed answers",
                "daily_practice": ["One technical scenario", "One STAR answer"],
                "resources": ["LeetCode", "System Design Primer"],
            },
            "interview_tips": ["Think aloud during problem solving", "Ask clarifying questions first", "Use STAR for behavioral questions"],
            "next_steps": ["Practice daily", "Review weak areas", "Do another mock interview"],
            "technical_topics_to_study": ["Data Structures", "Algorithms"],
            "behavioral_patterns_to_develop": ["STAR method", "Concise storytelling"],
            "estimated_readiness": "Ready in 2 weeks",
            "motivational_message": "You are closer than you think. Sharpen the weak areas and go again.",
        }

    def generate_final_report(self, answers: list, score: int, analysis: dict) -> dict:
        prompt = f"""Generate a realistic final interview summary. Return ONLY valid JSON.

Score: {score}%
Experience: {analysis.get('experience_level', 'Mid')}

Return this JSON:
{{"recommendation": "Good Fit", "overall_summary": "summary", "interview_readiness": 7, "confidence_boost": "motivational", "key_learnings": ["l1"], "next_big_step": "next step", "estimated_interview_success_rate": "75%"}}

Use recommendation values like Strong Hire, Good Fit, Borderline, or Needs Work."""

        try:
            response_text = self._call_with_retry(prompt)
            if response_text is None:
                return self._default_final_report()

            result = self._parse_json_response(response_text)
            if result is None:
                return self._default_final_report()

            result["interview_readiness"] = max(1, min(10, int(result.get("interview_readiness", 5))))
            if not isinstance(result.get("key_learnings"), list):
                result["key_learnings"] = ["Communication", "Specificity"]
            return result
        except Exception as e:
            logger.error(f"Final report generation failed: {e}")
            return self._default_final_report()

    def _default_final_report(self) -> dict:
        return {
            "recommendation": "Good Fit",
            "overall_summary": "Solid performance with a few areas that need more depth and sharper evidence.",
            "interview_readiness": 7,
            "confidence_boost": "You are close. A little more focused practice will make your answers feel much stronger.",
            "key_learnings": ["Technical communication", "Practical examples", "Structured storytelling"],
            "next_big_step": "Run another realistic mock interview and improve your weakest answer type.",
            "estimated_interview_success_rate": "75%",
        }

    def get_cache_stats(self) -> dict:
        if CACHE_ENABLED:
            try:
                advanced_stats = advanced_cache.stats_summary()
                return {
                    "llm_service_stats": self.cache_stats,
                    "advanced_cache_stats": advanced_stats,
                    "cache_enabled": True,
                    "efficiency_summary": advanced_cache.get_cache_status(),
                }
            except Exception as e:
                return {"cache_enabled": True, "error": str(e)}
        return {"cache_enabled": False, "message": "Cache system not available"}

    def evaluate_interview_batch(self, answers: list, job_role: str) -> dict:
        logger.info(f"Batch evaluating {len(answers)} answers for {job_role}...")

        transcript = ""
        for i, a in enumerate(answers):
            q_text = a.get("question", "Unknown Question")
            ans_text = a.get("answer", "No Answer")
            transcript += f"Q{i + 1}: {q_text}\nAnswer: {ans_text}\n\n"

        prompt = f"""You are an expert interviewer for the role of {job_role}.
Evaluate this Rapid Fire interview session. The candidate had limited time per question.

TRANSCRIPT:
{transcript}

Return ONLY a JSON object:
{{
  "question_evaluations": [
    {{
      "question_index": 1,
      "score": 8,
      "feedback": "Good point on X, but missed Y.",
      "key_missing": "Mention Z",
      "strong_signal": "what worked well",
      "next_step": "what to improve next time"
    }}
  ],
  "overall_report": {{
    "total_score": 75,
    "average_score": 7.5,
    "rating": "HIRE/CONSIDER/TRAIN",
    "summary": "Strong technical skills but weak on system design.",
    "strengths": ["Python", "SQL"],
    "improvements": ["Optimization"],
    "focus_areas": ["System design", "Specificity"],
    "recommended_next_round": "Do another rapid fire focused on debugging and tradeoffs."
  }}
}}"""

        try:
            response_text = self._call_with_retry(prompt)
            if response_text is None:
                return self._default_batch_evaluation(len(answers))

            result = self._parse_json_response(response_text)
            if result is None:
                return self._default_batch_evaluation(len(answers))

            # Normalize the result structure
            if "question_evaluations" not in result or "overall_report" not in result:
                return self._default_batch_evaluation(len(answers))

            return result
        except Exception as e:
            logger.error(f"Batch evaluation failed: {e}")
            return self._default_batch_evaluation(len(answers))

    def _default_batch_evaluation(self, count: int) -> dict:
        return {
            "question_evaluations": [
                {
                    "question_index": i + 1,
                    "score": 5,
                    "feedback": "Processed (Fallback)",
                    "key_missing": "N/A",
                    "strong_signal": "Kept moving",
                    "next_step": "Add more specifics",
                }
                for i in range(count)
            ],
            "overall_report": {
                "total_score": 5 * count,
                "average_score": 5.0,
                "rating": "CONSIDER",
                "summary": "Evaluation data unavailable due to service error.",
                "strengths": ["Participation"],
                "improvements": ["Retry later"],
                "focus_areas": ["Specificity"],
                "recommended_next_round": "Retry the session once the evaluator is available.",
            },
        }

    def generate_batch_questions(self, job_role: str, num_questions: int = 50, difficulty: str = "Medium") -> list:
        prompt = f"""Generate a comprehensive interview question bank for the role: {job_role}.
Target Audience: {difficulty} level candidates.

Generate exactly {num_questions} unique technical and behavioral questions.

Requirements:
1. Focus on real-world production scenarios, debugging, and system design.
2. Questions must be job-ready, not trivia.
3. difficulty should be '{difficulty}'.
4. keywords must be a list of 3-5 crucial words/phrases expected in the answer.

Return ONLY a JSON array:
[
  {{
    "question": "Question text here",
    "type": "Technical",
    "difficulty": "{difficulty}",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }}
]"""

        try:
            response_text = self._call_with_retry(prompt)
            if response_text is None:
                return []

            result = self._parse_json_response(response_text)
            if not isinstance(result, list):
                if isinstance(result, dict) and "questions" in result:
                    result = result["questions"]
                else:
                    result = [result] if result else []

            valid_questions = []
            for q in result:
                if isinstance(q, dict) and q.get("question"):
                    valid_questions.append({
                        "question": q["question"],
                        "type": q.get("type", "Technical"),
                        "difficulty": q.get("difficulty", difficulty),
                        "keywords": q.get("keywords", ["relevant answer"]),
                    })
            return valid_questions
        except Exception as e:
            logger.error(f"Batch generation failed for {job_role}: {e}")
            return []

    def analyze_resume(self, resume_text: str) -> dict:
        """
        Resume Scorer: ATS score + missing keywords + magic bullet rewrites.
        Uses the dedicated resume API key if available.
        """
        prompt = f"""You are an expert ATS resume coach at a top career consulting firm. A candidate has uploaded their resume for scoring.

Your job: analyze the resume for ATS compatibility, identify missing keywords, find formatting issues, and rewrite the weakest bullet points to be much stronger.

RESUME TEXT (analyze every line carefully):
{resume_text[:3000]}

You MUST return ONLY valid JSON in this EXACT structure — no markdown, no explanation, just the JSON object:
{{
  "score": 72,
  "summary": "One paragraph assessment of the resume's overall quality, strengths, and biggest weaknesses. Be specific about what's good and what needs work.",
  "ats_feedback": {{
    "missing_keywords": ["keyword1", "keyword2", "keyword3"],
    "formatting_issues": ["issue1", "issue2"]
  }},
  "magic_rewrites": [
    {{
      "original": "exact weak bullet point copied from the resume",
      "rewritten": "the same point rewritten with action verbs, metrics, and impact",
      "explanation": "what was improved and why it's stronger"
    }},
    {{
      "original": "another weak bullet",
      "rewritten": "stronger version",
      "explanation": "improvement rationale"
    }}
  ]
}}

CRITICAL RULES:
1. score must be an integer 0-100. Be honest — most resumes score 50-80.
2. summary must be a specific, personalized paragraph (not generic boilerplate).
3. missing_keywords: list 3-8 industry-relevant keywords that are MISSING from this resume but should be there.
4. formatting_issues: list 1-4 concrete formatting problems (e.g. "No quantifiable metrics in experience section", "Missing skills section").
5. magic_rewrites: find 2-4 of the WEAKEST bullet points from the actual resume text and rewrite them. The "original" field must be text that actually appears in the resume.
6. Each rewrite must add: action verb, specific metrics/numbers, and clear impact.
7. Do NOT wrap the JSON in markdown code blocks. Return raw JSON only."""

        try:
            response_text = self._call_with_retry(prompt, use_resume_key=True)
            if response_text is None:
                logger.error("Resume analysis: _call_with_retry returned None")
                return self._default_resume_analysis()

            result = self._parse_json_response(response_text)
            if result is None:
                logger.error("Resume analysis: JSON parse returned None")
                return self._default_resume_analysis()

            # Validate and ensure all required fields exist with correct types
            result["score"] = int(result.get("score", 0))
            result["summary"] = str(result.get("summary", "Analysis completed."))

            ats = result.get("ats_feedback")
            if not isinstance(ats, dict):
                ats = {}
            result["ats_feedback"] = {
                "missing_keywords": ats.get("missing_keywords", []) if isinstance(ats.get("missing_keywords"), list) else [],
                "formatting_issues": ats.get("formatting_issues", []) if isinstance(ats.get("formatting_issues"), list) else [],
            }

            rewrites = result.get("magic_rewrites")
            if not isinstance(rewrites, list):
                rewrites = []
            result["magic_rewrites"] = [
                r for r in rewrites
                if isinstance(r, dict) and r.get("original") and r.get("rewritten")
            ]

            return result
        except Exception as e:
            logger.error(f"Resume analysis failed: {e}")
            return self._default_resume_analysis()

    def _default_resume_analysis(self):
        return {
            "score": 0,
            "summary": "Analysis could not be completed. Please check your API key and try again.",
            "ats_feedback": {"missing_keywords": [], "formatting_issues": []},
            "magic_rewrites": [],
        }

    def enhance_resume_bullet(self, bullet: str, job_role: str = "", job_description: str = "") -> dict:
        role_context = f" for a {job_role} position" if job_role else ""
        jd_context = f"\n\nTARGET JOB DESCRIPTION:\n{job_description}" if job_description else ""

        prompt = f"""You are an expert resume writer. Rewrite this bullet point to be more impactful{role_context}.{jd_context}

ORIGINAL BULLET POINT:
"{bullet}"

Rules:
1. Start with a strong action verb
2. Add quantifiable metrics where possible
3. Use the format: Action + Context + Impact
4. Keep it concise
5. Make it ATS-friendly

Return ONLY valid JSON:
{{"enhanced": "the rewritten bullet point", "tip": "one short tip explaining what was improved"}}"""

        try:
            response_text = self._call_with_retry(prompt)
            if response_text is None:
                return {"enhanced": bullet, "tip": "Enhancement service busy. Try again later."}

            result = self._parse_json_response(response_text)
            if result and "enhanced" in result:
                return result
            return {"enhanced": bullet, "tip": "Could not enhance. Try rephrasing."}
        except Exception as e:
            logger.error(f"Bullet enhance failed: {e}")
            return {"enhanced": bullet, "tip": "Enhancement service unavailable."}
