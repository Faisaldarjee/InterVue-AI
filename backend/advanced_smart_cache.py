import json
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class SimpleSimilarityCalculator:
    """
    Lightweight similarity calculator (NO external dependencies)
    Calculates similarity between job descriptions
    """
    
    def __init__(self):
        self.role_keywords = {
            'python': ['python', 'py', 'django', 'flask'],
            'javascript': ['javascript', 'js', 'react', 'node'],
            'java': ['java', 'spring'],
            'backend': ['backend', 'api', 'server'],
            'frontend': ['frontend', 'ui', 'react'],
            'devops': ['devops', 'docker', 'kubernetes'],
            'senior': ['senior', 'lead', 'principal'],
            'mid': ['mid', 'experienced'],
            'junior': ['junior', 'entry', 'intern'],
        }
    
    def calculate_similarity(self, job_role1: str, job_desc1: str, job_role2: str, job_desc2: str) -> float:
        """Simple similarity score (0-100%)"""
        text1 = (job_role1 + " " + job_desc1[:300]).lower()
        text2 = (job_role2 + " " + job_desc2[:300]).lower()
        
        # Count matching keywords
        keywords1 = set()
        keywords2 = set()
        
        for role, keywords in self.role_keywords.items():
            if any(kw in text1 for kw in keywords):
                keywords1.add(role)
            if any(kw in text2 for kw in keywords):
                keywords2.add(role)
        
        # Calculate overlap
        if not keywords1 or not keywords2:
            return 50.0  # Default if no keywords found
        
        intersection = len(keywords1 & keywords2)
        union = len(keywords1 | keywords2)
        
        return (intersection / union) * 100 if union > 0 else 50.0


