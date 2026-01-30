# -*- coding: utf-8 -*-
"""
Enhanced LLM Service - PRODUCTION Version
With proper cache separation (Questions vs Analysis)
Fixed: Import errors resolved
"""

import google.generativeai as genai
import os
import json
import re
import logging

logger = logging.getLogger(__name__)

# Import advanced cache system - WITH ERROR HANDLING
try:
    from advanced_smart_cache import advanced_cache
    CACHE_ENABLED = True
    logger.info("✅ Advanced smart cache system loaded")
except ImportError as e:
    logger.warning(f"⚠️ Cache system not available: {e}. Caching disabled.")
    CACHE_ENABLED = False
    advanced_cache = None


class EnhancedLLMService:
    def __init__(self):
        """Initialize Gemini AI with enhanced capabilities"""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")
        
        genai.configure(api_key=api_key)
        
        # Auto-detect best available model
        print("🔍 Detecting available Gemini models...")
        try:
            available_models = []
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    available_models.append(m.name)
            
            priorities = [
                'models/gemini-2.5-flash',
                'models/gemini-1.5-flash',
                'models/gemini-1.5-pro',
                'models/gemini-1.0-pro',
                'models/gemini-pro'
            ]
            
            chosen_model = None
            for p in priorities:
                if p in available_models:
                    chosen_model = p
                    break
            
            if not chosen_model and available_models:
                chosen_model = available_models[0]
            
            if not chosen_model:
                chosen_model = 'models/gemini-pro'
            
            print(f"✅ Using model: {chosen_model}")
            self.model = genai.GenerativeModel(chosen_model)
            
        except Exception as e:
            logger.warning(f"⚠️ Model detection failed: {e}. Using default.")
            self.model = genai.GenerativeModel('models/gemini-pro')
        
        self.cache_stats = {'total_requests': 0, 'cache_hits': 0, 'api_calls': 0}

    def _clean_json_text(self, text: str) -> str:
        """Remove markdown code blocks and clean up JSON"""
        text = text.strip()
        text = re.sub(r"^```\w*\n", "", text)
        text = re.sub(r"\n```$", "", text)
        text = re.sub(r"^```", "", text)
        text = re.sub(r"```$", "", text)
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
        return text.strip()

    def _parse_json_response(self, text: str) -> dict:
        """Safely parse JSON response with fallback"""
        try:
            cleaned = self._clean_json_text(text)
            result = json.loads(cleaned)
            return result
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return None
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return None

    def analyze_resume_and_job(self, resume_text: str, job_description: str) -> dict:
        """Analyze resume against job with ANALYSIS CACHE"""
        self.cache_stats['total_requests'] += 1
        
        # TRY ANALYSIS CACHE FIRST
        if CACHE_ENABLED:
            logger.info("🔍 Checking analysis cache...")
            try:
                cached_analysis = advanced_cache.get_exact_analysis(job_description)
                
                if cached_analysis:
                    logger.info(f"✅ ANALYSIS CACHE HIT - Using cached analysis")
                    self.cache_stats['cache_hits'] += 1
                    return cached_analysis
            except Exception as e:
                logger.warning(f"Cache lookup failed: {e}")
        
        # NOT CACHED, CALL API
        logger.info("🚀 Calling Gemini API for new analysis...")
        
        prompt = f"""Analyze this resume against the job description. Return ONLY valid JSON.

RESUME:
{resume_text[:1500]}

JOB DESCRIPTION:
{job_description[:1000]}

Return this exact JSON format (no extra text, no markdown):
{{"compatibility_score": 75, "skill_match": 80, "experience_level": "Mid", "gaps": ["gap1", "gap2"], "strengths": ["strength1", "strength2"], "suggested_questions": 4, "question_difficulty": "Medium", "key_topics": ["topic1", "topic2"], "learning_focus": "what to study", "summary": "brief summary"}}

Fill in the values based on analysis. suggested_questions must be 3-6."""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            
            if result is None:
                logger.warning("⚠️ JSON parse failed, using defaults")
                return self._default_analysis()
            
            result['compatibility_score'] = int(result.get('compatibility_score', 50))
            result['skill_match'] = int(result.get('skill_match', 50))
            result['suggested_questions'] = max(3, min(6, int(result.get('suggested_questions', 4))))
            result['experience_level'] = result.get('experience_level', 'Mid')
            result['question_difficulty'] = result.get('question_difficulty', 'Medium')
            
            if not isinstance(result.get('gaps'), list):
                result['gaps'] = ['General preparation']
            if not isinstance(result.get('strengths'), list):
                result['strengths'] = ['Problem solving']
            if not isinstance(result.get('key_topics'), list):
                result['key_topics'] = ['general', 'technical']
            
            # SAVE TO ANALYSIS CACHE
            if CACHE_ENABLED:
                try:
                    advanced_cache.save_analysis(analysis=result, job_description=job_description)
                    advanced_cache.record_api_call()
                    self.cache_stats['api_calls'] += 1
                    logger.info(f"💾 Analysis cached for future use")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to cache analysis: {e}")
            
            logger.info(f"✅ Resume analysis complete: {result['suggested_questions']} questions recommended")
            return result
        except Exception as e:
            logger.error(f"❌ Analysis failed: {e}")
            return self._default_analysis()

    def _default_analysis(self) -> dict:
        return {
            "compatibility_score": 50, "skill_match": 50, "experience_level": "Mid",
            "gaps": ["Check manually"], "strengths": ["Experience"], "suggested_questions": 4,
            "question_difficulty": "Medium", "key_topics": ["general", "technical", "behavioral"],
            "learning_focus": "Focus on technical depth and real-world examples",
            "summary": "Analysis unavailable - using defaults"
        }

    def generate_smart_questions(self, resume_text: str, job_role: str, job_description: str, num_questions: int, difficulty: str, key_topics: list) -> list:
        """Generate adaptive questions with QUESTIONS CACHE"""
        self.cache_stats['total_requests'] += 1
        topics_str = ", ".join(key_topics[:5]) if isinstance(key_topics, list) else "general"
        
        # TRY QUESTIONS CACHE
        if CACHE_ENABLED:
            logger.info("🧠 Checking questions cache...")
            try:
                cached_questions, strategy = advanced_cache.get_smart_response(
                    job_role=job_role, job_description=job_description, difficulty=difficulty
                )
                
                if cached_questions:
                    self.cache_stats['cache_hits'] += 1
                    logger.info(f"✅ QUESTIONS CACHE HIT ({strategy}): Using cached questions")
                    return cached_questions[:num_questions]
            except Exception as e:
                logger.warning(f"Cache lookup failed: {e}")
        
        # NOT IN CACHE, GENERATE NEW
        logger.info(f"🚀 Generating NEW questions for {job_role} ({difficulty})")
        
        prompt = f"""Generate {num_questions} interview questions for: {job_role}

Resume: {resume_text[:1000]}
Job requirements: {job_description[:800]}
Topics: {topics_str}
Difficulty: {difficulty}

Return ONLY a JSON array with no markdown, no code blocks. Each question must have this structure:
[{{"question": "the question text", "type": "Technical", "difficulty": "{difficulty}", "why_asked": "why this matters", "sample_answer_points": ["point1", "point2"], "key_topic": "topic"}}]

Generate {num_questions} valid questions. Return ONLY the JSON array, nothing else."""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            
            if result is None:
                logger.warning("⚠️ Question generation failed, using defaults")
                return self._default_questions(num_questions, job_role)
            
            if not isinstance(result, list):
                result = [result]
            
            questions = []
            for q in result[:num_questions]:
                if isinstance(q, dict) and 'question' in q:
                    q['type'] = q.get('type', 'General')
                    q['difficulty'] = q.get('difficulty', difficulty)
                    q['why_asked'] = q.get('why_asked', 'To assess your experience')
                    q['sample_answer_points'] = q.get('sample_answer_points', ['Experience', 'Skills'])
                    q['key_topic'] = q.get('key_topic', 'General')
                    questions.append(q)
            
            if not questions:
                logger.warning("⚠️ No valid questions parsed")
                return self._default_questions(num_questions, job_role)
            
            # SAVE TO QUESTIONS CACHE
            if CACHE_ENABLED:
                try:
                    advanced_cache.save_questions(questions=questions, job_role=job_role, 
                                                  job_description=job_description, difficulty=difficulty)
                    advanced_cache.record_api_call()
                    self.cache_stats['api_calls'] += 1
                    logger.info(f"💾 Questions saved to cache for {job_role}")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to cache questions: {e}")
            
            logger.info(f"✅ Generated {len(questions)} questions and cached")
            return questions
        except Exception as e:
            logger.error(f"❌ Question generation failed: {e}")
            return self._default_questions(num_questions, job_role)

    def _default_questions(self, num_questions: int, job_role: str) -> list:
        base_questions = [
            {"question": f"Tell us about your experience as a {job_role}.", "type": "Behavioral", "difficulty": "Medium", "why_asked": "To understand your background and experience", "sample_answer_points": ["Years of experience", "Key projects", "Technologies used"], "key_topic": "Experience"},
            {"question": f"What's your strongest skill related to {job_role}?", "type": "General", "difficulty": "Easy", "why_asked": "To identify your core competencies", "sample_answer_points": ["Specific skill", "How developed it", "Examples"], "key_topic": "Skills"},
            {"question": "Describe a challenging problem you solved at work.", "type": "Technical", "difficulty": "Medium", "why_asked": "To see your problem-solving approach", "sample_answer_points": ["Problem description", "Your approach", "Final solution"], "key_topic": "Problem Solving"},
            {"question": "How do you stay updated with latest technologies?", "type": "Behavioral", "difficulty": "Easy", "why_asked": "To assess your learning mindset", "sample_answer_points": ["Learning methods", "Recent learnings", "Certifications"], "key_topic": "Learning"}
        ]
        return base_questions[:num_questions]

    def evaluate_answer_with_feedback(self, question: str, answer: str, question_type: str, sample_points: list) -> dict:
        prompt = f"""Evaluate this interview answer. Return ONLY valid JSON.

QUESTION: {question}
ANSWER: {answer}
EXPECTED: {", ".join(sample_points) if isinstance(sample_points, list) else "Good examples"}

Return this exact JSON (no markdown):
{{"score": 7, "feedback": "Good answer", "strengths": ["strength1"], "improvements": ["improvement1"], "missing_points": ["missing1"], "how_to_improve": "how to improve", "example_improvement": "better answer", "confidence_indicator": "Good", "real_interview_tip": "real tip", "follow_up_topic": "topic"}}

Score must be 1-10."""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            
            if result is None:
                logger.warning("⚠️ Evaluation JSON parse failed")
                return self._default_evaluation()
            
            result['score'] = max(1, min(10, int(result.get('score', 5))))
            for field in ['strengths', 'improvements', 'missing_points']:
                if not isinstance(result.get(field), list):
                    result[field] = [result.get(field, 'Good')]
            
            result['feedback'] = str(result.get('feedback', 'Good attempt'))
            result['how_to_improve'] = str(result.get('how_to_improve', 'Add more details'))
            result['real_interview_tip'] = str(result.get('real_interview_tip', 'Be specific'))
            result['follow_up_topic'] = str(result.get('follow_up_topic', 'General'))
            
            logger.info(f"✅ Answer evaluated: score={result['score']}")
            return result
        except Exception as e:
            logger.error(f"❌ Evaluation failed: {e}")
            return self._default_evaluation()

    def _default_evaluation(self) -> dict:
        return {
            "score": 6, "feedback": "Good attempt with room for improvement",
            "strengths": ["Clear communication"], "improvements": ["Add more specific examples"],
            "missing_points": ["Quantifiable metrics"], "how_to_improve": "Include specific numbers and metrics in your examples",
            "example_improvement": "Instead of 'improved performance', say 'reduced latency by 40%'",
            "confidence_indicator": "Average", "real_interview_tip": "Always back up claims with measurable results",
            "follow_up_topic": "Technical depth"
        }

    def generate_learning_report(self, answers: list, resume_analysis: dict, job_role: str) -> dict:
        answers_summary = "\n".join([f"Q: {a['question']}\nScore: {a['evaluation'].get('score', 5)}/10" for a in answers[:3]])

        prompt = f"""Generate learning report. Return ONLY valid JSON with no markdown.

Job: {job_role}
Compatibility: {resume_analysis.get('compatibility_score', 50)}%
Level: {resume_analysis.get('experience_level', 'Mid')}
Scores: {answers_summary}

Return this exact JSON:
{{"overall_assessment": "assessment", "recommendation": "Good Fit", "confidence_level": 7, "strengths_demonstrated": ["s1"], "areas_for_improvement": ["a1"], "preparation_plan": {{"immediate_focus": "focus", "daily_practice": ["p1"], "resources": ["r1"]}}, "interview_tips": ["t1"], "next_steps": ["n1"], "technical_topics_to_study": ["t1"], "behavioral_patterns_to_develop": ["b1"], "estimated_readiness": "2 weeks prep", "motivational_message": "You got this!"}}

confidence_level must be 1-10."""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            
            if result is None:
                logger.warning("⚠️ Learning report JSON parse failed")
                return self._default_learning_report()
            
            result['confidence_level'] = max(1, min(10, int(result.get('confidence_level', 5))))
            for field in ['strengths_demonstrated', 'areas_for_improvement', 'interview_tips', 'next_steps', 'technical_topics_to_study', 'behavioral_patterns_to_develop']:
                if not isinstance(result.get(field), list):
                    result[field] = [str(result.get(field, 'Item'))]
            
            if isinstance(result.get('preparation_plan'), dict):
                if not isinstance(result['preparation_plan'].get('daily_practice'), list):
                    result['preparation_plan']['daily_practice'] = ['Practice daily']
                if not isinstance(result['preparation_plan'].get('resources'), list):
                    result['preparation_plan']['resources'] = ['Study resources']
            
            logger.info("✅ Learning report generated")
            return result
        except Exception as e:
            logger.error(f"❌ Report generation failed: {e}")
            return self._default_learning_report()

    def _default_learning_report(self) -> dict:
        return {
            "overall_assessment": "Good performance overall", "recommendation": "Good Fit",
            "confidence_level": 7, "strengths_demonstrated": ["Communication", "Problem-solving"],
            "areas_for_improvement": ["Technical depth", "System design"],
            "preparation_plan": {"immediate_focus": "Practice coding problems", "daily_practice": ["DSA problems - 30 min", "System design - 30 min"], "resources": ["LeetCode", "System Design Primer"]},
            "interview_tips": ["Think aloud during problem solving", "Ask clarifying questions first", "Use STAR method for behavioral"],
            "next_steps": ["Practice daily", "Review weak areas", "Mock interviews"],
            "technical_topics_to_study": ["Data Structures", "Algorithms"],
            "behavioral_patterns_to_develop": ["STAR method", "Confidence"],
            "estimated_readiness": "Ready in 2 weeks",
            "motivational_message": "You're on the right track! Keep practicing."
        }

    def generate_final_report(self, answers: list, score: int, analysis: dict) -> dict:
        prompt = f"""Generate final interview report. Return ONLY valid JSON with no markdown.

Score: {score}%
Experience: {analysis.get('experience_level', 'Mid')}

Return this exact JSON:
{{"recommendation": "Good Fit", "overall_summary": "summary", "interview_readiness": 7, "confidence_boost": "motivational", "key_learnings": ["l1"], "next_big_step": "next step", "estimated_interview_success_rate": "75%"}}

interview_readiness must be 1-10."""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            
            if result is None:
                logger.warning("⚠️ Final report JSON parse failed")
                return self._default_final_report()
            
            result['interview_readiness'] = max(1, min(10, int(result.get('interview_readiness', 5))))
            if not isinstance(result.get('key_learnings'), list):
                result['key_learnings'] = ['Learning 1', 'Learning 2']
            
            logger.info("✅ Final report generated")
            return result
        except Exception as e:
            logger.error(f"❌ Final report failed: {e}")
            return self._default_final_report()

    def _default_final_report(self) -> dict:
        return {
            "recommendation": "Good Fit", "overall_summary": "Solid performance in interview",
            "interview_readiness": 7, "confidence_boost": "You're ready for real interviews with a bit more practice",
            "key_learnings": ["Technical communication", "Practical examples", "Problem-solving"],
            "next_big_step": "Apply to real positions with confidence",
            "estimated_interview_success_rate": "75%"
        }
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics for monitoring"""
        if CACHE_ENABLED:
            try:
                advanced_stats = advanced_cache.stats_summary()
                return {'llm_service_stats': self.cache_stats, 'advanced_cache_stats': advanced_stats, 'cache_enabled': True, 'efficiency_summary': advanced_cache.get_cache_status()}
            except Exception as e:
                logger.warning(f"Failed to get cache stats: {e}")
                return {'cache_enabled': True, 'error': str(e)}
        else:
            return {'cache_enabled': False, 'message': 'Cache system not available'}