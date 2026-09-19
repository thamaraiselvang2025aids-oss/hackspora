import re
from typing import Optional, Dict

class SpeechIntentExtractor:
    """
    Extracts structured navigation/object search intents from transcribed user speech.
    """
    
    SEARCH_PATTERNS = [
        r"find (?:my |the |a )?([a-zA-Z\s]+)",
        r"where is (?:my |the |a )?([a-zA-Z\s]+)",
        r"look for (?:my |the |a )?([a-zA-Z\s]+)",
        r"locate (?:my |the |a )?([a-zA-Z\s]+)",
        r"is there (?:a |any |the )?([a-zA-Z\s]+)",
        r"search for (?:my |the |a )?([a-zA-Z\s]+)",
        r"scan for (?:my |the |a )?([a-zA-Z\s]+)"
    ]

    def extract_intent(self, text: str) -> Dict[str, Optional[str]]:
        clean_text = text.lower().strip()
        for pattern in self.SEARCH_PATTERNS:
            match = re.search(pattern, clean_text)
            if match:
                target = match.group(1).strip()
                # Remove trailing question marks or punctuation
                target = re.sub(r"[^\w\s]", "", target)
                return {
                    "intent": "SEARCH_OBJECT",
                    "target_object": target,
                    "raw_query": text
                }

        if "obstacle" in clean_text or "path" in clean_text or "clear" in clean_text:
            return {
                "intent": "PATH_CHECK",
                "target_object": None,
                "raw_query": text
            }

        return {
            "intent": "GENERAL_QUERY",
            "target_object": clean_text if len(clean_text) < 20 else None,
            "raw_query": text
        }

intent_extractor = SpeechIntentExtractor()
