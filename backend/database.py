# -*- coding: utf-8 -*-
"""
Supabase Database Client for InterVue AI
Handles all database operations
"""

import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

try:
    from supabase import Client, create_client
except ImportError:
    Client = Any
    create_client = None

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env", override=False)
load_dotenv(Path(__file__).resolve().parent / ".env", override=False)

# ==================== SUPABASE CLIENT ====================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# Backend MUST use service_role key to bypass RLS (Row Level Security)
# If no service key, fall back to anon key (will work if RLS is loose)
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", SUPABASE_KEY)

if not create_client:
    logger.warning("Supabase SDK not installed. Database features disabled.")
    supabase: Client = None
elif not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.warning("Supabase credentials not found. Database features disabled.")
    supabase: Client = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    logger.info("Supabase client initialized (service role)")


def _db_available() -> bool:
    return supabase is not None


# ==================== PROFILE OPERATIONS ====================
def get_profile(user_id: str):
    """Get user profile"""
    if not _db_available():
        return None
    try:
        result = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None
    except Exception as e:
        logger.error(f"Failed to get profile: {e}")
        return None


def ensure_profile(user: dict):
    """Ensure a profile row exists for an authenticated Supabase user."""
    if not _db_available() or not user or not user.get("id"):
        return None

    existing = get_profile(user["id"])
    if existing:
        return existing

    try:
        payload = {
            "id": user["id"],
            "full_name": user.get("name", "") or "",
            "avatar_url": user.get("avatar", "") or "",
        }
        result = supabase.table("profiles").upsert(payload).execute()
        data = result.data or []
        return data[0] if data else payload
    except Exception as e:
        logger.error(f"Failed to ensure profile: {e}")
        return existing


def update_profile(user_id: str, data: dict):
    """Update user profile"""
    if not _db_available():
        return None
    try:
        result = supabase.table("profiles").update(data).eq("id", user_id).execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to update profile: {e}")
        return None


# ==================== RESUME OPERATIONS ====================
def save_resume(user_id: str, file_name: str, parsed_text: str, analysis: dict, file_url: str = None):
    """Save a resume record"""
    if not _db_available():
        return None
    try:
        result = supabase.table("resumes").insert({
            "user_id": user_id,
            "file_name": file_name,
            "file_url": file_url or "",
            "parsed_text": parsed_text,
            "analysis": analysis,
        }).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to save resume: {e}")
        return None


