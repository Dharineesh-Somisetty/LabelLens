"""Gemini integration with Groq fallback – three structured-output functions.

Uses the official google-genai SDK with Groq as fallback when quota exhausted.
API keys are read from GEMINI_API_KEY and GROQ_API_KEY environment variables.
"""

from __future__ import annotations
import os, json, logging
from typing import List, Dict, Optional

from google import genai
from google.genai import types as genai_types
from groq import Groq

from ..schemas import (
    StructuredIngredientsResult,
    PersonalizedSummaryResult,
    ChatAnswerResult,
    IngredientItem,
    UserProfile,
    AnalysisResult,
    EvidenceSnippet,
)

logger = logging.getLogger("labellens.gemini")

_client: genai.Client | None = None
_groq_client: Groq | None = None

MODEL = "gemini-2.0-flash"
GROQ_MODEL = "llama-3.3-70b-versatile"


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set.")
        _client = genai.Client(api_key=api_key)
    return _client


def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY environment variable is not set.")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def _is_quota_exhausted(error: Exception) -> bool:
    """Check if the error is due to quota exhaustion."""
    err_msg = str(error)
    return "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower()


def _call_groq_with_json_schema(prompt: str, schema_class, temperature: float = 0.1) -> dict:
    """Call Groq with JSON mode and parse according to schema."""
    groq_client = _get_groq_client()
    
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful assistant that outputs valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Groq returned empty response.")
    
    return json.loads(content)


# ──────────────────────────────────────────────
# 1. Structure raw ingredients text
# ──────────────────────────────────────────────
async def gemini_structure_ingredients(ingredients_raw_text: str) -> StructuredIngredientsResult:
    """Ask Gemini to parse raw ingredients text into structured items, fallback to Groq if quota exhausted."""
    
    prompt = f"""You are a food-science expert. Parse the following raw ingredient list into structured data.

For each ingredient:
- name_raw: the exact text from the list
- name_canonical: a normalized English name (lowercase, singular)
- confidence: 0.0-1.0 how sure you are of the identification
- tags: relevant tags like "sweetener", "preservative", "allergen-milk", "animal-derived", "non-vegan", "caffeine-source", "umbrella-term", etc.
- notes: any brief clarification (optional)

Also identify:
- umbrella_terms: vague terms like "natural flavors", "spices", "artificial colors"
- allergen_statements: any "contains" or "may contain" allergen declarations

Raw ingredient text:
\"\"\"
{ingredients_raw_text}
\"\"\"

Return valid JSON with this structure:
{{
  "ingredients": [{{ "name_raw": "...", "name_canonical": "...", "confidence": 0.9, "tags": [], "notes": "" }}],
  "umbrella_terms": [],
  "allergen_statements": []
}}"""

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StructuredIngredientsResult,
                temperature=0.1,
            ),
        )
        if not response.text:
            raise RuntimeError("Gemini returned an empty response for ingredient structuring.")
        parsed = json.loads(response.text)
        return StructuredIngredientsResult(**parsed)
    
    except Exception as e:
        if _is_quota_exhausted(e):
            logger.warning(f"Gemini quota exhausted, falling back to Groq: {e}")
            parsed = _call_groq_with_json_schema(prompt, StructuredIngredientsResult, temperature=0.1)
            return StructuredIngredientsResult(**parsed)
        else:
            raise


