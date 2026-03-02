# -*- coding: utf-8 -*-
"""
Smart Learning Module for InterVue AI
Analyzes user interview history to provide:
- Skill breakdown (radar chart data)
- Weak areas identification
- Practice recommendations
- XP & Level system
- Achievement badges
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


# ==================== SKILL CATEGORIES ====================
SKILL_CATEGORIES = {
    "Technical": ["technical", "coding", "programming", "algorithm", "data structure", "api", "database", "sql", "python", "javascript", "system"],
    "Behavioral": ["behavioral", "teamwork", "leadership", "conflict", "motivation", "experience", "challenge", "achievement"],
    "Problem Solving": ["problem", "solve", "approach", "debug", "optimize", "design", "architecture", "trade-off", "scenario"],
    "Communication": ["explain", "communicate", "present", "describe", "walk through", "tell me", "discuss"],
    "Domain Knowledge": ["domain", "industry", "business", "product", "analytics", "data", "machine learning", "cloud", "devops"]
}


# ==================== LEVEL SYSTEM ====================
LEVELS = [
    {"name": "Beginner", "min_xp": 0, "icon": "🌱", "color": "slate"},
    {"name": "Learner", "min_xp": 100, "icon": "📘", "color": "blue"},
    {"name": "Intermediate", "min_xp": 300, "icon": "⚡", "color": "yellow"},
    {"name": "Advanced", "min_xp": 600, "icon": "🔥", "color": "orange"},
    {"name": "Expert", "min_xp": 1000, "icon": "💎", "color": "purple"},
    {"name": "Master", "min_xp": 1500, "icon": "👑", "color": "gold"},
]


# ==================== ACHIEVEMENTS ====================
ACHIEVEMENTS = [
    {"id": "first_interview", "name": "First Steps", "icon": "🎯", "description": "Complete your first interview", "condition": lambda stats: stats["total_interviews"] >= 1},
    {"id": "five_interviews", "name": "Getting Serious", "icon": "🔥", "description": "Complete 5 interviews", "condition": lambda stats: stats["total_interviews"] >= 5},
    {"id": "ten_interviews", "name": "Interview Pro", "icon": "⭐", "description": "Complete 10 interviews", "condition": lambda stats: stats["total_interviews"] >= 10},
    {"id": "perfect_score", "name": "Perfect Round", "icon": "💯", "description": "Score 10/10 on any answer", "condition": lambda stats: stats["best_score"] >= 10},
    {"id": "high_scorer", "name": "High Achiever", "icon": "🏆", "description": "Average score above 8", "condition": lambda stats: stats["avg_score"] >= 8},
    {"id": "rapid_fire_fan", "name": "Speed Demon", "icon": "⚡", "description": "Complete 3 Rapid Fire sessions", "condition": lambda stats: stats["rapid_fire_count"] >= 3},
    {"id": "multi_role", "name": "Versatile", "icon": "🎭", "description": "Practice 3+ different roles", "condition": lambda stats: stats["unique_roles"] >= 3},
    {"id": "resume_uploaded", "name": "Profile Builder", "icon": "📄", "description": "Upload your first resume", "condition": lambda stats: stats["resume_count"] >= 1},
    {"id": "streak_3", "name": "On a Roll", "icon": "🔥", "description": "Practice 3 days in a row", "condition": lambda stats: stats["streak"] >= 3},
    {"id": "streak_7", "name": "Unstoppable", "icon": "💪", "description": "Practice 7 days in a row", "condition": lambda stats: stats["streak"] >= 7},
    {"id": "improver", "name": "Growth Mindset", "icon": "📈", "description": "Improve score by 2+ points", "condition": lambda stats: stats["improvement"] >= 2},
]


# ==================== CORE FUNCTIONS ====================

def get_skill_breakdown(interviews: list) -> dict:
    """
    Analyze interviews to build skill radar chart data.
    Returns scores for each skill category (0-100).
    """
    if not interviews:
        return {cat: 0 for cat in SKILL_CATEGORIES}

    category_scores = {cat: [] for cat in SKILL_CATEGORIES}

    for interview in interviews:
        questions = interview.get('questions', [])
        score = interview.get('score', 0)
        job_role = interview.get('job_role', '').lower()
        final_report = interview.get('final_report', {})

        # Try to categorize by question type/content
        for q in (questions if isinstance(questions, list) else []):
            q_text = (q.get('question', '') if isinstance(q, dict) else str(q)).lower()
            q_type = (q.get('type', '') if isinstance(q, dict) else '').lower()

            for category, keywords in SKILL_CATEGORIES.items():
                if any(kw in q_text or kw in q_type for kw in keywords):
                    category_scores[category].append(score * 10)  # Scale to 0-100
                    break

        # If no questions categorized, use overall score for Domain Knowledge
        if not any(category_scores[cat] for cat in category_scores):
            category_scores["Domain Knowledge"].append(score * 10)

    # Calculate averages
    result = {}
    for cat, scores in category_scores.items():
        if scores:
            result[cat] = min(100, round(sum(scores) / len(scores)))
        else:
            result[cat] = 0

    return result


def get_weak_areas(interviews: list) -> list:
    """
    Identify weak areas from interview history.
    Returns list of weak topics with improvement suggestions.
    """
    if not interviews:
        return [{"area": "No data yet", "tip": "Complete some interviews to see your weak areas!", "severity": "info"}]

    skill_scores = get_skill_breakdown(interviews)

    # Find areas below 60%
    weak = []
    for skill, score in sorted(skill_scores.items(), key=lambda x: x[1]):
        if score < 60:
            severity = "critical" if score < 30 else "warning"
            tips = {
                "Technical": "Practice coding problems on LeetCode/HackerRank. Review core CS concepts.",
                "Behavioral": "Use the STAR method (Situation, Task, Action, Result) for every answer.",
                "Problem Solving": "Break problems into smaller steps. Think aloud during interviews.",
                "Communication": "Structure your answers clearly. Use examples and be concise.",
                "Domain Knowledge": "Study industry trends and deepen knowledge in your target domain."
            }
            weak.append({
                "area": skill,
                "score": score,
                "tip": tips.get(skill, "Keep practicing!"),
                "severity": severity
            })

    if not weak:
        return [{"area": "Looking great!", "score": 100, "tip": "You're doing well across all areas. Keep it up!", "severity": "success"}]

    return weak[:5]  # Top 5 weakest


def get_practice_recommendations(interviews: list, question_bank_count: int = 0) -> list:
    """
    Generate personalized practice recommendations.
    """
    if not interviews:
        return [
            {"title": "Start Your Journey", "description": "Take your first Rapid Fire interview to get personalized recommendations!", "action": "rapid-fire", "icon": "🚀"},
            {"title": "Upload Resume", "description": "Get your resume scored and start a targeted interview.", "action": "resume", "icon": "📄"},
        ]

    weak_areas = get_weak_areas(interviews)
    roles_practiced = set(i.get('job_role', '') for i in interviews)
    avg_score = sum(i.get('score', 0) for i in interviews) / len(interviews) if interviews else 0

    recs = []

    # Weak area recommendations
    for weak in weak_areas:
        if weak.get("severity") in ("critical", "warning"):
            recs.append({
                "title": f"Improve {weak['area']}",
                "description": weak['tip'],
                "action": "rapid-fire",
                "icon": "🎯",
                "priority": "high" if weak['severity'] == 'critical' else "medium"
            })

    # Score-based recommendations
    if avg_score < 5:
        recs.append({
            "title": "Build Foundations",
            "description": "Focus on understanding core concepts. Try shorter 5-question sessions.",
            "action": "rapid-fire",
            "icon": "📚",
            "priority": "high"
        })
    elif avg_score < 7:
        recs.append({
            "title": "Level Up",
            "description": "You're getting there! Try longer sessions with 10-15 questions.",
            "action": "rapid-fire",
            "icon": "⚡",
            "priority": "medium"
        })
    else:
        recs.append({
            "title": "Challenge Yourself",
            "description": "Try a new role or harder questions to push your limits!",
            "action": "rapid-fire",
            "icon": "🔥",
            "priority": "low"
        })

    # Role diversity recommendation
    if len(roles_practiced) < 3:
        recs.append({
            "title": "Explore New Roles",
            "description": "Try different job roles to broaden your interview skills.",
            "action": "rapid-fire",
            "icon": "🎭",
            "priority": "medium"
        })

    return recs[:5]


def calculate_xp(interviews: list) -> dict:
    """
    Calculate XP and level from interview history.
    XP formula: base 10 per interview + score bonus + mode bonus
    """
    total_xp = 0
    xp_breakdown = []

    for interview in interviews:
        score = interview.get('score', 0)
        mode = interview.get('mode', 'standard')

        # Base XP
        xp = 10

        # Score bonus (0-20 XP)
        xp += int(score * 2)

        # Mode bonus
        if mode == 'rapid-fire' or mode == 'rapid_fire':
            xp += 5  # Rapid fire bonus
        elif mode == 'voice':
            xp += 8  # Voice mode bonus (harder)

        total_xp += xp
        xp_breakdown.append({"xp": xp, "source": f"{mode} interview"})

    # Determine level
    current_level = LEVELS[0]
    next_level = LEVELS[1] if len(LEVELS) > 1 else None

    for i, level in enumerate(LEVELS):
        if total_xp >= level["min_xp"]:
            current_level = level
            next_level = LEVELS[i + 1] if i + 1 < len(LEVELS) else None

    # Progress to next level
    progress = 100
    xp_to_next = 0
    if next_level:
        range_xp = next_level["min_xp"] - current_level["min_xp"]
        current_progress = total_xp - current_level["min_xp"]
        progress = min(100, int((current_progress / range_xp) * 100)) if range_xp > 0 else 100
        xp_to_next = next_level["min_xp"] - total_xp

    return {
        "total_xp": total_xp,
        "level": current_level,
        "next_level": next_level,
        "progress_percent": progress,
        "xp_to_next": max(0, xp_to_next),
    }


def calculate_streak(interviews: list) -> int:
    """Calculate consecutive days of practice."""
    if not interviews:
        return 0

    # Get unique dates of interviews
    dates = set()
    for interview in interviews:
        created = interview.get('created_at', '')
        if created:
            try:
                if isinstance(created, str):
                    dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                else:
                    dt = created
                dates.add(dt.date())
            except:
                pass

    if not dates:
        return 0

    # Count streak from today backwards
    today = datetime.now().date()
    streak = 0
    check_date = today

    while check_date in dates:
        streak += 1
        check_date -= timedelta(days=1)

    # If today not in dates, check from yesterday
    if streak == 0:
        check_date = today - timedelta(days=1)
        while check_date in dates:
            streak += 1
            check_date -= timedelta(days=1)

    return streak


def get_achievements(interviews: list, resumes: list) -> list:
    """
    Calculate which achievements the user has unlocked.
    """
    # Build stats
    scores = [i.get('score', 0) for i in interviews]
    modes = [i.get('mode', '') for i in interviews]
    roles = set(i.get('job_role', '') for i in interviews if i.get('job_role'))

    # Calculate improvement (first 3 vs last 3 average)
    improvement = 0
    if len(scores) >= 6:
        first_avg = sum(scores[:3]) / 3
        last_avg = sum(scores[-3:]) / 3
        improvement = last_avg - first_avg

    stats = {
        "total_interviews": len(interviews),
        "best_score": max(scores) if scores else 0,
        "avg_score": sum(scores) / len(scores) if scores else 0,
        "rapid_fire_count": sum(1 for m in modes if m in ('rapid-fire', 'rapid_fire')),
        "unique_roles": len(roles),
        "resume_count": len(resumes),
        "streak": calculate_streak(interviews),
        "improvement": improvement,
    }

    # Check each achievement
    result = []
    for ach in ACHIEVEMENTS:
        unlocked = ach["condition"](stats)
        result.append({
            "id": ach["id"],
            "name": ach["name"],
            "icon": ach["icon"],
            "description": ach["description"],
            "unlocked": unlocked,
        })

    return result


def get_full_learning_data(interviews: list, resumes: list, question_bank_count: int = 0) -> dict:
    """
    Main function — returns all learning data for the dashboard.
    """
    return {
        "skill_breakdown": get_skill_breakdown(interviews),
        "weak_areas": get_weak_areas(interviews),
        "recommendations": get_practice_recommendations(interviews, question_bank_count),
        "xp": calculate_xp(interviews),
        "streak": calculate_streak(interviews),
        "achievements": get_achievements(interviews, resumes),
        "total_interviews": len(interviews),
        "total_resumes": len(resumes),
        "question_bank_size": question_bank_count,
    }
