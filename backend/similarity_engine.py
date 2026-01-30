import re
from typing import Dict, Tuple, List
from difflib import SequenceMatcher
import logging

logger = logging.getLogger(__name__)

class SimilarityEngine:
    """
    Intelligent similarity detection for job descriptions
    Finds if two jobs are similar enough to reuse cached questions
    """
    
    def __init__(self):
        # Common job role variations and aliases
        self.role_aliases = {
            'python': ['python', 'py', 'python3', 'django', 'flask', 'fastapi'],
            'javascript': ['javascript', 'js', 'node', 'nodejs', 'react', 'vue', 'angular', 'next.js'],
            'java': ['java', 'spring', 'spring boot', 'maven', 'gradle'],
            'golang': ['golang', 'go', 'goland'],
            'rust': ['rust', 'rustlang'],
            'csharp': ['.net', 'csharp', 'c#', 'dotnet'],
            'php': ['php', 'laravel', 'symfony'],
            'backend': ['backend', 'api', 'server', 'services', 'microservices'],
            'frontend': ['frontend', 'ui', 'ux', 'web', 'client'],
            'fullstack': ['fullstack', 'full-stack', 'full stack'],
            'devops': ['devops', 'dev-ops', 'sre', 'infrastructure', 'cloud'],
            'data': ['data', 'ml', 'ai', 'machine learning', 'analytics', 'deep learning'],
            'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter'],
            'senior': ['senior', 'lead', 'principal', 'architect', 'expert', 'staff'],
            'junior': ['junior', 'entry', 'intern', 'graduate', 'fresher'],
            'mid': ['mid', 'mid-level', 'mid level', 'experience'],
        }
        
        # Domain-specific keywords
        self.skill_keywords = {
            'backend': ['api', 'database', 'server', 'sql', 'rest', 'grpc', 'graphql', 'postgresql', 'mongodb'],
            'frontend': ['html', 'css', 'dom', 'responsive', 'accessibility', 'spa', 'component'],
            'devops': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform', 'aws', 'gcp', 'azure'],
            'data': ['pandas', 'numpy', 'sklearn', 'tensorflow', 'spark', 'hadoop'],
            'mobile': ['ios', 'android', 'swift', 'kotlin', 'native'],
            'cloud': ['aws', 'gcp', 'azure', 'heroku', 'lambda', 'serverless'],
        }
    
    def extract_features(self, job_role: str, job_description: str) -> Dict[str, List[str]]:
        """
        Extract important features from job description
        Returns normalized feature set for comparison
        """
        text = (job_role + " " + job_description).lower()
        
        features = {
            'role_types': [],
            'skills': [],
            'level': [],
            'domains': [],
            'keywords': []
        }
        
        # Extract role types
        for role, aliases in self.role_aliases.items():
            if any(alias in text for alias in aliases):
                features['role_types'].append(role)
        
        # Extract level
        if any(word in text for word in ['senior', 'lead', 'principal', 'staff']):
            features['level'].append('senior')
        elif any(word in text for word in ['junior', 'entry', 'intern', 'fresher']):
            features['level'].append('junior')
        elif any(word in text for word in ['mid', 'experienced']):
            features['level'].append('mid')
        else:
            features['level'].append('unspecified')
        
        # Extract domains
        for domain, keywords in self.skill_keywords.items():
            if any(kw in text for kw in keywords):
                features['domains'].append(domain)
        
        # Extract other keywords
        important_keywords = ['scalability', 'performance', 'security', 'testing', 'agile', 'startup', 'startup']
        for kw in important_keywords:
            if kw in text:
                features['keywords'].append(kw)
        
        return features
    
    def calculate_similarity(self, 
                            job_role1: str, 
                            job_desc1: str,
                            job_role2: str, 
                            job_desc2: str) -> Tuple[float, str]:
        """
        Calculate similarity between two job descriptions
        Uses multiple metrics to determine if jobs are similar
        
        Returns:
            (similarity_score 0-100, reason_string)
        """
        # Extract features from both jobs
        features1 = self.extract_features(job_role1, job_desc1)
        features2 = self.extract_features(job_role2, job_desc2)
        
        scores = []
        
        # Score 1: Role type matching (40% weight)
        set1_roles = set(features1['role_types'])
        set2_roles = set(features2['role_types'])
        
        if set1_roles and set2_roles:
            intersection = len(set1_roles & set2_roles)
            union = len(set1_roles | set2_roles)
            role_score = (intersection / union * 100) if union > 0 else 0
        else:
            role_score = 50
        
        # Score 2: Level matching (30% weight)
        level_score = 100 if features1['level'] == features2['level'] else 40
        
        # Score 3: Domain matching (30% weight)
        set1_domains = set(features1['domains'])
        set2_domains = set(features2['domains'])
        
        if set1_domains and set2_domains:
            intersection = len(set1_domains & set2_domains)
            union = len(set1_domains | set2_domains)
            domain_score = (intersection / union * 100) if union > 0 else 0
        else:
            domain_score = 50
        
        # Combine scores with weights
        final_score = (role_score * 0.4) + (level_score * 0.3) + (domain_score * 0.3)
        
        # Determine reason
        if final_score >= 85:
            reason = "Nearly identical roles"
        elif final_score >= 70:
            reason = "Very similar roles"
        elif final_score >= 50:
            reason = "Moderately similar roles"
        elif final_score >= 30:
            reason = "Somewhat related roles"
        else:
            reason = "Very different roles"
        
        logger.info(f"Similarity Score: {final_score:.1f}% - {reason}")
        logger.debug(f"  Roles: {role_score:.0f}%, Level: {level_score:.0f}%, Domains: {domain_score:.0f}%")
        
        return final_score, reason
    
    def should_use_cache(self, similarity_score: float) -> Tuple[bool, str]:
        """
        Decide cache strategy based on similarity score
        
        Returns:
            (should_use_cache, strategy_name)
        """
        if similarity_score >= 85:
            return True, "high_similarity"  # Use cached directly + variations
        elif similarity_score >= 65:
            return True, "medium_similarity"  # Use cached + blend with new
        elif similarity_score >= 40:
            return True, "low_similarity"  # Use some cached patterns only
        else:
            return False, "no_similarity"  # Full API call needed

# Global instance
similarity_engine = SimilarityEngine()