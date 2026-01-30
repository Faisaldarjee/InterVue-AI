# -*- coding: utf-8 -*-
"""
Data Models for HireWise
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Answer(BaseModel):
    """User's answer to a question"""
    answer: str

class Question(BaseModel):
    """Interview question"""
    question: str
    type: str
    expected_points: List[str] = []

class Evaluation(BaseModel):
    """Answer evaluation"""
    score: int  # 1-10
    feedback: str
    strengths: Optional[List[str]] = []
    improvements: Optional[List[str]] = []

class InterviewSession(BaseModel):
    """Interview session tracking"""
    session_id: str
    job_role: str
    job_description: str
    resume_text: str
    analysis: Dict[str, Any]
    questions: List[Dict[str, Any]]
    answers: List[Dict[str, Any]] = []
    current_question_index: int = 0
    started_at: datetime
    completed_at: Optional[datetime] = None
    final_report: Optional[Dict[str, Any]] = None

class ResumeAnalysis(BaseModel):
    """Resume analysis result"""
    compatibility_score: int  # 0-100
    strengths: List[str]
    gaps: List[str]
    summary: str

class InterviewReport(BaseModel):
    """Final interview report"""
    recommendation: str  # Hire/Reject/Maybe
    summary: str
    detailed_scores: Dict[str, int]
    strengths: Optional[List[str]] = []
    improvements: Optional[List[str]] = []

class SessionResponse(BaseModel):
    """API response for session"""
    status: str
    session_id: str
    message: str
    analysis: Optional[Dict[str, Any]] = None
    first_question: Optional[Dict[str, Any]] = None
    total_questions: Optional[int] = None

class AnswerResponse(BaseModel):
    """API response for answer submission"""
    status: str
    message: str
    evaluation: Dict[str, Any]
    next_question: Optional[Dict[str, Any]] = None
    final_report: Optional[Dict[str, Any]] = None
    progress: Optional[Dict[str, int]] = None