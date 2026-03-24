import os
import json
import logging
from typing import Optional, Dict, Any, List
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GroqJobService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                logger.info("✅ Groq Llama 3.3 Engine Initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Groq client: {e}")
        else:
            logger.warning("⚠️ GROQ_API_KEY not found in environment")

    def _chat(self, system_prompt: str, user_prompt: str, model: str = "llama-3.3-70b-versatile", max_tokens: int = 1500) -> Dict[str, Any]:
        """
        Low-level chat method to communicate with Groq. Always attempts to return JSON.
        """
        if not self.client:
            return {"raw": "Groq client not initialized. Check GROQ_API_KEY."}

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt + " Output ONLY valid JSON."},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=max_tokens,
                top_p=1,
                stream=False,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except json.JSONDecodeError as jde:
            logger.error(f"❌ Groq JSON Decode Error: {jde}")
            # Try to extract JSON from text if possible
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            return {"raw": content}
        except Exception as e:
            logger.error(f"❌ Groq Chat Error: {e}")
            return {"raw": str(e)}

    def evaluate_batch(self, prompt: str) -> Dict[str, Any]:
        """Specific method for Rapid Fire batch evaluation"""
        system = "You are an expert interviewer evaluating a speedy Rapid Fire session. Output ONLY valid JSON matching the requested structure perfectly."
        return self._chat(system, prompt, max_tokens=2000)

    def generate_questions(self, prompt: str) -> List[Dict[str, Any]]:
        """Specific method for Rapid Fire question bank generation"""
        system = "You are an expert technical interviewer. Output ONLY a valid JSON array of question objects."
        result = self._chat(system, prompt, max_tokens=3000)
        
        if isinstance(result, list):
            return result
        if isinstance(result, dict) and 'questions' in result:
            return result['questions']
        if isinstance(result, dict) and not result.get('raw'):
             return [result]
             
        return []