def get_user_resumes(user_id: str, limit: int = 20):
    """Get user's resumes"""
    if not _db_available():
        return []
    try:
        result = (
            supabase.table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to get resumes: {e}")
        return []


# ==================== INTERVIEW OPERATIONS ====================
def save_interview(user_id: str, data: dict):
    """Save interview session to database"""
    if not _db_available():
        return None
    try:
        record = {
            "user_id": user_id,
            "mode": data.get("mode", "standard"),
            "job_role": data.get("job_role", ""),
            "job_description": data.get("job_description", ""),
            "questions": data.get("questions", []),
            "answers": data.get("answers", []),
            "score": data.get("score", 0),
            "final_report": data.get("final_report", {}),
            "learning_report": data.get("learning_report", {}),
            "duration_seconds": data.get("duration_seconds", 0),
        }
        if data.get("resume_id"):
            record["resume_id"] = data["resume_id"]

        result = supabase.table("interviews").insert(record).execute()

        # Update profile stats
        _update_user_stats(user_id)

        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to save interview: {e}")
        return None


def get_user_interviews(user_id: str, limit: int = 50):
    """Get user's interview history"""
    if not _db_available():
        return []
    try:
        result = (
            supabase.table("interviews")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to get interviews: {e}")
        return []


def get_user_stats(user_id: str):
    """Get aggregated user statistics"""
    try:
        interviews = get_user_interviews(user_id)
        profile = get_profile(user_id)

        if not interviews:
            return {
                "total_interviews": 0,
                "average_score": 0,
                "best_score": 0,
                "total_questions": 0,
                "streak_days": 0,
                "mode_breakdown": {"standard": 0, "rapid-fire": 0, "voice": 0},
                "role_breakdown": {},
                "recent_scores": [],
                "profile": profile,
            }

        scores = [i.get("score", 0) for i in interviews if i.get("score", 0) > 0]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        best_score = max(scores) if scores else 0

        mode_breakdown = {"standard": 0, "rapid-fire": 0, "voice": 0}
        for i in interviews:
            mode = i.get("mode", "standard")
            if mode in mode_breakdown:
                mode_breakdown[mode] += 1
            elif mode == "rapid_fire":
                mode_breakdown["rapid-fire"] += 1
            else:
                mode_breakdown["standard"] += 1

        role_counts = {}
        for i in interviews:
            role = i.get("job_role", "Unknown")
            role_counts[role] = role_counts.get(role, 0) + 1
        role_breakdown = dict(sorted(role_counts.items(), key=lambda x: x[1], reverse=True)[:5])

        recent = interviews[:10]
        recent.reverse()
        recent_scores = [{
            "date": i.get("created_at", "")[:10],
            "score": i.get("score", 0),
            "mode": i.get("mode", "standard"),
        } for i in recent]

        from datetime import datetime, timedelta

        unique_days = set()
        for i in interviews:
            dt = i.get("created_at", "")[:10]
            if dt:
                unique_days.add(dt)

        streak = 0
        today = datetime.utcnow().date()
        for d in range(365):
            check_date = (today - timedelta(days=d)).isoformat()
            if check_date in unique_days:
                streak += 1
            elif d > 0:
                break

        return {
            "total_interviews": len(interviews),
            "average_score": avg_score,
            "best_score": best_score,
            "total_questions": sum(len(i.get("answers", [])) for i in interviews),
            "streak_days": streak,
            "mode_breakdown": mode_breakdown,
            "role_breakdown": role_breakdown,
            "recent_scores": recent_scores,
            "profile": profile,
        }
    except Exception as e:
        logger.error(f"Failed to get user stats: {e}")
        return {"total_interviews": 0, "average_score": 0, "best_score": 0}


def _update_user_stats(user_id: str):
    """Update profile with latest stats"""
    if not _db_available():
        return
    try:
        interviews = get_user_interviews(user_id)
        scores = [i.get("score", 0) for i in interviews if i.get("score", 0) > 0]
        best = max(scores) if scores else 0

        supabase.table("profiles").update({
            "total_interviews": len(interviews),
            "best_score": best,
        }).eq("id", user_id).execute()
    except Exception as e:
        logger.error(f"Failed to update user stats: {e}")


# ==================== QUESTION BANK OPERATIONS ====================
def save_questions_to_bank(job_role: str, questions: list):
    """Save generated questions to the question_bank table (deduplicates)"""
    if not _db_available() or not questions:
        return 0

    saved = 0
    for q in questions:
        question_text = q.get("question", "") if isinstance(q, dict) else str(q)
        if not question_text or len(question_text) < 10:
            continue

        try:
            existing = (
                supabase.table("question_bank")
                .select("id")
                .eq("job_role", job_role)
                .eq("question", question_text)
                .execute()
            )

            if existing.data and len(existing.data) > 0:
                continue

            record = {
                "job_role": job_role,
                "question": question_text,
                "type": q.get("type", "general") if isinstance(q, dict) else "general",
                "difficulty": q.get("difficulty", "medium") if isinstance(q, dict) else "medium",
                "times_asked": 0,
                "avg_score": 0,
            }
            supabase.table("question_bank").insert(record).execute()
            saved += 1
        except Exception as e:
            logger.error(f"Failed to save question: {e}")
            continue

    if saved > 0:
        logger.info(f"Saved {saved} new questions to bank for '{job_role}'")
    return saved


def get_question_bank_count() -> int:
    """Get total count of questions in the bank"""
    if not _db_available():
        return 0
    try:
        result = supabase.table("question_bank").select("id", count="exact").execute()
        return result.count or 0
    except Exception as e:
        logger.error(f"Failed to get question bank count: {e}")
        return 0


# ==================== UPLOAD RESUME FILE ====================
def upload_resume_file(user_id: str, file_bytes: bytes, file_name: str):
    """Upload resume file to Supabase Storage"""
    if not _db_available():
        return None
    try:
        path = f"{user_id}/{file_name}"
        supabase.storage.from_("resumes").upload(path, file_bytes, {
            "content-type": "application/pdf",
            "upsert": "true",
        })
        file_url = supabase.storage.from_("resumes").get_public_url(path)
        return file_url
    except Exception as e:
        logger.error(f"Failed to upload resume file: {e}")
        return None
