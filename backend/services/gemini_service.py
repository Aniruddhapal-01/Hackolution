import os
import json
import logging
import google.generativeai as genai
from typing import List, Dict

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        # Explicitly load .env file
        load_dotenv()
        
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        
        # Guard against 2.5 typo and other future non-existent versions
        if "2.5" in self.model_name:
            self.model_name = "gemini-1.5-flash"
        
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            self.enabled = True
        else:
            self.enabled = False
            logger.warning("Gemini API key not configured. LLM features will be disabled.")

    def generate_edge_cases(self, project_name: str, project_description: str) -> List[Dict]:
        """
        Generates a list of possible adversarial edge-case scenarios using Gemini.
        """
        if not self.enabled:
            # Fallback mock scenarios
            return [
                {"scenario": "Heavy Fog at Dawn", "reason": "Low contrast makes object detection difficult."},
                {"scenario": "Rain on Camera Lens", "reason": "Refraction distorts the input image."}
            ]

        prompt = f"""
        You are an adversarial AI safety engineer. Your task is to brainstorm edge-case environmental scenarios 
        that would stress-test an AI vision system for a project named '{project_name}'.
        Project Description: {project_description}

        Think about physics-based stressors (lighting, weather, occlusion, motion, sensor noise).
        Return a JSON list of objects with "scenario" (short title) and "reason" (why it's a blind spot).
        Be creative and specific to the project context.
        Return ONLY valid JSON.
        """

        try:
            response = self.model.generate_content(prompt)
            # Find JSON block in response
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error calling Gemini: {e}")
            return [{"scenario": "System Error", "reason": "Could not connect to LLM node."}]

# Singleton instance
gemini_service = GeminiService()
