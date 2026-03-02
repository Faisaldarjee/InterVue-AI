# -*- coding: utf-8 -*-
"""
InterVue AI - Enhanced Backend
Smart interview generation with adaptive difficulty and learning insights
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import os
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Local imports
from llm_service import EnhancedLLMService
from resume_parser import ResumeParser
from rapid_fire_mode import RapidFireMode
from models import Answer, InterviewSession, RapidFireStartRequest
from auth import get_current_user, get_optional_user
from database import (
    get_profile, save_interview as db_save_interview,
    get_user_interviews, get_user_stats, save_resume as db_save_resume,
    get_user_resumes, upload_resume_file, save_questions_to_bank,
    get_question_bank_count
)
from learning import get_full_learning_data

load_dotenv()

# ==================== LOGGING ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== FASTAPI ====================
app = FastAPI(
    title="InterVue AI",
    description="Smart Interview Platform with AI-Powered Learning",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== INIT ====================
try:
    llm = EnhancedLLMService()
    logger.info("✅ Enhanced LLM Service initialized")
except Exception as e:
    logger.error(f"❌ LLM Service initialization failed: {str(e)}")
    llm = None

try:
    rapid_fire = RapidFireMode()
    logger.info("✅ Rapid Fire Mode initialized")
except Exception as e:
    logger.error(f"❌ Rapid Fire initialization failed: {str(e)}")
    rapid_fire = None

sessions: Dict[str, InterviewSession] = {}
analytics = {
    "total_sessions": 0,
    "completed_interviews": 0,
    "average_score": 0.0,
    "total_candidates": 0
}

# ==================== HEALTH ====================

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "service": "InterVue AI",
        "version": "3.0.0",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "Smart Question Generation",
            "Adaptive Difficulty",
            "Learning Insights",
            "Real Interview Prep"
        ],
        "llm_status": "connected" if llm else "disconnected"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "InterVue AI",
        "version": "3.0.0",
        "llm_connected": llm is not None,
        "sessions_active": len(sessions),
        "analytics": analytics,
        "timestamp": datetime.now().isoformat()
    }

# ==================== SMART INTERVIEW ====================

@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    job_role: str = Form("General"),
    user: dict = Depends(get_optional_user)
):
    """
    Upload resume and start smart interview
    Returns: Session ID, Analysis, Optimal number of questions, First question
    """
    try:
        logger.info(f"📤 Resume upload: {file.filename}")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="File is empty")
        
        logger.info(f"📄 Parsing resume: {file.filename}")
        resume_text = ResumeParser.parse_resume(content, file.filename)
        
        if not resume_text or len(resume_text) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from resume. Ensure it's a valid PDF or DOCX file."
            )
        
        if not llm:
            raise HTTPException(status_code=503, detail="LLM service unavailable")
        
        # ENHANCED: Analyze resume and determine optimal question count
        logger.info("🤖 Analyzing resume and job match...")
        analysis = llm.analyze_resume_and_job(resume_text, job_description)
        
        num_questions = analysis.get('suggested_questions', 4)
        difficulty = analysis.get('question_difficulty', 'Medium')
        key_topics = analysis.get('key_topics', ['general'])
        
        # ENHANCED: Generate smart questions
        logger.info(f"🎯 Generating {num_questions} adaptive questions...")
        questions = llm.generate_smart_questions(
            resume_text,
            job_role,
            job_description,
            num_questions,
            difficulty,
            key_topics
        )
        
        if not questions:
            logger.warning("⚠️ Using fallback questions")
            questions = [{
                "question": f"Tell us about your experience as a {job_role}",
                "type": "Behavioral",
                "difficulty": "Medium",
                "why_asked": "To understand your background",
                "sample_answer_points": ["Experience", "Skills", "Achievements"],
                "key_topic": "Experience"
            }]
        
        # Save generated questions to question bank
        try:
            save_questions_to_bank(job_role, questions)
        except Exception as qe:
            logger.error(f"⚠️ Question bank save error: {qe}")
        
        # Create session
        session_id = str(uuid.uuid4())
        sessions[session_id] = InterviewSession(
            session_id=session_id,
            job_role=job_role,
            job_description=job_description,
            resume_text=resume_text,
            analysis=analysis,
            questions=questions,
            answers=[],
            current_question_index=0,
            started_at=datetime.now()
        )
        
        analytics["total_sessions"] += 1
        analytics["total_candidates"] += 1
        
        # Save resume to DB if user is authenticated
        if user:
            try:
                db_save_resume(
                    user_id=user['id'],
                    file_name=file.filename,
                    parsed_text=resume_text[:5000],
                    analysis=analysis,
                )
                logger.info(f"✅ Resume saved to DB for user {user['id']}")
            except Exception as db_err:
                logger.error(f"⚠️ Failed to save resume to DB: {db_err}")
        
        logger.info(f"✅ Session created: {num_questions} questions, {difficulty} difficulty")
        
        return {
            "status": "success",
            "session_id": session_id,
            "analysis": analysis,
            "first_question": questions[0] if questions else None,
            "total_questions": len(questions),
            "difficulty": difficulty,
            "learning_focus": analysis.get('learning_focus', 'General preparation'),
            "key_topics": analysis.get('key_topics', []),
            "interview_tips": [
                "Listen carefully to each question",
                "Take a moment before answering",
                "Provide specific examples from your experience",
                "Ask for clarification if needed"
            ]
        }
    
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-resume")
async def analyze_resume_endpoint(
    file: UploadFile = File(...),
    user: dict = Depends(get_optional_user)
):
    """
    Dedicated Resume Scorer Endpoint (Score + ATS + Magic Rewrite).
    Uses One-Shot Prompt strategy via analyze_resume().
    """
    try:
        logger.info(f"📄 Resume Scorer Upload: {file.filename}")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        content = await file.read()
        resume_text = ResumeParser.parse_resume(content, file.filename)
        
        if not resume_text or len(resume_text) < 50:
             raise HTTPException(status_code=400, detail="Could not extract text from file")
             
        # Call the new 3-in-1 Analysis
        analysis = llm.analyze_resume(resume_text)
        
        # Save to DB if user is authenticated
        if user:
            try:
                db_save_resume(
                    user_id=user['id'],
                    file_name=file.filename,
                    parsed_text=resume_text[:5000],  # Limit text size
                    analysis=analysis,
                )
                logger.info(f"✅ Resume saved to DB for user {user['id']}")
            except Exception as db_err:
                logger.error(f"⚠️ Failed to save resume to DB: {db_err}")
        
        return {
            "status": "success", 
            "filename": file.filename,
            "analysis": analysis
        }
        
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"❌ Resume Scorer Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/start-rapid-fire")
async def start_rapid_fire(
    request: RapidFireStartRequest
):
    """
    Start a Rapid Fire interview session (Frontend Compatible)
    """
    try:
        logger.info(f"🔥 Starting Rapid Fire (Frontend) for: {request.job_role}")
        
        if not rapid_fire:
            raise HTTPException(status_code=503, detail="Rapid Fire service unavailable")
        
        # Generate questions
        num_q = max(3, min(request.num_questions, 20))
        questions = rapid_fire.generate_rapid_fire_questions(llm, request.job_role, num_q)
        config = rapid_fire.get_config()
        
        # Save generated questions to question bank
        try:
            save_questions_to_bank(request.job_role, questions)
        except Exception as qe:
            logger.error(f"⚠️ Question bank save error: {qe}")
        
        # Create session
        session_id = str(uuid.uuid4())
        sessions[session_id] = InterviewSession(
            session_id=session_id,
            job_role=request.job_role,
            job_description="Rapid Fire Mode",
            resume_text="N/A",  # Not needed for Rapid Fire
            analysis={"mode": "rapid_fire"},
            questions=questions,
            answers=[],
            current_question_index=0,
            started_at=datetime.now(),
            mode="rapid_fire"
        )
        
        analytics["total_sessions"] += 1
        
        return {
            "status": "success",
            "session_id": session_id,
            "interview_id": session_id,  # Frontend expects this key
            "mode": "rapid_fire",
            "config": config,
            "first_question": questions[0] if questions else None,
            "questions_list": questions, # ADDED: Required for Voice Mode (Offline)
            "total_questions": len(questions),
            "interview_tips": [
                "Keep answers concise",
                "You have 60 seconds per question",
                "Focus on key points",
                "Stay calm under pressure"
            ]
        }

    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rapid-fire/{session_id}/submit-answer")
async def submit_rapid_fire_answer(session_id: str, user_ans: Answer):
    """
    Rapid Fire specific submission endpoint to match frontend route
    """
    return await submit_answer(session_id, user_ans)

class VoiceBatchRequest(BaseModel):
    session_id: str
    job_role: str
    answers: list

@app.post("/submit-voice-batch")
async def submit_voice_batch(request: VoiceBatchRequest):
    """
    One-Shot Voice Interview Evaluation (1 API Call)
    """
    try:
        logger.info(f"🎙️ Voice Batch Submission: {len(request.answers)} answers for {request.job_role}")
        
        # 1. Single API Call for Full Report
        evaluation = llm.evaluate_interview_batch(request.answers, request.job_role)
        
        # 2. Update Analytics
        analytics["questions_answered"] += len(request.answers)
        analytics["interviews_completed"] += 1
        
        return {
            "status": "completed",
            "finalReport": {
                "recommendation": evaluation["overall_report"]["rating"],
                "overall_summary": evaluation["overall_report"]["summary"],
                "estimated_interview_success_rate": f"{int(evaluation['overall_report']['average_score'] * 10)}%"
            },
            "summary": {
                "average_score": evaluation["overall_report"]["average_score"],
                "total_questions": len(request.answers),
                "duration": "10 min", # Estimation
                "estimated_readiness": evaluation["overall_report"]["rating"]
            },
            "learningReport": {
                "overall_assessment": evaluation["overall_report"]["summary"],
                "confidence_level": int(evaluation["overall_report"]["average_score"]),
                "strengths_demonstrated": evaluation["overall_report"]["strengths"],
                "areas_for_improvement": evaluation["overall_report"]["improvements"]
            }
        }

    except Exception as e:
        logger.error(f"❌ Voice Batch Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit-answer/{session_id}")
async def submit_answer(session_id: str, user_ans: Answer):
    """
    Submit answer with enhanced feedback and learning insights
    """
    try:
        logger.info(f"📝 Answer submission: {session_id}")
        
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[session_id]
        idx = session.current_question_index
        
        if idx >= len(session.questions):
            return {"status": "completed"}
        
        if not user_ans.answer or len(user_ans.answer.strip()) < 1:
            # Allow short answers in rapid fire, but warn if empty
            if len(user_ans.answer.strip()) == 0:
                 raise HTTPException(status_code=400, detail="Answer cannot be empty")
        
        # ENHANCED: Get detailed feedback with learning insights
        current_q = session.questions[idx]
        
        if session.mode == "rapid_fire":
             # BATCH MODE: No detailed evaluation during the interview for speed
             # Just a placeholder to signal "received"
             evaluation = {
                 "score": 0,
                 "feedback": "Answer saved.",
                 "confidence_indicator": "N/A"
             }
        else:
             # Standard LLM Evaluation
             logger.info("🤖 Evaluating answer with learning insights...")
             evaluation = llm.evaluate_answer_with_feedback(
                current_q["question"],
                user_ans.answer,
                current_q.get("type", "General"),
                current_q.get("sample_answer_points", [])
             )
        
        # Store answer
        session.answers.append({
            "question": current_q["question"],
            "answer": user_ans.answer,
            "evaluation": evaluation,
            "question_details": {
                "type": current_q.get("type"),
                "difficulty": current_q.get("difficulty"),
                "key_topic": current_q.get("key_topic"),
                "why_asked": current_q.get("why_asked")
            },
            "answered_at": datetime.now().isoformat()
        })
        
        session.current_question_index += 1
        
        # Check if completed
        if session.current_question_index >= len(session.questions):
            logger.info("🏆 Interview complete, generating report...")
            
            # Handle Rapid Fire Completion
            if session.mode == "rapid_fire":
                 session.completed_at = datetime.now()
                 
                 # ⚡ KEY CHANGE: Batch Evaluation at the END
                 logger.info("⚡ Performing Batch AI Evaluation...")
                 batch_report = llm.evaluate_interview_batch(session.answers, session.job_role)
                 
                 # Merge batch scores back into the answers list for consistency
                 question_evals = batch_report.get('question_evaluations', [])
                 scores = []
                 for i, ans in enumerate(session.answers):
                     if i < len(question_evals):
                         ans['evaluation'] = question_evals[i] # Update with AI score
                         # Extract score safely
                         try:
                             s = int(question_evals[i].get('score', 0))
                         except:
                             s = 0
                         scores.append(s)
                     else:
                         scores.append(0)
                 
                 # Prepare final results for frontend
                 final_results = batch_report.get('overall_report', {})
                 final_results['scores'] = scores
                 final_results['best_score'] = max(scores) if scores else 0
                 final_results['worst_score'] = min(scores) if scores else 0
                 final_results['total_questions'] = len(session.answers)
                 
                 duration = (session.completed_at - session.started_at).total_seconds()
                 final_results['total_time_seconds'] = duration

                 analytics["completed_interviews"] += 1
                 
                 return {
                     "status": "completed",
                     "mode": "rapid_fire",
                     "results": final_results,
                     "interview_summary": {
                        "total_questions": len(session.answers),
                        "average_score": final_results.get('average_score', 0),
                        "rating": final_results.get('rating', 'N/A'),
                        "message": final_results.get('summary', 'Completed')
                     }
                 }
            
            # Standard Mode Completion
            avg_score = sum(a["evaluation"].get("score", 0) for a in session.answers) / len(session.answers)
            
            # ENHANCED: Generate learning report instead of just hiring decision
            learning_report = llm.generate_learning_report(
                session.answers,
                session.analysis,
                session.job_role
            )
            
            final_report = llm.generate_final_report(
                session.answers,
                int(avg_score),
                session.analysis
            )
            
            analytics["completed_interviews"] += 1
            analytics["average_score"] = (
                (analytics["average_score"] * (analytics["completed_interviews"] - 1) + avg_score)
                / analytics["completed_interviews"]
            )
            
            session.completed_at = datetime.now()
            session.final_report = final_report
            
            return {
                "status": "completed",
                "evaluation": evaluation,
                "final_report": final_report,
                "learning_report": learning_report,
                "interview_summary": {
                    "total_questions": len(session.questions),
                    "average_score": round(avg_score, 2),
                    "duration": str(session.completed_at - session.started_at),
                    "difficulty_level": session.analysis.get('question_difficulty'),
                    "estimated_readiness": learning_report.get('estimated_readiness', '2 weeks prep')
                },
                "next_steps": learning_report.get('next_steps', [])
            }
        
        # More questions
        next_question = session.questions[session.current_question_index]
        
        return {
            "status": "success",
            "evaluation": evaluation,
            "learning_insight": evaluation.get('how_to_improve'),
            "real_interview_tip": evaluation.get('real_interview_tip'),
            "follow_up_topic": evaluation.get('follow_up_topic'),
            "next_question": next_question,
            "progress": {
                "current": session.current_question_index + 1,
                "total": len(session.questions)
            }
        }
    
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session details"""
    try:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[session_id]
        return {
            "status": "success",
            "session": {
                "session_id": session.session_id,
                "job_role": session.job_role,
                "difficulty": session.analysis.get('question_difficulty'),
                "current_question": session.current_question_index,
                "total_questions": len(session.questions),
                "started_at": session.started_at.isoformat(),
                "completed_at": session.completed_at.isoformat() if session.completed_at else None
            }
        }
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics")
async def get_analytics():
    """Get platform analytics"""
    return {
        "status": "success",
        "analytics": analytics,
        "insights": {
            "avg_interview_length": f"{analytics['total_sessions'] / max(1, analytics['completed_interviews'])} questions" if analytics['completed_interviews'] > 0 else "N/A",
            "platform_rating": f"{analytics['average_score']:.1f}/10" if analytics['completed_interviews'] > 0 else "N/A"
        }
    }