class AdvancedSmartCache:
    """
    Enterprise-grade intelligent cache system
    NO external dependencies - Pure Python implementation
    """
    
    def __init__(self, ttl_hours=24, max_cache_size=500):
        # SEPARATE CACHES
        self.questions_cache = {}
        self.analysis_cache = {}
        
        self.similar_pool = []
        self.max_cache_size = max_cache_size
        self.ttl = ttl_hours * 3600
        
        # Statistics
        self.stats = {
            'exact_hits': 0,
            'similar_hits': 0,
            'cache_misses': 0,
            'total_api_calls': 0,
            'api_calls_saved': 0,
            'cost_saved': 0.0,
            'total_requests': 0
        }
        
        self.last_api_call_time = None
        self.api_call_cooldown = 0.5
        
        # Similarity calculator (NO external dependency)
        self.similarity = SimpleSimilarityCalculator()
        
        logger.info("🚀 Advanced Smart Cache initialized (PRODUCTION)")
    
    def _create_fingerprint(self, job_role: str, job_description: str) -> str:
        """Create unique fingerprint"""
        text = f"{job_role}|{job_description}".lower().strip()
        return hashlib.sha256(text.encode()).hexdigest()
    
    def _create_analysis_key(self, job_description: str) -> str:
        """Create key for analysis"""
        text = job_description[:500].lower().strip()
        return hashlib.sha256(text.encode()).hexdigest()
    
    def _can_make_api_call(self) -> bool:
        """Check rate limiting"""
        if self.last_api_call_time is None:
            return True
        time_since_last = (datetime.now() - self.last_api_call_time).total_seconds()
        return time_since_last >= self.api_call_cooldown
    
    def _cleanup_expired(self):
        """Remove expired entries"""
        current_time = datetime.now()
        
        expired_keys = [k for k, v in self.questions_cache.items() if current_time > v['expires_at']]
        for key in expired_keys:
            del self.questions_cache[key]
        
        expired_keys = [k for k, v in self.analysis_cache.items() if current_time > v['expires_at']]
        for key in expired_keys:
            del self.analysis_cache[key]
    
    # ===== QUESTIONS CACHE =====
    
    def save_questions(self, questions: List[Dict], job_role: str, job_description: str, difficulty: str) -> str:
        """Save questions to cache"""
        fingerprint = self._create_fingerprint(job_role, job_description)
        
        cache_entry = {
            'fingerprint': fingerprint,
            'job_role': job_role,
            'job_description': job_description,
            'difficulty': difficulty,
            'questions': questions,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(seconds=self.ttl),
            'access_count': 0,
            'cache_type': 'questions'
        }
        
        self.questions_cache[fingerprint] = cache_entry
        
        self.similar_pool.append({
            'fingerprint': fingerprint,
            'entry': cache_entry,
            'accessed_at': datetime.now(),
            'cache_type': 'questions'
        })
        
        if len(self.similar_pool) > self.max_cache_size:
            self.similar_pool.sort(key=lambda x: x['accessed_at'], reverse=True)
            self.similar_pool = self.similar_pool[:self.max_cache_size]
        
        logger.info(f"💾 Questions saved: {job_role} ({difficulty})")
        return fingerprint
    
    def get_exact_questions(self, job_role: str, job_description: str, difficulty: str) -> Optional[List[Dict]]:
        """Get exact match"""
        fingerprint = self._create_fingerprint(job_role, job_description)
        
        if fingerprint not in self.questions_cache:
            return None
        
        entry = self.questions_cache[fingerprint]
        
        if datetime.now() > entry['expires_at']:
            del self.questions_cache[fingerprint]
            self.stats['cache_misses'] += 1
            return None
        
        if entry['difficulty'] != difficulty:
            return None
        
        entry['access_count'] += 1
        self.stats['exact_hits'] += 1
        self.stats['api_calls_saved'] += 1
        self.stats['cost_saved'] += 0.001
        
        logger.info(f"✅ EXACT CACHE HIT: {job_role}")
        return entry['questions']
    
    def get_similar_questions(self, job_role: str, job_description: str, difficulty: str, threshold: float = 65.0) -> Optional[Tuple[List[Dict], float]]:
        """Find similar match"""
        best_match = None
        best_score = 0
        best_entry = None
        
        for pool_item in self.similar_pool:
            if pool_item.get('cache_type') != 'questions':
                continue
            
            entry = pool_item['entry']
            
            if entry['difficulty'] != difficulty:
                continue
            
            if entry['access_count'] > 5:
                continue
            
            # Calculate similarity (NO external dependency)
            similarity_score = self.similarity.calculate_similarity(
                job_role, job_description,
                entry['job_role'], entry['job_description']
            )
            
            if similarity_score > best_score:
                best_score = similarity_score
                best_match = entry
                best_entry = pool_item
        
        if best_match is None or best_score < threshold:
            self.stats['cache_misses'] += 1
            return None, 0
        
        best_match['access_count'] += 1
        best_entry['accessed_at'] = datetime.now()
        
        if best_score >= 80:
            savings = 0.0008
        elif best_score >= 70:
            savings = 0.0005
        else:
            savings = 0.0003
        
        self.stats['similar_hits'] += 1
        self.stats['api_calls_saved'] += 0.5
        self.stats['cost_saved'] += savings
        
        logger.info(f"🔗 SIMILAR CACHE HIT: {best_score:.1f}% similarity")
        return best_match['questions'], best_score
    
    # ===== ANALYSIS CACHE =====
    
    def save_analysis(self, analysis: Dict, job_description: str) -> str:
        """Save analysis"""
        analysis_key = self._create_analysis_key(job_description)
        
        cache_entry = {
            'analysis_key': analysis_key,
            'job_description': job_description[:500],
            'analysis': analysis,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(seconds=self.ttl),
            'access_count': 0,
            'cache_type': 'analysis'
        }
        
        self.analysis_cache[analysis_key] = cache_entry
        
        logger.info(f"💾 Analysis saved")
        return analysis_key
    
    def get_exact_analysis(self, job_description: str) -> Optional[Dict]:
        """Get exact analysis match"""
        analysis_key = self._create_analysis_key(job_description)
        
        if analysis_key not in self.analysis_cache:
            return None
        
        entry = self.analysis_cache[analysis_key]
        
        if datetime.now() > entry['expires_at']:
            del self.analysis_cache[analysis_key]
            return None
        
        entry['access_count'] += 1
        self.stats['exact_hits'] += 1
        self.stats['api_calls_saved'] += 1
        self.stats['cost_saved'] += 0.0005
        
        logger.info(f"✅ ANALYSIS CACHE HIT")
        return entry['analysis']
    
    # ===== SMART RESPONSE =====
    
    def get_smart_response(self, job_role: str, job_description: str, difficulty: str) -> Tuple[Optional[List[Dict]], str]:
        """Get smart response"""
        self.stats['total_requests'] += 1
        
        # Try exact first
        exact = self.get_exact_questions(job_role, job_description, difficulty)
        if exact:
            return exact, "exact_match"
        
        # Try similarity
        similar, similarity_score = self.get_similar_questions(job_role, job_description, difficulty, threshold=65.0)
        
        if similar:
            if similarity_score >= 80:
                return similar, "high_similarity"
            else:
                return similar, "medium_similarity"
        
        logger.info(f"❌ No cache match")
        return None, "no_match"
    
    # ===== UTILITY =====
    
    def record_api_call(self):
        """Record API call"""
        self.last_api_call_time = datetime.now()
        self.stats['total_api_calls'] += 1
        logger.info(f"🔄 API call recorded")
    
    def stats_summary(self) -> Dict[str, Any]:
        """Get stats"""
        self._cleanup_expired()
        
        total_requests = self.stats['total_requests']
        cache_hits = self.stats['exact_hits'] + self.stats['similar_hits']
        
        if total_requests > 0:
            hit_rate = (cache_hits / total_requests) * 100
        else:
            hit_rate = 0
        
        return {
            'total_requests': total_requests,
            'exact_hits': self.stats['exact_hits'],
            'similar_hits': self.stats['similar_hits'],
            'total_cache_hits': cache_hits,
            'cache_hit_rate': f"{hit_rate:.1f}%",
            'total_api_calls': self.stats['total_api_calls'],
            'api_calls_saved': f"{self.stats['api_calls_saved']:.0f}",
            'cost_saved_dollars': f"${self.stats['cost_saved']:.2f}",
            'questions_cached': len(self.questions_cache),
            'analysis_cached': len(self.analysis_cache),
            'cache_efficiency': self._calculate_efficiency()
        }
    
    def _calculate_efficiency(self) -> str:
        """Calculate efficiency"""
        if self.stats['total_requests'] == 0:
            return "No data yet"
        
        hit_rate = (self.stats['exact_hits'] + self.stats['similar_hits']) / self.stats['total_requests']
        
        if hit_rate >= 0.8:
            return "Excellent (80%+)"
        elif hit_rate >= 0.6:
            return "Good (60-80%)"
        elif hit_rate >= 0.4:
            return "Fair (40-60%)"
        else:
            return "Warming up (<40%)"
    
    def get_cache_status(self) -> str:
        """Get status"""
        stats = self.stats_summary()
        return (
            f"Cache Status:\n"
            f"  Hit Rate: {stats['cache_hit_rate']}\n"
            f"  Questions: {stats['questions_cached']}\n"
            f"  Analysis: {stats['analysis_cached']}\n"
            f"  Saved: {stats['api_calls_saved']} calls\n"
            f"  Cost: {stats['cost_saved_dollars']}\n"
            f"  Efficiency: {stats['cache_efficiency']}"
        )

# Global instance
advanced_cache = AdvancedSmartCache(ttl_hours=24, max_cache_size=500)