# ──────────────────────────────────────────────
# 2. Personalized explanation / summary
# ──────────────────────────────────────────────
async def gemini_personalized_explain(
    user_profile: UserProfile,
    analysis: AnalysisResult,
    evidence: List[EvidenceSnippet],
) -> PersonalizedSummaryResult:
    """Generate a human-like personalized summary using Gemini, fallback to Groq if quota exhausted."""
    
    evidence_text = "\n".join(
        f"[{e.citation_id}] {e.title}: {e.snippet} ({e.source_url})"
        for e in evidence
    )

    flags_text = "\n".join(
        f"- [{f.severity.upper()}] {f.message}" for f in analysis.flags
    )

    ingredients_text = ", ".join(i.name_canonical for i in analysis.ingredients)

    profile_text = json.dumps(user_profile.model_dump(), indent=2)

    prompt = f"""You are LabelLens, a friendly food-science assistant. Write a personalized summary for this user about the product they scanned.

USER PROFILE:
{profile_text}

PRODUCT: {analysis.product.name or 'Unknown'} by {analysis.product.brand or 'Unknown'}

DETECTED INGREDIENTS: {ingredients_text}

FLAGS (from our rules engine – these are facts, do not contradict them):
{flags_text}

EVIDENCE (cite these by ID when relevant):
{evidence_text}

RULES:
- Keep it conversational but accurate.
- Reference specific ingredients and flags.
- Cite evidence using [citation_id] format.
- Include citations_used list with all citation IDs you referenced.
- Do NOT provide medical diagnoses or treatment advice.
- End with a brief takeaway.
- Maximum 300 words.
- Only discuss ingredients that are in the DETECTED INGREDIENTS list above.

Return valid JSON with this structure:
{{
  "summary": "...",
  "citations_used": ["cite_1", "cite_2"]
}}"""

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PersonalizedSummaryResult,
                temperature=0.7,
            ),
        )
        if not response.text:
            raise RuntimeError("Gemini returned an empty response for personalized summary.")
        parsed = json.loads(response.text)
        return PersonalizedSummaryResult(**parsed)
    
    except Exception as e:
        if _is_quota_exhausted(e):
            logger.warning(f"Gemini quota exhausted, falling back to Groq: {e}")
            parsed = _call_groq_with_json_schema(prompt, PersonalizedSummaryResult, temperature=0.7)
            return PersonalizedSummaryResult(**parsed)
        else:
            raise


# ──────────────────────────────────────────────
# 3. Product-locked chat
# ──────────────────────────────────────────────
async def gemini_product_chat(
    session_id: str,
    message: str,
    chat_history: List[dict],
    analysis: AnalysisResult,
    evidence: List[EvidenceSnippet],
) -> ChatAnswerResult:
    """Answer a user question ONLY about the currently scanned product, fallback to Groq if quota exhausted."""
    
    evidence_text = "\n".join(
        f"[{e.citation_id}] {e.title}: {e.snippet} ({e.source_url})"
        for e in evidence
    )

    ingredients_text = ", ".join(i.name_canonical for i in analysis.ingredients)
    flags_text = "\n".join(f"- [{f.severity.upper()}] {f.message}" for f in analysis.flags)

    history_text = "\n".join(
        f"{m.get('role','user').upper()}: {m.get('content','')}" for m in chat_history[-10:]
    )

    prompt = f"""You are LabelLens Chat, a product-locked food-science assistant.
You may ONLY answer questions about this specific product and its ingredients.

PRODUCT: {analysis.product.name or 'Unknown'} by {analysis.product.brand or 'Unknown'}
INGREDIENTS: {ingredients_text}
FLAGS: {flags_text}
EVIDENCE: {evidence_text}

CONVERSATION HISTORY:
{history_text}

USER'S NEW QUESTION: {message}

RULES:
- ONLY answer about this product and its ingredients.
- If the user asks about a different product, politely say you can only discuss the current product.
- If asked a medical question, provide educational information with disclaimer.
- Cite evidence using [citation_id] format.
- Include citations_used list.
- Do NOT fabricate ingredients not listed above.
- Maximum 250 words.

Return valid JSON with this structure:
{{
  "answer": "...",
  "citations_used": ["cite_1"]
}}"""

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ChatAnswerResult,
                temperature=0.7,
            ),
        )
        if not response.text:
            raise RuntimeError("Gemini returned an empty response for chat.")
        parsed = json.loads(response.text)
        return ChatAnswerResult(**parsed)
    
    except Exception as e:
        if _is_quota_exhausted(e):
            logger.warning(f"Gemini quota exhausted, falling back to Groq: {e}")
            parsed = _call_groq_with_json_schema(prompt, ChatAnswerResult, temperature=0.7)
            return ChatAnswerResult(**parsed)
        else:
            raise