# ==================== USER API ENDPOINTS ====================

@app.get("/api/user/profile")
async def get_user_profile(user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    try:
        profile = get_profile(user['id'])
        return {
            "status": "success",
            "profile": profile,
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "avatar": user['avatar'],
            }
        }
    except Exception as e:
        logger.error(f"Profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/stats")
async def get_user_stats_endpoint(user: dict = Depends(get_current_user)):
    """Get user's aggregated statistics for dashboard"""
    try:
        stats = get_user_stats(user['id'])
        return {"status": "success", "stats": stats}
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/interviews")
async def get_user_interviews_endpoint(
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get user's interview history"""
    try:
        interviews = get_user_interviews(user['id'], limit)
        return {"status": "success", "interviews": interviews}
    except Exception as e:
        logger.error(f"Interviews error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class SaveInterviewRequest(BaseModel):
    mode: str = "standard"
    job_role: str = ""
    job_description: str = ""
    questions: list = []
    answers: list = []
    score: float = 0
    final_report: dict = {}
    learning_report: dict = {}
    duration_seconds: int = 0
    resume_id: Optional[str] = None


@app.post("/api/user/save-interview")
async def save_user_interview(
    request: SaveInterviewRequest,
    user: dict = Depends(get_current_user)
):
    """Save a completed interview to user's history"""
    try:
        result = db_save_interview(user['id'], request.dict())
        if result:
            return {"status": "success", "interview": result}
        else:
            raise HTTPException(status_code=500, detail="Failed to save interview")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save interview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/resumes")
async def get_user_resumes_endpoint(user: dict = Depends(get_current_user)):
    """Get user's saved resumes"""
    try:
        resumes = get_user_resumes(user['id'])
        return {"status": "success", "resumes": resumes}
    except Exception as e:
        logger.error(f"Resumes error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/learning")
async def get_user_learning_endpoint(user: dict = Depends(get_current_user)):
    """Get personalized learning data for dashboard"""
    try:
        interviews = get_user_interviews(user['id'], limit=100)
        resumes = get_user_resumes(user['id'])
        qb_count = get_question_bank_count()
        
        learning_data = get_full_learning_data(interviews, resumes, qb_count)
        return {"status": "success", **learning_data}
    except Exception as e:
        logger.error(f"Learning data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTPException: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "detail": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "detail": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

# ==================== RUN ====================

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting InterVue AI Enhanced...")
    print("\n" + "="*70)
    print("🚀 InterVue AI - Enhanced Interview Platform v3.0")
    print("="*70)
    print("Features:")
    print("  ✅ Smart Question Generation (3-6 questions based on analysis)")
    print("  ✅ Adaptive Difficulty Levels")
    print("  ✅ Learning Insights & Real Interview Tips")
    print("  ✅ Confidence Building Feedback")
    print("  ✅ Preparation Recommendations")
    print("="*70)
    print(f"📡 API: http://localhost:8000")
    print(f"📚 Docs: http://localhost:8000/docs")
    print("="*70 + "\n")
    
    uvicorn.run(
        "__main__:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )