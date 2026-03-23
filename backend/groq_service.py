# -*- coding: utf-8 -*-
"""
Groq AI Service — Job Search Intelligence
Uses Llama 3.1 70B via Groq for skill extraction and job fit analysis
"""

import os
import json
import logging
from groq import Groq

logger = logging.getLogger(__name__)


class GroqJobService:
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        if not self.api_key:
            logger.warning("⚠️ GROQ_API_KEY not found — Job AI features disabled")
            self.client = None
            return

        self.client = Groq(api_key=self.api_key)
        self.model = "llama-3.3-70b-versatile"
        logger.info(f"✅ Groq service initialized with {self.model}")

    def _chat(self, system_prompt, user_prompt, max_tokens=2000):
        """Send a chat completion request to Groq"""
        if not self.client:
            raise Exception("Groq API key not configured")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=max_tokens,
                response_format={"type": "json_object"}
            )
            result = response.choices[0].message.content
            return json.loads(result)
        except json.JSONDecodeError:
            # If JSON parsing fails, return raw text
            return {"raw": result}
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise

    def extract_search_keywords(self, resume_text):
        """Extract job search keywords from resume using AI"""
        system_prompt = """You are a career analysis AI. Extract job search keywords from the resume.
Return JSON with exactly this structure:
{
    "job_titles": ["title1", "title2", "title3"],
    "skills": ["skill1", "skill2", "skill3"],
    "experience_level": "junior|mid|senior|lead",
    "search_queries": ["query1", "query2", "query3"],
    "industries": ["industry1", "industry2"]
}
- job_titles: 3 most relevant job titles this person could apply for
- skills: Top 8-10 technical & soft skills
- experience_level: Based on years of experience and role seniority
- search_queries: 3 optimized job search queries combining title + key skills
- industries: 2 most relevant industries"""

        user_prompt = f"Extract job search keywords from this resume:\n\n{resume_text[:3000]}"
        return self._chat(system_prompt, user_prompt, max_tokens=800)

    def analyze_job_fit(self, resume_text, job_title, job_description, company_name=""):
        """Analyze how well a resume matches a specific job"""
        system_prompt = """You are a career matching AI. Analyze how well the candidate's resume matches the job.
Return JSON with exactly this structure:
{
    "fit_score": 85,
    "verdict": "Strong Match",
    "matched_skills": ["skill1", "skill2", "skill3"],
    "missing_skills": ["skill1", "skill2"],
    "strengths": ["strength1", "strength2"],
    "improvement_tips": ["tip1", "tip2", "tip3"],
    "interview_focus": ["topic1", "topic2"],
    "salary_insight": "Based on the role and skills, expected range is..."
}
- fit_score: 0-100 integer
- verdict: "Perfect Match" (90+), "Strong Match" (75-89), "Good Match" (60-74), "Partial Match" (40-59), "Low Match" (<40)
- matched_skills: Skills from JD that the candidate HAS
- missing_skills: Skills from JD that the candidate is MISSING
- strengths: 2-3 things that make this candidate stand out for this role
- improvement_tips: 3 actionable tips to improve chances
- interview_focus: 2 topics they should prepare for
- salary_insight: Brief salary range insight"""

        user_prompt = f"""RESUME:
{resume_text[:2500]}

JOB TITLE: {job_title}
COMPANY: {company_name}
JOB DESCRIPTION:
{job_description[:2000]}

Analyze the fit between this resume and job."""

        return self._chat(system_prompt, user_prompt, max_tokens=1200)

    def quick_job_summary(self, job_description):
        """Generate a quick AI summary of a job posting"""
        system_prompt = """Summarize this job posting concisely.
Return JSON:
{
    "summary": "2-3 sentence summary",
    "key_requirements": ["req1", "req2", "req3"],
    "nice_to_have": ["nice1", "nice2"],
    "role_type": "Full-time|Part-time|Contract|Internship",
    "remote_status": "Remote|Hybrid|On-site|Unknown"
}"""

        user_prompt = f"Summarize this job:\n\n{job_description[:2000]}"
        return self._chat(system_prompt, user_prompt, max_tokens=600)

    def tailor_resume(self, original_resume: str, job_title: str, job_description: str) -> dict:
        """
        Rewrites the original resume to highlight matched skills and optimize for the specific
        job description. Returns structured JSON matching the ResumeBuilder frontend schema.
        """
        system_prompt = """
        You are a world-class executive resume writer and ATS optimization expert.
        Your task is to take an original resume and tailor it specifically for a target Job Description.
        You must output ONLY valid JSON matching this exact structure:
        {
          "fullName": "Name from original resume, or 'Jane Doe' if not found",
          "email": "Email from original",
          "phone": "Phone from original",
          "location": "Location from original",
          "summary": "A powerful, 3-sentence tailored professional summary hitting the exact keywords of the JD",
          "skills": ["Skill 1", "Skill 2"],
          "experience": [
            {
              "company": "Company Name",
              "role": "Job Title",
              "duration": "Dates",
              "description": "• 3-4 powerful bullet points starting with action verbs. Rewrite the user's original experience to heavily emphasize any aspects that match the target Job Description. Quantify achievements where possible."
            }
          ],
          "education": [
            {
              "school": "University/School",
              "degree": "Degree/Major",
              "year": "Graduation Year"
            }
          ]
        }
        IMPORTANT RULES:
        1. DO NOT invent fake experiences or companies. Only use facts from the original resume.
        2. REWRITE the descriptions (bullet points) to align perfectly with the target Job Title and JD.
        3. Make the summary extremely compelling for this specific role.
        """
        
        user_prompt = f"""
        TARGET JOB TITLE: {job_title}
        
        TARGET JOB DESCRIPTION:
        {job_description[:2000]}
        
        ORIGINAL RESUME:
        {original_resume[:3000]}
        """
        
        try:
            return self._chat(system_prompt, user_prompt, max_tokens=2500)
        except Exception as e:
            logger.error(f"Resume compiling error: {e}")
            return {"error": "Failed to tailor resume"}
